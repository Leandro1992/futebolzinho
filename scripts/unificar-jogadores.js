/**
 * Analisa, faz backup e unifica jogadores com o mesmo nome.
 *
 * Uso:
 *   node scripts/unificar-jogadores.js analyze
 *   node scripts/unificar-jogadores.js backup
 *   node scripts/unificar-jogadores.js apply
 *   node scripts/unificar-jogadores.js restore backups/arquivo.json
 */
const fs = require('fs');
const path = require('path');
const FirebaseConnection = require('../db');

function nomeChave(nome) {
  return String(nome ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR')
    .replace(/\//g, '-');
}

function nomeExibicao(nome) {
  return String(nome ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
}

function isDocumentReference(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.path === 'string' &&
      typeof value.id === 'string' &&
      typeof value.get === 'function'
  );
}

function serialize(value) {
  if (value == null) return value;
  if (isDocumentReference(value)) return { __ref: value.path };
  if (typeof value.toDate === 'function') return { __timestamp: value.toDate().toISOString() };
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = serialize(item);
    return out;
  }
  return value;
}

function refId(jogadorRef) {
  if (!jogadorRef) return null;
  if (typeof jogadorRef.id === 'string') return jogadorRef.id;
  if (typeof jogadorRef.path === 'string') return jogadorRef.path.split('/').pop();
  if (jogadorRef.__ref) return String(jogadorRef.__ref).split('/').pop();
  return null;
}

async function carregarColecao(db, nome) {
  const snapshot = await db.collection(nome).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    createTime: doc.createTime ? doc.createTime.toDate().toISOString() : null,
    data: doc.data(),
  }));
}

function agruparDuplicados(jogadores) {
  const grupos = new Map();
  for (const jogador of jogadores) {
    const chave = nomeChave(jogador.data.nome);
    if (!chave) continue;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(jogador);
  }
  return [...grupos.entries()].filter(([, lista]) => lista.length > 1);
}

function escolherCanonico(lista, usos) {
  return [...lista].sort((a, b) => {
    const usosA = usos.get(a.id) || 0;
    const usosB = usos.get(b.id) || 0;
    if (usosB !== usosA) return usosB - usosA;
    const timeA = a.createTime || '';
    const timeB = b.createTime || '';
    if (timeA !== timeB) return timeA < timeB ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  })[0];
}

function contarUsos(partidas, avulsas, desculpas) {
  const usos = new Map();
  const add = (id) => {
    if (!id) return;
    usos.set(id, (usos.get(id) || 0) + 1);
  };

  for (const partida of partidas) {
    for (const slot of partida.data.timeA || []) add(refId(slot.jogadorRef));
    for (const slot of partida.data.timeB || []) add(refId(slot.jogadorRef));
  }
  for (const partida of avulsas) {
    for (const jogador of partida.data.jogadores || []) add(jogador.id || jogador.jogadorId);
  }
  for (const desculpa of desculpas) add(desculpa.data.jogadorId);
  return usos;
}

function somar(slots, campo) {
  return (slots || []).reduce((total, slot) => total + (Number(slot[campo]) || 0), 0);
}

function remapearTime(slots, idMap, db) {
  let mudou = false;
  const resultado = [];
  const indexPorId = new Map();
  const veioDeDuplicata = new Set();

  for (const slot of slots || []) {
    const antigo = refId(slot.jogadorRef);
    const mapeado = idMap.has(antigo);
    const novo = idMap.get(antigo) || antigo;

    if (mapeado) mudou = true;

    const indice = indexPorId.get(novo);
    if (indice === undefined) {
      const novoSlot = { ...slot };
      if (mapeado) {
        novoSlot.jogadorRef = db.doc(`jogadores/${novo}`);
        veioDeDuplicata.add(novo);
      }
      indexPorId.set(novo, resultado.length);
      resultado.push(novoSlot);
      continue;
    }

    if (!mapeado && !veioDeDuplicata.has(novo)) {
      resultado.push({ ...slot });
      continue;
    }

    mudou = true;
    const atual = resultado[indice];
    atual.gol = (Number(atual.gol) || 0) + (Number(slot.gol) || 0);
    atual.assistencia = (Number(atual.assistencia) || 0) + (Number(slot.assistencia) || 0);
    atual.golContra = (Number(atual.golContra) || 0) + (Number(slot.golContra) || 0);
    atual.destaque = Boolean(atual.destaque || slot.destaque);
    atual.bolaMurcha = Boolean(atual.bolaMurcha || slot.bolaMurcha);
  }

  return { mudou, slots: resultado };
}

function validarTotais(antes, depois) {
  for (const campo of ['gol', 'assistencia', 'golContra']) {
    if (somar(antes, campo) !== somar(depois, campo)) {
      throw new Error(`Total de ${campo} mudou ao unificar uma partida`);
    }
  }
}

