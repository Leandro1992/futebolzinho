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

      const timeARefs = await Promise.all(this.timeA.map((jogadorRef) => db.doc(`jogadores/${jogadorRef.id}`)));
      const timeBRefs = await Promise.all(this.timeB.map((jogadorRef) => db.doc(`jogadores/${jogadorRef.id}`)));

      const partidaRef = await db.collection('partidas').add({
        data: this.data,
        local: this.local,
        timeA: timeARefs.map((jogadorRef) => ({ jogadorRef, gol: 0, assistencia: 0, golContra: 0 })),
        timeB: timeBRefs.map((jogadorRef) => ({ jogadorRef, gol: 0, assistencia: 0, golContra: 0 })),
        status: this.status,
      });

      cache.delete('partidas');
      cache.deletePrefix('estatisticasPartidas:');

      return partidaRef.id;
    } catch (error) {
      throw new Error('Erro ao salvar partida: ' + error.message);
    }
  }

  static async obterTodas() {
    const cachedPartidas = cache.get('partidas');
    if (cachedPartidas !== null) {
      return cachedPartidas;
    }

    try {
      const db = FirebaseConnection.getInstance().db;
      const partidasSnapshot = await db.collection('partidas').get();

      const partidas = await Promise.all(
        partidasSnapshot.docs.map(async (doc) => {
          const partidaData = { id: doc.id, ...doc.data() };
          let totalGolsTimeA = 0;
          let totalGolsTimeB = 0;
          let totalAssistenciasTimeA = 0;
          let totalAssistenciasTimeB = 0;
          let totalGolsContraTimeA = 0;
          let totalGolsContraTimeB = 0;

          const [timeAPlayers, timeBPlayers] = await Promise.all([
            Promise.all(
              partidaData.timeA.map(async (jogador) => {
                const jogadorData = {
                  id: jogador.jogadorRef.id,
                  gol: jogador.gol,
                  assistencia: jogador.assistencia,
                  destaque: jogador.destaque,
                  bolaMurcha: jogador.bolaMurcha,
                  golContra: jogador.golContra || 0,
                };
                totalGolsTimeA += jogador.gol ?? 0;
                totalAssistenciasTimeA += jogador.assistencia ?? 0;
                totalGolsContraTimeA += jogador.golContra ?? 0;
                const jogadorSnapshot = await jogador.jogadorRef.get();
                return { ...jogadorData, ...jogadorSnapshot.data() };
              })
            ),
            Promise.all(
              partidaData.timeB.map(async (jogador) => {
                const jogadorData = {
                  id: jogador.jogadorRef.id,
                  gol: jogador.gol,
                  assistencia: jogador.assistencia,
                  destaque: jogador.destaque,
                  bolaMurcha: jogador.bolaMurcha,
                  golContra: jogador.golContra || 0,
                };
                totalGolsTimeB += jogador.gol ?? 0;
                totalAssistenciasTimeB += jogador.assistencia ?? 0;
                totalGolsContraTimeB += jogador.golContra ?? 0;
                const jogadorSnapshot = await jogador.jogadorRef.get();
                return { ...jogadorData, ...jogadorSnapshot.data() };
              })
            ),
          ]);

          partidaData.timeA = timeAPlayers;
          partidaData.timeB = timeBPlayers;
          partidaData.totalGolsTimeA = totalGolsTimeA + totalGolsContraTimeB;
          partidaData.totalGolsTimeB = totalGolsTimeB + totalGolsContraTimeA;
          partidaData.totalGolsContraTimeA = totalGolsContraTimeA;
          partidaData.totalGolsContraTimeB = totalGolsContraTimeB;
          partidaData.totalAssistenciasTimeA = totalAssistenciasTimeA;
          partidaData.totalAssistenciasTimeB = totalAssistenciasTimeB;

          return partidaData;
        })
      );

      cache.set('partidas', partidas, 2 * 60 * 1000);
      return partidas;
    } catch (error) {
      throw new Error('Erro ao obter partidas com jogadores: ' + error.message);
    }
  }

  static async obterEstatisticasPartidas(dataInicial, dataFim) {
    const cacheKey = `estatisticasPartidas:${dataInicial || 'all'}:${dataFim || 'all'}`;
    const cachedEstatisticas = cache.get(cacheKey);
    if (cachedEstatisticas !== null) {
      return cachedEstatisticas;
    }

    const partidaDados = {};
    const dadosFiltrados = [];

    try {
      const db = FirebaseConnection.getInstance().db;
      let partidasSnapshot;
      if (dataInicial && dataFim) {
        partidasSnapshot = await db
          .collection('partidas')
          .where('data', '>=', dataInicial)
          .where('data', '<=', dataFim)
          .get();
      } else {
        partidasSnapshot = await db.collection('partidas').get();
      }

      const partidas = await Promise.all(
        partidasSnapshot.docs.map(async (doc) => {
          const partidaData = { id: doc.id, ...doc.data() };
          let totalGolsTimeA = 0;
          let totalGolsTimeB = 0;
          let totalGolsContraTimeA = 0;
          let totalGolsContraTimeB = 0;
          let totalAssistenciasTimeA = 0;
          let totalAssistenciasTimeB = 0;

          const [timeAPlayers, timeBPlayers] = await Promise.all([
            Promise.all(
              partidaData.timeA.map(async (jogador) => {
                const jogadorData = {
                  id: jogador.jogadorRef.id,
                  gol: jogador.gol,
                  assistencia: jogador.assistencia,
                  destaque: jogador.destaque,
                  bolaMurcha: jogador.bolaMurcha,
                  golContra: jogador.golContra || 0,
                };
                totalGolsTimeA += jogador.gol ?? 0;
                totalGolsTimeB += jogador.golContra ?? 0;
                totalGolsContraTimeA += jogador.golContra ?? 0;
                totalAssistenciasTimeA += jogador.assistencia ?? 0;
                const jogadorSnapshot = await jogador.jogadorRef.get();

                if (!partidaDados[jogador.jogadorRef.id]) {
                  partidaDados[jogador.jogadorRef.id] = {
                    jogos: 0,
                    gols: 0,
                    golContra: 0,
                    assistencia: 0,
                    destaque: 0,
                    bolaMurcha: 0,
                    vitorias: 0,
                    derrotas: 0,
                    empates: 0,
                  };
                }

                if (jogador.destaque) partidaDados[jogador.jogadorRef.id].destaque++;
                if (jogador.bolaMurcha) partidaDados[jogador.jogadorRef.id].bolaMurcha++;

                partidaDados[jogador.jogadorRef.id].jogadorId = jogador.jogadorRef.id;
                partidaDados[jogador.jogadorRef.id].jogos++;
                partidaDados[jogador.jogadorRef.id].gols += jogador.gol ?? 0;
                partidaDados[jogador.jogadorRef.id].golContra += jogador.golContra ?? 0;
                partidaDados[jogador.jogadorRef.id].assistencia += jogador.assistencia ?? 0;
                partidaDados[jogador.jogadorRef.id].jogador = jogadorSnapshot.data();

                return { ...jogadorData, ...jogadorSnapshot.data() };
              })
            ),
            Promise.all(
              partidaData.timeB.map(async (jogador) => {
                const jogadorData = {
                  id: jogador.jogadorRef.id,
                  gol: jogador.gol,
                  assistencia: jogador.assistencia,
                  destaque: jogador.destaque,
                  bolaMurcha: jogador.bolaMurcha,
                  golContra: jogador.golContra || 0,
                };
                totalGolsTimeB += jogador.gol ?? 0;
                totalGolsTimeA += jogador.golContra ?? 0;
                totalGolsContraTimeB += jogador.golContra ?? 0;
                totalAssistenciasTimeB += jogador.assistencia ?? 0;
                const jogadorSnapshot = await jogador.jogadorRef.get();

                if (!partidaDados[jogador.jogadorRef.id]) {
                  partidaDados[jogador.jogadorRef.id] = {
                    jogos: 0,
                    gols: 0,
                    golContra: 0,
                    assistencia: 0,
                    destaque: 0,
                    bolaMurcha: 0,
                    vitorias: 0,
                    derrotas: 0,
                    empates: 0,
                  };
                }

                if (jogador.destaque) partidaDados[jogador.jogadorRef.id].destaque++;
                if (jogador.bolaMurcha) partidaDados[jogador.jogadorRef.id].bolaMurcha++;

                partidaDados[jogador.jogadorRef.id].jogadorId = jogador.jogadorRef.id;
                partidaDados[jogador.jogadorRef.id].jogos++;
                partidaDados[jogador.jogadorRef.id].gols += jogador.gol ?? 0;
                partidaDados[jogador.jogadorRef.id].golContra += jogador.golContra ?? 0;
                partidaDados[jogador.jogadorRef.id].assistencia += jogador.assistencia ?? 0;
                partidaDados[jogador.jogadorRef.id].jogador = jogadorSnapshot.data();

                return { ...jogadorData, ...jogadorSnapshot.data() };
              })
            ),
          ]);

          partidaData.timeA = timeAPlayers;
          partidaData.timeB = timeBPlayers;
          partidaData.totalGolsTimeA = totalGolsTimeA + totalGolsContraTimeB;
          partidaData.totalGolsTimeB = totalGolsTimeB + totalGolsContraTimeA;
          partidaData.totalGolsContraTimeA = totalGolsContraTimeA;
          partidaData.totalGolsContraTimeB = totalGolsContraTimeB;
          partidaData.totalAssistenciasTimeA = totalAssistenciasTimeA;
          partidaData.totalAssistenciasTimeB = totalAssistenciasTimeB;
          partidaData.vendedor = 'Empate';
          if (totalGolsTimeA > totalGolsTimeB) partidaData.vendedor = 'A';
          if (totalGolsTimeB > totalGolsTimeA) partidaData.vendedor = 'B';

          return partidaData;
        })
      );

      for (const part of partidas) {
        if (part.vendedor === 'A') {
          for (const jog of part.timeA) partidaDados[jog.id].vitorias++;
          for (const jog of part.timeB) partidaDados[jog.id].derrotas++;
        }
        if (part.vendedor === 'B') {
          for (const jog of part.timeB) partidaDados[jog.id].vitorias++;
          for (const jog of part.timeA) partidaDados[jog.id].derrotas++;
        }
        if (part.vendedor === 'Empate') {
          for (const jog of part.timeA) partidaDados[jog.id].empates++;
          for (const jog of part.timeB) partidaDados[jog.id].empates++;
        }
      }

      for (const key in partidaDados) {
        if (Object.prototype.hasOwnProperty.call(partidaDados, key)) {
          dadosFiltrados.push(partidaDados[key]);
        }
      }

      cache.set(cacheKey, dadosFiltrados, 2 * 60 * 1000);
      return dadosFiltrados;
    } catch (error) {
      throw new Error('Erro ao obter partidas com jogadores: ' + error.message);
    }
  }

  static async atualizarPartida({ id, data, local, timeA, timeB, status }) {
    try {
      const db = FirebaseConnection.getInstance().db;

      const timeARefs = await Promise.all(
        timeA.map((jogadorRef) => ({
          jogadorRef: db.doc(`jogadores/${jogadorRef.id}`),
          gol: jogadorRef.gol,
          assistencia: jogadorRef.assistencia,
          golContra: jogadorRef.golContra,
          destaque: jogadorRef?.destaque ? true : false,
          bolaMurcha: jogadorRef?.bolaMurcha ? true : false,
        }))
      );

      const timeBRefs = await Promise.all(
        timeB.map((jogadorRef) => ({
          jogadorRef: db.doc(`jogadores/${jogadorRef.id}`),
          gol: jogadorRef.gol,
          assistencia: jogadorRef.assistencia,
          golContra: jogadorRef.golContra,
          destaque: jogadorRef?.destaque ? true : false,
          bolaMurcha: jogadorRef?.bolaMurcha ? true : false,
        }))
      );

      await db.collection('partidas').doc(id).update({
        data,
        local,
        timeA: timeARefs,
        timeB: timeBRefs,
        status,
      });

      cache.delete('partidas');
      cache.deletePrefix('estatisticasPartidas:');
      return 'Dados atualizados com sucesso';
    } catch (error) {
      throw new Error('Erro ao atualizar dados do jogador: ' + error.message);
    }
  }

  static async deletarPartida(id) {
    try {
      const db = FirebaseConnection.getInstance().db;
      await db.collection('partidas').doc(id).delete();
      cache.delete('partidas');
      cache.deletePrefix('estatisticasPartidas:');
      return 'Partida deletada com sucesso';
    } catch (error) {
      throw new Error('Erro ao deletar partida: ' + error.message);
    }
  }
}

module.exports = Partida;
