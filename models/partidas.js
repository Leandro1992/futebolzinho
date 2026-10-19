const FirebaseConnection = require('../db');
const cache = require('./cache');
const Jogadores = require('./jogadores');

const LISTA_TTL = 10 * 60 * 1000;
let leituraEmAndamento = null;

function cadastroDoJogador(entrada, mapa) {
    const id = entrada.jogadorRef?.id || entrada.id;
    const cadastro = mapa.get(id) || {};
    return {
        id,
        nome: cadastro.nome || entrada.nome || 'Jogador',
        mensalista: Boolean(cadastro.mensalista ?? entrada.mensalista),
        gol: entrada.gol ?? 0,
        assistencia: entrada.assistencia ?? 0,
        golContra: entrada.golContra || 0,
        destaque: Boolean(entrada.destaque),
        bolaMurcha: Boolean(entrada.bolaMurcha),
    };
}

function somar(lista, campo) {
    return lista.reduce((total, jogador) => total + (jogador[campo] || 0), 0);
}

function montarPartida(id, dados, mapa) {
    const timeA = (dados.timeA || []).map((jogador) => cadastroDoJogador(jogador, mapa));
    const timeB = (dados.timeB || []).map((jogador) => cadastroDoJogador(jogador, mapa));
    const golsContraA = somar(timeA, 'golContra');
    const golsContraB = somar(timeB, 'golContra');

    return {
        id,
        data: dados.data,
        local: dados.local,
        status: dados.status,
        timeA,
        timeB,
        totalGolsTimeA: somar(timeA, 'gol') + golsContraB,
        totalGolsTimeB: somar(timeB, 'gol') + golsContraA,
        totalGolsContraTimeA: golsContraA,
        totalGolsContraTimeB: golsContraB,
        totalAssistenciasTimeA: somar(timeA, 'assistencia'),
        totalAssistenciasTimeB: somar(timeB, 'assistencia'),
    };
}

function mapaDeCadastros(jogadores) {
    const mapa = new Map();
    for (const jogador of jogadores) {
        mapa.set(jogador.id, { nome: jogador.nome, mensalista: Boolean(jogador.mensalista) });
    }
    return mapa;
}

function nomesJaConhecidos() {
    const mapa = new Map();
    const jogadores = cache.get('jogadores');
    if (jogadores) {
        for (const jogador of jogadores) {
            mapa.set(jogador.id, { nome: jogador.nome, mensalista: Boolean(jogador.mensalista) });
        }
    }

    const partidas = cache.get('partidas');
    if (partidas) {
        for (const partida of partidas) {
            for (const jogador of [...partida.timeA, ...partida.timeB]) {
                if (!mapa.has(jogador.id)) {
                    mapa.set(jogador.id, { nome: jogador.nome, mensalista: Boolean(jogador.mensalista) });
                }
            }
        }
    }
    return mapa;
}

function dentroDoPeriodo(partida, dataInicial, dataFim) {
    const data = String(partida.data || '').slice(0, 10);
    if (dataInicial && data < dataInicial) return false;
    if (dataFim && data > dataFim) return false;
    return true;
}