async function backupLocal(payload) {
  const dir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `pre-unificacao-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return file;
}

function deserialize(db, value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((item) => deserialize(db, item));
  if (typeof value === 'object') {
    if (typeof value.__ref === 'string') return db.doc(value.__ref);
    if (typeof value.__timestamp === 'string') return new Date(value.__timestamp);
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = deserialize(db, item);
    return out;
  }
  return value;
}

async function commitOps(db, ops) {
  const limite = 400;
  for (let i = 0; i < ops.length; i += limite) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + limite)) op(batch);
    await batch.commit();
  }
}

async function restaurar(arquivo) {
  const db = FirebaseConnection.getInstance().db;
  const bruto = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  const ops = [];

  for (const nomeColecao of ['jogadores', 'partidas', 'partidas-avulsas', 'desculpas']) {
    const campo = {
      jogadores: 'jogadores',
      partidas: 'partidas',
      'partidas-avulsas': 'partidasAvulsas',
      desculpas: 'desculpas',
    }[nomeColecao];
    for (const item of bruto[campo] || []) {
      const { id, createTime, ...resto } = item;
      ops.push((batch) => batch.set(db.collection(nomeColecao).doc(id), deserialize(db, resto)));
    }
  }

  const locks = await db.collection('jogadores_nomes').get();
  for (const doc of locks.docs) {
    ops.push((batch) => batch.delete(doc.ref));
  }

  await commitOps(db, ops);
  console.log(`RESTAURACAO_CONCLUIDA ${arquivo}`);
}

async function main() {
  const modo = process.argv[2] || 'analyze';
  if (!['analyze', 'backup', 'apply', 'restore'].includes(modo)) {
    throw new Error('Modo invalido. Use analyze, backup, apply ou restore.');
  }

  if (modo === 'restore') {
    const arquivo = process.argv[3];
    if (!arquivo) throw new Error('Informe o arquivo de backup.');
    await restaurar(path.resolve(arquivo));
    return;
  }

  const db = FirebaseConnection.getInstance().db;
  const colecoes = (await db.listCollections()).map((col) => col.id);
  const jogadores = await carregarColecao(db, 'jogadores');
  const partidas = await carregarColecao(db, 'partidas');
  const avulsas = colecoes.includes('partidas-avulsas') ? await carregarColecao(db, 'partidas-avulsas') : [];
  const desculpas = colecoes.includes('desculpas') ? await carregarColecao(db, 'desculpas') : [];

  const usos = contarUsos(partidas, avulsas, desculpas);
  const duplicados = agruparDuplicados(jogadores);
  const idMap = new Map();
  const plano = [];

  for (const [chave, lista] of duplicados) {
    const canonico = escolherCanonico(lista, usos);
    const removidos = lista.filter((item) => item.id !== canonico.id);
    for (const removido of removidos) idMap.set(removido.id, canonico.id);
    plano.push({
      chave,
      canonico: {
        id: canonico.id,
        nome: canonico.data.nome,
        mensalista: Boolean(canonico.data.mensalista),
        usos: usos.get(canonico.id) || 0,
      },
      removidos: removidos.map((item) => ({
        id: item.id,
        nome: item.data.nome,
        mensalista: Boolean(item.data.mensalista),
        usos: usos.get(item.id) || 0,
      })),
    });
  }

  const partidasAfetadas = [];
  const conflitosTimes = [];
  for (const partida of partidas) {
    const idsA = new Set((partida.data.timeA || []).map((slot) => idMap.get(refId(slot.jogadorRef)) || refId(slot.jogadorRef)));
    const idsB = new Set((partida.data.timeB || []).map((slot) => idMap.get(refId(slot.jogadorRef)) || refId(slot.jogadorRef)));
    const cruzados = [...idsA].filter((id) => idsB.has(id));
    if (cruzados.length) conflitosTimes.push({ partidaId: partida.id, data: partida.data.data, ids: cruzados });

    const timeA = remapearTime(partida.data.timeA, idMap, db);
    const timeB = remapearTime(partida.data.timeB, idMap, db);
    validarTotais(partida.data.timeA, timeA.slots);
    validarTotais(partida.data.timeB, timeB.slots);
    partida.timeANovo = timeA;
    partida.timeBNovo = timeB;
    if (timeA.mudou || timeB.mudou) {
      partidasAfetadas.push({
        id: partida.id,
        data: partida.data.data,
        antesA: (partida.data.timeA || []).map((slot) => refId(slot.jogadorRef)),
        depoisA: timeA.slots.map((slot) => refId(slot.jogadorRef)),
        antesB: (partida.data.timeB || []).map((slot) => refId(slot.jogadorRef)),
        depoisB: timeB.slots.map((slot) => refId(slot.jogadorRef)),
      });
    }
  }

  const avulsasAfetadas = avulsas.filter((partida) =>
    (partida.data.jogadores || []).some((jogador) => idMap.has(jogador.id || jogador.jogadorId))
  );
  const desculpasAfetadas = desculpas.filter((item) => idMap.has(item.data.jogadorId));

  const resumo = {
    modo,
    colecoes,
    totais: {
      jogadores: jogadores.length,
      partidas: partidas.length,
      partidasAvulsas: avulsas.length,
      desculpas: desculpas.length,
      gruposDuplicados: plano.length,
      jogadoresRemovidos: idMap.size,
      partidasAfetadas: partidasAfetadas.length,
      avulsasAfetadas: avulsasAfetadas.length,
      desculpasAfetadas: desculpasAfetadas.length,
      conflitosMesmoJogadorNosDoisTimes: conflitosTimes.length,
    },
    plano,
    conflitosTimes,
    partidasAlteradas: partidasAfetadas,
  };

  console.log(JSON.stringify(resumo, null, 2));

  if (modo === 'analyze') return;

  const arquivo = await backupLocal({
    criadoEm: new Date().toISOString(),
    colecoes,
    jogadores: jogadores.map((item) => ({ id: item.id, createTime: item.createTime, ...serialize(item.data) })),
    partidas: partidas.map((item) => ({ id: item.id, createTime: item.createTime, ...serialize(item.data) })),
    partidasAvulsas: avulsas.map((item) => ({ id: item.id, createTime: item.createTime, ...serialize(item.data) })),
    desculpas: desculpas.map((item) => ({ id: item.id, createTime: item.createTime, ...serialize(item.data) })),
    plano,
  });
  console.log(`BACKUP_LOCAL ${arquivo}`);

  if (modo === 'backup') return;

  if (conflitosTimes.length) {
    throw new Error('Ha partidas com o mesmo jogador nos dois times apos a unificacao. Aplicacao interrompida.');
  }

  const referencias = [];
  for (const partida of partidas) {
    if (!partida.timeANovo.mudou && !partida.timeBNovo.mudou) continue;
    referencias.push((batch) =>
      batch.update(db.collection('partidas').doc(partida.id), {
        timeA: partida.timeANovo.slots,
        timeB: partida.timeBNovo.slots,
      })
    );
  }

  for (const partida of avulsasAfetadas) {
    const jogadoresAtualizados = [];
    const vistos = new Set();
    for (const jogador of partida.data.jogadores || []) {
      const antigo = jogador.id || jogador.jogadorId;
      const novo = idMap.get(antigo) || antigo;
      if (vistos.has(novo)) continue;
      vistos.add(novo);
      const atualizado = { ...jogador };
      if (jogador.id) atualizado.id = novo;
      if (jogador.jogadorId) atualizado.jogadorId = novo;
      jogadoresAtualizados.push(atualizado);
    }
    referencias.push((batch) =>
      batch.update(db.collection('partidas-avulsas').doc(partida.id), { jogadores: jogadoresAtualizados })
    );
  }

  for (const item of desculpasAfetadas) {
    const novoId = idMap.get(item.data.jogadorId);
    const canonico = jogadores.find((jogador) => jogador.id === novoId);
    referencias.push((batch) =>
      batch.update(db.collection('desculpas').doc(item.id), {
        jogadorId: novoId,
        jogadorNome: nomeExibicao(canonico?.data.nome || item.data.jogadorNome),
      })
    );
  }

  await commitOps(db, referencias);

  const cadastros = [];
  for (const [chave, lista] of duplicados) {
    const canonico = escolherCanonico(lista, usos);
    const mensalista = lista.some((item) => Boolean(item.data.mensalista));
    cadastros.push((batch) =>
      batch.set(
        db.collection('jogadores_nomes').doc(chave),
        { jogadorId: canonico.id, nome: nomeExibicao(canonico.data.nome) },
        { merge: true }
      )
    );
    cadastros.push((batch) =>
      batch.update(db.collection('jogadores').doc(canonico.id), {
        nome: nomeExibicao(canonico.data.nome),
        nomeChave: chave,
        mensalista,
      })
    );
  }

  const chavesUnicas = new Map();
  for (const jogador of jogadores) {
    if (idMap.has(jogador.id)) continue;
    const chave = nomeChave(jogador.data.nome);
    if (!chave || chavesUnicas.has(chave)) continue;
    chavesUnicas.set(chave, jogador);
  }
  for (const [chave, jogador] of chavesUnicas) {
    if (duplicados.some(([chaveDuplicada]) => chaveDuplicada === chave)) continue;
    cadastros.push((batch) =>
      batch.set(
        db.collection('jogadores_nomes').doc(chave),
        { jogadorId: jogador.id, nome: nomeExibicao(jogador.data.nome) },
        { merge: true }
      )
    );
    cadastros.push((batch) =>
      batch.update(db.collection('jogadores').doc(jogador.id), {
        nome: nomeExibicao(jogador.data.nome),
        nomeChave: chave,
      })
    );
  }

  await commitOps(db, cadastros);

  const exclusoes = [];
  for (const id of idMap.keys()) {
    exclusoes.push((batch) => batch.delete(db.collection('jogadores').doc(id)));
  }
  await commitOps(db, exclusoes);
  console.log('UNIFICACAO_CONCLUIDA');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
