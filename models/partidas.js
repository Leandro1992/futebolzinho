const FirebaseConnection = require('../db');
const cache = require('./cache');

class Partida {
    constructor({ data, local, timeA, timeB, status }) {
        this.data = data;
        this.local = local;
        this.timeA = timeA;
        this.timeB = timeB;
        this.status = status;
    }

    async salvar() {
        try {
          const db = FirebaseConnection.getInstance().db;
    
          // Convertendo IDs de jogadores para referências
          const timeARefs = await Promise.all(this.timeA.map(jogadorRef => db.doc(`jogadores/${jogadorRef.id}`)));
          const timeBRefs = await Promise.all(this.timeB.map(jogadorRef => db.doc(`jogadores/${jogadorRef.id}`)));
    
          const partidaRef = await db.collection('partidas').add({
            data: this.data,
            local: this.local,
            timeA: timeARefs.map(jogadorRef => ({ jogadorRef, gol: 0, assistencia: 0 })),
            timeB: timeBRefs.map(jogadorRef => ({ jogadorRef, gol: 0, assistencia: 0 })),
            status: this.status
          });
    
          // Invalidar cache de partidas e estatísticas
          cache.set('partidas', null);
          cache.set('estatisticasPartidas', null);
    
          return partidaRef.id;
        } catch (error) {
          throw new Error('Erro ao salvar partida: ' + error.message);
        }
      }

    static async obterTodas() {
        const cachedPartidas = cache.get('partidas');
        if (cachedPartidas) {
          return cachedPartidas;
        }
    
        try {
          const db = FirebaseConnection.getInstance().db;
          const partidasSnapshot = await db.collection('partidas').get();
    
          const partidas = await Promise.all(partidasSnapshot.docs.map(async doc => {
            const partidaData = { id: doc.id, ...doc.data() };
            let totalGolsTimeA = 0;
            let totalGolsTimeB = 0;
            let totalAssistenciasTimeB = 0;
            let totalAssistenciasTimeA = 0;
    
            const [timeAPlayers, timeBPlayers] = await Promise.all([
              Promise.all(partidaData.timeA.map(async jogador => {
                const jogadorData = { id: jogador.jogadorRef.id, gol: jogador.gol, assistencia: jogador.assistencia, destaque: jogador.destaque };
                totalGolsTimeA += jogador.gol;
                totalAssistenciasTimeA += jogador.assistencia;
                const jogadorSnapshot = await jogador.jogadorRef.get();
                return { ...jogadorData, ...jogadorSnapshot.data() };
              })),
              Promise.all(partidaData.timeB.map(async jogador => {
                const jogadorData = { id: jogador.jogadorRef.id, gol: jogador.gol, assistencia: jogador.assistencia, destaque: jogador.destaque };
                totalGolsTimeB += jogador.gol;
                totalAssistenciasTimeB += jogador.assistencia;
                const jogadorSnapshot = await jogador.jogadorRef.get();
                return { ...jogadorData, ...jogadorSnapshot.data() };
              }))
            ]);
    
            partidaData.timeA = timeAPlayers;
            partidaData.timeB = timeBPlayers;
            partidaData.totalGolsTimeA = totalGolsTimeA;
            partidaData.totalGolsTimeB = totalGolsTimeB;
            partidaData.totalAssistenciasTimeB = totalAssistenciasTimeB;
            partidaData.totalAssistenciasTimeA = totalAssistenciasTimeA;
    
            return partidaData;
          }));
    
          cache.set('partidas', partidas);
          return partidas;
        } catch (error) {
          throw new Error('Erro ao obter partidas com jogadores: ' + error.message);
        }
    }