function agregarEstatisticas(partidas) {
    const totais = {};

    function garantir(jogador) {
        if (!totais[jogador.id]) {
            totais[jogador.id] = {
                jogadorId: jogador.id,
                jogador: { nome: jogador.nome, mensalista: Boolean(jogador.mensalista) },
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
        return totais[jogador.id];
    }

    function somarAtuacao(jogador) {
        const item = garantir(jogador);
        item.jogos += 1;
        item.gols += jogador.gol ?? 0;
        item.golContra += jogador.golContra ?? 0;
        item.assistencia += jogador.assistencia ?? 0;
        if (jogador.destaque) item.destaque += 1;
        if (jogador.bolaMurcha) item.bolaMurcha += 1;
    }

    for (const partida of partidas) {
        for (const jogador of partida.timeA) somarAtuacao(jogador);
        for (const jogador of partida.timeB) somarAtuacao(jogador);

        if (partida.totalGolsTimeA > partida.totalGolsTimeB) {
            partida.timeA.forEach((jogador) => { totais[jogador.id].vitorias += 1; });
            partida.timeB.forEach((jogador) => { totais[jogador.id].derrotas += 1; });
        } else if (partida.totalGolsTimeB > partida.totalGolsTimeA) {
            partida.timeB.forEach((jogador) => { totais[jogador.id].vitorias += 1; });
            partida.timeA.forEach((jogador) => { totais[jogador.id].derrotas += 1; });
        } else {
            partida.timeA.forEach((jogador) => { totais[jogador.id].empates += 1; });
            partida.timeB.forEach((jogador) => { totais[jogador.id].empates += 1; });
        }
    }

    return Object.values(totais);
}

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

            const timeARefs = await Promise.all(this.timeA.map(jogadorRef => db.doc(`jogadores/${jogadorRef.id}`)));
            const timeBRefs = await Promise.all(this.timeB.map(jogadorRef => db.doc(`jogadores/${jogadorRef.id}`)));

            const partidaRef = await db.collection('partidas').add({
                data: this.data,
                local: this.local,
                timeA: timeARefs.map(jogadorRef => ({ jogadorRef, gol: 0, assistencia: 0, golContra: 0 })),
                timeB: timeBRefs.map(jogadorRef => ({ jogadorRef, gol: 0, assistencia: 0, golContra: 0 })),
                status: this.status
            });

            cache.delete('partidas');
            cache.deletePrefix('estatisticasPartidas:');

            return partidaRef.id;
        } catch (error) {
            throw new Error('Erro ao salvar partida: ' + error.message);
        }
    }

    static async lerDoBanco(dataInicial, dataFim) {
        const db = FirebaseConnection.getInstance().db;
        const mapa = mapaDeCadastros(await Jogadores.obterTodos());
        let consulta = db.collection('partidas');
        if (dataInicial && dataFim) {
            consulta = consulta.where('data', '>=', dataInicial).where('data', '<=', dataFim);
        }
        const snapshot = await consulta.get();
        return snapshot.docs.map((doc) => montarPartida(doc.id, doc.data(), mapa));
    }

    static async obterTodas() {
        const cachedPartidas = cache.get('partidas');
        if (cachedPartidas !== null) {
            return cachedPartidas;
        }

        if (!leituraEmAndamento) {
            leituraEmAndamento = this.lerDoBanco()
                .then((partidas) => {
                    cache.set('partidas', partidas, LISTA_TTL);
                    return partidas;
                })
                .finally(() => {
                    leituraEmAndamento = null;
                });
        }

        try {
            return await leituraEmAndamento;
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

        try {
            const listaCompleta = cache.get('partidas');
            const partidas = listaCompleta
                ? listaCompleta.filter((partida) => dentroDoPeriodo(partida, dataInicial, dataFim))
                : await this.lerDoBanco(dataInicial, dataFim);
            const dadosFiltrados = agregarEstatisticas(partidas);
            cache.set(cacheKey, dadosFiltrados, LISTA_TTL);
            return dadosFiltrados;
        } catch (error) {
            throw new Error('Erro ao obter partidas com jogadores: ' + error.message);
        }
    }

    static lembrarPartida(partida) {
        const lista = cache.get('partidas');
        if (lista) {
            const index = lista.findIndex((item) => item.id === partida.id);
            if (index === -1) lista.unshift(partida);
            else lista[index] = partida;
            cache.set('partidas', lista, LISTA_TTL);
        }
        cache.deletePrefix('estatisticasPartidas:');
    }

    static async atualizarPartida({ id, data, local, timeA, timeB, status }) {
        try {
            const db = FirebaseConnection.getInstance().db;

            const timeARefs = timeA.map(jogadorRef => ({
                jogadorRef: db.doc(`jogadores/${jogadorRef.id}`),
                gol: jogadorRef.gol,
                assistencia: jogadorRef.assistencia,
                golContra: jogadorRef.golContra,
                destaque: jogadorRef?.destaque ? true : false,
                bolaMurcha: jogadorRef?.bolaMurcha ? true : false,
            }));

            const timeBRefs = timeB.map(jogadorRef => ({
                jogadorRef: db.doc(`jogadores/${jogadorRef.id}`),
                gol: jogadorRef.gol,
                assistencia: jogadorRef.assistencia,
                golContra: jogadorRef.golContra,
                destaque: jogadorRef?.destaque ? true : false,
                bolaMurcha: jogadorRef?.bolaMurcha ? true : false,
            }));

            await db.collection('partidas').doc(id).update({
                data: data,
                local: local,
                timeA: timeARefs,
                timeB: timeBRefs,
                status: status
            });

            this.lembrarPartida(montarPartida(id, { data, local, status, timeA, timeB }, nomesJaConhecidos()));

            return 'Dados atualizados com sucesso';
        } catch (error) {
            throw new Error('Erro ao atualizar dados do jogador: ' + error.message);
        }
    }

    static async deletarPartida(id) {
        try {
            const db = FirebaseConnection.getInstance().db;
            await db.collection('partidas').doc(id).delete();
            const lista = cache.get('partidas');
            if (lista) {
                cache.set('partidas', lista.filter((partida) => partida.id !== id), LISTA_TTL);
            }
            cache.deletePrefix('estatisticasPartidas:');
            return 'Partida deletada com sucesso';
        } catch (error) {
            throw new Error('Erro ao deletar partida: ' + error.message);
        }
    }
}

module.exports = Partida;