    static async obterEstatisticasPartidas() {
        let partidaDados = {};
        let dadosFiltrados = [];

        // Verificar cache
        const cachedEstatisticas = cache.get('estatisticasPartidas');
        if (cachedEstatisticas) {
            return cachedEstatisticas;
        }

        try {
            const db = FirebaseConnection.getInstance().db;
            const partidasSnapshot = await db.collection('partidas').get();

            const partidas = await Promise.all(partidasSnapshot.docs.map(async doc => {
                const partidaData = { id: doc.id, ...doc.data() };
                let totalGolsTimeA = 0;
                let totalGolsTimeB = 0;
                let totalAssistenciasTimeB = 0;
                let totalAssistenciasTimeA = 0;

                const [timeAPlayers, timeBPlayers] = await Promise.all([
                    Promise.all(partidaData.timeA.map(async jogador => {
                        const jogadorData = { id: jogador.jogadorRef.id, gol: jogador.gol, assistencia: jogador.assistencia, destaque: jogador.destaque };
                        totalGolsTimeA += jogador.gol;
                        totalAssistenciasTimeA += jogador.assistencia;
                        const jogadorSnapshot = await jogador.jogadorRef.get();

                        if(!partidaDados[jogador.jogadorRef.id]) partidaDados[jogador.jogadorRef.id] = {
                            jogos: 0,
                            gols:0,
                            assistencia: 0,
                            destaque: 0,
                            vitorias: 0,
                            derrotas: 0,
                            empates: 0
                        }
                        if(jogador.destaque) partidaDados[jogador.jogadorRef.id].destaque++;
                        
                        partidaDados[jogador.jogadorRef.id].jogadorId = jogador.jogadorRef.id
                        partidaDados[jogador.jogadorRef.id].jogos++
                        partidaDados[jogador.jogadorRef.id].gols += jogador.gol;
                        partidaDados[jogador.jogadorRef.id].assistencia += jogador.assistencia;
                        partidaDados[jogador.jogadorRef.id].jogador = jogadorSnapshot.data();
                        console.log("jogador.jogadorRef.id", jogador.jogadorRef.id)
                        
                        return {...jogadorData, ...jogadorSnapshot.data() };
                    })),
                    Promise.all(partidaData.timeB.map(async jogador => {
                        const jogadorData = { id: jogador.jogadorRef.id, gol: jogador.gol, assistencia: jogador.assistencia, destaque: jogador.destaque };
                        totalGolsTimeB += jogador.gol;
                        totalAssistenciasTimeB += jogador.assistencia;
                        const jogadorSnapshot = await jogador.jogadorRef.get();
                        if(!partidaDados[jogador.jogadorRef.id]) partidaDados[jogador.jogadorRef.id] = {
                            jogos: 0,
                            gols:0,
                            assistencia: 0,
                            destaque: 0,
                            vitorias: 0,
                            derrotas: 0,
                            empates: 0
                        }
                        if(jogador.destaque) partidaDados[jogador.jogadorRef.id].destaque++;
                        partidaDados[jogador.jogadorRef.id].jogadorId = jogador.jogadorRef.id
                        partidaDados[jogador.jogadorRef.id].jogos++
                        partidaDados[jogador.jogadorRef.id].gols += jogador.gol;
                        partidaDados[jogador.jogadorRef.id].assistencia += jogador.assistencia;
                        partidaDados[jogador.jogadorRef.id].jogador = jogadorSnapshot.data();
                        console.log("jogador.jogadorRef.id", jogador.jogadorRef.id)
                        
                        return {...jogadorData, ...jogadorSnapshot.data() };
                    }))
                ]);
                partidaData.timeA = timeAPlayers;
                partidaData.timeB = timeBPlayers;
                partidaData.totalGolsTimeA = totalGolsTimeA;
                partidaData.totalGolsTimeB = totalGolsTimeB;
                partidaData.totalAssistenciasTimeB = totalAssistenciasTimeB;
                partidaData.totalAssistenciasTimeA = totalAssistenciasTimeA;
                partidaData.vendedor = "Empate"
                if(totalGolsTimeA > totalGolsTimeB) {
                    partidaData.vendedor = "A"
                }
                if(totalGolsTimeB > totalGolsTimeA) {
                    partidaData.vendedor = "B"
                }

                return partidaData;
            }));

            for (const part of partidas) {
                if(part.vendedor == "A"){
                    for (const jog of part.timeA) {
                        partidaDados[jog.id].vitorias++
                    }
                    for (const jog of part.timeB) {
                        partidaDados[jog.id].derrotas++
                    }
                }
                if(part.vendedor == "B"){
                    for (const jog of part.timeB) {
                        partidaDados[jog.id].vitorias++
                    }
                    for (const jog of part.timeA) {
                        partidaDados[jog.id].derrotas++
                    }
                }
                if(part.vendedor == "Empate"){
                    for (const jog of part.timeA) {
                        partidaDados[jog.id].empates++
                    }
                    for (const jog of part.timeB) {
                        partidaDados[jog.id].empates++
                    }
                }
            }

            for (const key in partidaDados) {
                if (Object.hasOwnProperty.call(partidaDados, key)) {
                    dadosFiltrados.push(partidaDados[key]);
                }
            }
            // Atualizar cache
            cache.set('estatisticasPartidas', dadosFiltrados);  
            
            return dadosFiltrados;
        } catch (error) {
            throw new Error('Erro ao obter partidas com jogadores: ' + error.message);
        }
    }

    static async atualizarPartida({ id, data, local, timeA, timeB, status }) {
        try {
            const db = FirebaseConnection.getInstance().db;
      
            // Convertendo IDs de jogadores para referências
            const timeARefs = await Promise.all(timeA.map(jogadorRef => {
                return {
                    "jogadorRef": db.doc(`jogadores/${jogadorRef.id}`),
                    gol: jogadorRef.gol,
                    assistencia: jogadorRef.assistencia,
                    destaque: jogadorRef?.destaque ? true : false
                }
            }));
 
            const timeBRefs = await Promise.all(timeB.map(jogadorRef => {
                return {
                    "jogadorRef": db.doc(`jogadores/${jogadorRef.id}`),
                    gol: jogadorRef.gol,
                    assistencia: jogadorRef.assistencia,
                    destaque: jogadorRef?.destaque ? true : false
                }
            }));
            await db.collection('partidas').doc(id).update({
                data: data,
                local: local,
                timeA: timeARefs,
                timeB: timeBRefs,
                status: status
            });
            cache.set('estatisticasPartidas', null);
            
            return 'Dados atualizados com sucesso';
          } catch (error) {
            throw new Error('Erro ao atualizar dados do jogador: ' + error.message);
          }
    }
}

module.exports = Partida;
