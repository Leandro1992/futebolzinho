"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { api } from "@/lib/api";
import type { Jogador, Partida } from "@/lib/types";
import { useAuth } from "@/components/auth-context";

type Lance = "gol" | "assistencia" | "golContra";

function LinhaMarcacao({
  nome,
  gol,
  assistencia,
  golContra,
  onMarcar,
  onAjustar,
}: {
  nome: string;
  gol: number;
  assistencia: number;
  golContra: number;
  onMarcar: (lance: Lance) => void;
  onAjustar: () => void;
}) {
  const timer = useRef<number | null>(null);
  const origem = useRef<{ x: number; y: number } | null>(null);
  const [segurando, setSegurando] = useState(false);

  function cancelarSeguro() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    origem.current = null;
    setSegurando(false);
  }

  function iniciarSeguro(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    cancelarSeguro();
    origem.current = { x: event.clientX, y: event.clientY };
    setSegurando(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Alguns navegadores recusam a captura; o toque longo continua no botao.
    }
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setSegurando(false);
      onAjustar();
    }, 3000);
  }

  function acompanharSeguro(event: PointerEvent<HTMLButtonElement>) {
    if (!origem.current) return;
    const dx = event.clientX - origem.current.x;
    const dy = event.clientY - origem.current.y;
    if (dx * dx + dy * dy > 144) cancelarSeguro();
  }

  useEffect(() => () => cancelarSeguro(), []);

  return (
    <div className="marcacao-linha">
      <button
        type="button"
        className={`marcacao-nome ${segurando ? "segurando" : ""}`}
        aria-label={`Segurar para corrigir ${nome}`}
        onPointerDown={iniciarSeguro}
        onPointerMove={acompanharSeguro}
        onPointerUp={cancelarSeguro}
        onPointerCancel={cancelarSeguro}
        onContextMenu={(event) => event.preventDefault()}
      >
        {nome}
      </button>
      <span className="marcacao-botoes">
        <button type="button" className="marcacao-btn gol" aria-label={`Gol de ${nome}, ${gol}`} onClick={() => onMarcar("gol")}>
          {gol}
        </button>
        <button
          type="button"
          className="marcacao-btn assistencia"
          aria-label={`Assistência de ${nome}, ${assistencia}`}
          onClick={() => onMarcar("assistencia")}
        >
          {assistencia}
        </button>
        <button
          type="button"
          className="marcacao-btn contra"
          aria-label={`Gol contra de ${nome}, ${golContra}`}
          onClick={() => onMarcar("golContra")}
        >
          {golContra}
        </button>
      </span>
    </div>
  );
}

function toPayload(partida: Partida) {
  return {
    id: partida.id,
    data: partida.data,
    local: partida.local,
    status: partida.status,
    timeA: partida.timeA.map((j) => ({
      id: j.id,
      gol: j.gol ?? 0,
      assistencia: j.assistencia ?? 0,
      golContra: j.golContra ?? 0,
      destaque: !!j.destaque,
      bolaMurcha: !!j.bolaMurcha,
    })),
    timeB: partida.timeB.map((j) => ({
      id: j.id,
      gol: j.gol ?? 0,
      assistencia: j.assistencia ?? 0,
      golContra: j.golContra ?? 0,
      destaque: !!j.destaque,
      bolaMurcha: !!j.bolaMurcha,
    })),
  };
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

function getWinner(partida: Partida): "A" | "B" | "E" {
  if (partida.totalGolsTimeA > partida.totalGolsTimeB) return "A";
  if (partida.totalGolsTimeB > partida.totalGolsTimeA) return "B";
  return "E";
}

function getPremiacoes(partida: Partida) {
  const jogadores = [...partida.timeA, ...partida.timeB];
  const destaque = jogadores.find((jogador) => jogador.destaque);
  const bolaMurcha = jogadores.find((jogador) => jogador.bolaMurcha);
  return { destaque, bolaMurcha };
}

export default function PartidasPage() {
  const { isLoggedIn } = useAuth();
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Partida | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Partida | null>(null);
  const [expandedPartidaId, setExpandedPartidaId] = useState<string | null>(null);
  const [destaqueId, setDestaqueId] = useState("");
  const [bolaMurchaId, setBolaMurchaId] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [registroPartidaId, setRegistroPartidaId] = useState<string | null>(null);
  const [ajusteJogador, setAjusteJogador] = useState<{
    time: "A" | "B";
    id: string;
    nome: string;
    gol: number;
    assistencia: number;
    golContra: number;
  } | null>(null);
  const partidasRef = useRef<Partida[]>([]);
  const saveChain = useRef(Promise.resolve());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const registroAbertoRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  async function carregarPartidas() {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPartidas();
      const ordered = [...response.data].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );
      lembrarPartidas(ordered);
      setPartidas(ordered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar partidas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregarPartidas();
  }, []);

  function manterTelaAcordada() {
    if (!registroAbertoRef.current) return;

    if (wakeLockRef.current) return;

    const video = videoRef.current;
    if (video) {
      video.muted = true;
      void video.play().catch(() => undefined);
    }

    if (!("wakeLock" in navigator)) return;

    void navigator.wakeLock.request("screen").then((sentinela) => {
      if (!registroAbertoRef.current) {
        void sentinela.release();
        return;
      }
      wakeLockRef.current = sentinela;
      video?.pause();
      sentinela.addEventListener("release", () => {
        if (wakeLockRef.current === sentinela) wakeLockRef.current = null;
        if (registroAbertoRef.current && document.visibilityState === "visible") {
          manterTelaAcordada();
        }
      });
    }).catch(() => undefined);
  }

  async function liberarTela() {
    const sentinela = wakeLockRef.current;
    wakeLockRef.current = null;
    if (sentinela) {
      try {
        await sentinela.release();
      } catch {
        // A trava já tinha sido liberada pelo sistema.
      }
    }
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }

  useEffect(() => {
    if (!registroPartidaId) return;

    const aoVoltar = () => {
      if (document.visibilityState === "visible") manterTelaAcordada();
    };

    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [registroPartidaId]);

  function lembrarPartidas(lista: Partida[]) {
    partidasRef.current = lista;
  }

  async function persistir(partida: Partida) {
    const base = partidasRef.current.length > 0 ? partidasRef.current : partidas;
    const lista = base.map((item) => (item.id === partida.id ? partida : item));
    lembrarPartidas(lista);
    setPartidas(lista);
    saveChain.current = saveChain.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await api.editarPartida(toPayload(partida));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Falha ao atualizar partida");
          await carregarPartidas();
        }
      });
  }

  function updateJogador(
    partida: Partida,
    time: "A" | "B",
    jogadorId: string,
    field: "gol" | "assistencia" | "golContra",
    delta: 1 | -1
  ) {
    const fonte = partidasRef.current.find((item) => item.id === partida.id) ?? partida;
    const clone: Partida = structuredClone(fonte);
    const team = time === "A" ? clone.timeA : clone.timeB;
    const jog = team.find((item) => item.id === jogadorId);
    if (!jog) return;

    const current = jog[field] ?? 0;
    const next = Math.max(0, current + delta);
    if (next === current) return;
    jog[field] = next;

    const diff = next - current;

    if (field === "gol") {
      if (time === "A") clone.totalGolsTimeA += diff;
      else clone.totalGolsTimeB += diff;
    }

    if (field === "assistencia") {
      if (time === "A") clone.totalAssistenciasTimeA += diff;
      else clone.totalAssistenciasTimeB += diff;
    }

    if (field === "golContra") {
      if (time === "A") {
        clone.totalGolsContraTimeA += diff;
        clone.totalGolsTimeB += diff;
      } else {
        clone.totalGolsContraTimeB += diff;
        clone.totalGolsTimeA += diff;
      }
    }

    void persistir(clone);
    return clone;
  }

  const jogadoresModal = useMemo(() => {
    if (!selected) return [] as Jogador[];
    return [...selected.timeA, ...selected.timeB];
  }, [selected]);

  async function encerrarPartida() {
    if (!selected || !destaqueId) return;
    const clone: Partida = structuredClone(selected);

    clone.timeA.forEach((j) => {
      j.destaque = j.id === destaqueId;
      j.bolaMurcha = Boolean(bolaMurchaId) && j.id === bolaMurchaId;
    });
    clone.timeB.forEach((j) => {
      j.destaque = j.id === destaqueId;
      j.bolaMurcha = Boolean(bolaMurchaId) && j.id === bolaMurchaId;
    });
    clone.status = 1;

    setSelected(null);
    setDestaqueId("");
    setBolaMurchaId("");
    registroAbertoRef.current = false;
    setRegistroPartidaId(null);
    void liberarTela();
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignora erro de saida de fullscreen.
      }
    }
    await persistir(clone);
  }

  async function excluirPartida(partidaId: string) {
    if (!isLoggedIn) return;

    try {
      setDeletingId(partidaId);
      await api.excluirPartida(partidaId);
      const restantes = partidasRef.current.filter((partida) => partida.id !== partidaId);
      lembrarPartidas(restantes);
      setPartidas(restantes);
      if (expandedPartidaId === partidaId) setExpandedPartidaId(null);
      if (selected?.id === partidaId) setSelected(null);
      if (pendingDelete?.id === partidaId) setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir partida");
    } finally {
      setDeletingId(null);
    }
  }

  const partidaRegistro = useMemo(
    () => partidas.find((partida) => partida.id === registroPartidaId) ?? null,
    [partidas, registroPartidaId]
  );

  async function alternarFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  }

  async function abrirModoRegistro(partidaId: string) {
    setAjusteJogador(null);
    registroAbertoRef.current = true;
    setRegistroPartidaId(partidaId);
    manterTelaAcordada();
    try {
      await alternarFullscreen();
    } catch {
      // Mantem a marcacao aberta mesmo sem fullscreen nativo.
    }
  }

  function marcarLance(time: "A" | "B", jogador: Jogador, lance: Lance) {
    if (!partidaRegistro) return;
    updateJogador(partidaRegistro, time, jogador.id, lance, 1);
  }

  function definirEstatisticas(
    time: "A" | "B",
    jogadorId: string,
    valores: { gol: number; assistencia: number; golContra: number }
  ) {
    if (!partidaRegistro) return;
    const fonte = partidasRef.current.find((item) => item.id === partidaRegistro.id) ?? partidaRegistro;
    const clone: Partida = structuredClone(fonte);
    const team = time === "A" ? clone.timeA : clone.timeB;
    const jog = team.find((item) => item.id === jogadorId);
    if (!jog) return;

    jog.gol = Math.max(0, valores.gol);
    jog.assistencia = Math.max(0, valores.assistencia);
    jog.golContra = Math.max(0, valores.golContra);

    const soma = (lista: Jogador[], campo: Lance) => lista.reduce((total, item) => total + (item[campo] ?? 0), 0);
    clone.totalGolsTimeA = soma(clone.timeA, "gol") + soma(clone.timeB, "golContra");
    clone.totalGolsTimeB = soma(clone.timeB, "gol") + soma(clone.timeA, "golContra");
    clone.totalAssistenciasTimeA = soma(clone.timeA, "assistencia");
    clone.totalAssistenciasTimeB = soma(clone.timeB, "assistencia");
    clone.totalGolsContraTimeA = soma(clone.timeA, "golContra");
    clone.totalGolsContraTimeB = soma(clone.timeB, "golContra");
    void persistir(clone);
    setAjusteJogador(null);
  }

  function pedirEncerramento() {
    if (!partidaRegistro) return;
    setDestaqueId("");
    setBolaMurchaId("");
    setSelected(partidaRegistro);
  }

  async function fecharModoRegistro() {
    setAjusteJogador(null);
    registroAbertoRef.current = false;
    setRegistroPartidaId(null);
    void liberarTela();
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignora erro de saida de fullscreen.
      }
    }
  }

  return (
    <div>
      <video
        ref={videoRef}
        className="tela-acordada"
        src="/silencio.mp4"
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <section className="card">
        <h1 className="section-title">Partidas</h1>
        <p className="meta">Controle placar, assistencias, gol contra e encerramento.</p>
      </section>

      {loading ? <section className="card">Carregando partidas...</section> : null}
      {error ? <section className="card error-msg">{error}</section> : null}

      {!loading && partidas.length === 0 ? <section className="card">Nenhuma partida encontrada.</section> : null}

      {partidas.map((partida) => {
        const winner = getWinner(partida);
        const expanded = expandedPartidaId === partida.id;
        const { destaque, bolaMurcha } = getPremiacoes(partida);
        return (
        <section key={partida.id} className="card">
          <div className="accordion-trigger">
            <div
              className="accordion-main-toggle"
              onClick={() => setExpandedPartidaId((prev) => (prev === partida.id ? null : partida.id))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setExpandedPartidaId((prev) => (prev === partida.id ? null : partida.id));
                }
              }}
              aria-expanded={expanded}
              aria-controls={`partida-panel-${partida.id}`}
              role="button"
              tabIndex={0}
            >
            <div className="match-header">
              <div>
                <strong>{formatDate(partida.data)}</strong>
                <p className="meta" style={{ margin: 0 }}>{partida.local}</p>
              </div>
              <div className="accordion-summary-right">
                <span className={`badge status-badge ${partida.status === 1 ? "closed" : "open"}`}>
                  {partida.status === 1 ? "Encerrada" : "Em aberto"}
                </span>
                {isLoggedIn && partida.status === 0 ? (
                  <span
                    className="btn ghost registro-inline-btn"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void abrirModoRegistro(partida.id);
                    }}
                    role="button"
                  >
                    Tela cheia
                  </span>
                ) : null}
                {isLoggedIn && partida.status === 1 ? (
                  <a
                    className="btn ghost registro-inline-btn"
                    href={`/partida-form?id=${encodeURIComponent(partida.id)}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    Editar
                  </a>
                ) : null}
                <span className="accordion-chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
              </div>
            </div>

            <div className="scoreline">
              <span className={`team-score team-a ${winner === "A" ? "winner" : ""}`}>
                Time A {partida.totalGolsTimeA}
              </span>
              <span className="score-separator">x</span>
              <span className={`team-score team-b ${winner === "B" ? "winner" : ""}`}>
                {partida.totalGolsTimeB} Time B
              </span>
            </div>
            {winner === "E" ? (
              <p className="meta winner-caption">Partida empatada.</p>
            ) : (
              <p className="meta winner-caption">Vencedor parcial: Time {winner}</p>
            )}

            {partida.status === 1 && (destaque || bolaMurcha) ? (
              <div className="award-inline-row">
                {destaque ? <span className="award-chip best">Melhor: {destaque.nome}</span> : null}
                {bolaMurcha ? <span className="award-chip worst">Bola murcha: {bolaMurcha.nome}</span> : null}
              </div>
            ) : null}
            </div>
          </div>

          {expanded ? <div id={`partida-panel-${partida.id}`} className="accordion-panel"><div className="grid two">
            <div className="team-box">
              <h3 className="team-title">Time A</h3>
            {partida.timeA.map((jog) => (
                <div className="jog-row" key={jog.id}>
                  <span className="jog-name">{jog.nome}</span>
                  {isLoggedIn && partida.status === 0 ? (
                    <div className="stat-grid">
                      <div className="stat-block stat-goal">
                        <button className="stat-inc" onClick={() => updateJogador(partida, "A", jog.id, "gol", 1)}>
                          <span className="stat-val">{jog.gol ?? 0}</span>
                          <span className="stat-lbl">Gol</span>
                        </button>
                        <button className="stat-dec" onClick={() => updateJogador(partida, "A", jog.id, "gol", -1)}>−</button>
                      </div>
                      <div className="stat-block stat-assist">
                        <button className="stat-inc" onClick={() => updateJogador(partida, "A", jog.id, "assistencia", 1)}>
                          <span className="stat-val">{jog.assistencia ?? 0}</span>
                          <span className="stat-lbl">Ass</span>
                        </button>
                        <button className="stat-dec" onClick={() => updateJogador(partida, "A", jog.id, "assistencia", -1)}>−</button>
                      </div>
                      <div className="stat-block stat-own">
                        <button className="stat-inc" onClick={() => updateJogador(partida, "A", jog.id, "golContra", 1)}>
                          <span className="stat-val">{jog.golContra ?? 0}</span>
                          <span className="stat-lbl">GC</span>
                        </button>
                        <button className="stat-dec" onClick={() => updateJogador(partida, "A", jog.id, "golContra", -1)}>−</button>
                      </div>
                    </div>
                  ) : (
                    <span className="jog-stats-ro">{jog.gol ?? 0}G · {jog.assistencia ?? 0}A · {jog.golContra ?? 0}GC</span>
                  )}
                </div>
              ))}
            </div>

            <div className="team-box">
              <h3 className="team-title">Time B</h3>
            {partida.timeB.map((jog) => (
                <div className="jog-row" key={jog.id}>
                  <span className="jog-name">{jog.nome}</span>
                  {isLoggedIn && partida.status === 0 ? (
                    <div className="stat-grid">
                      <div className="stat-block stat-goal">
                        <button className="stat-inc" onClick={() => updateJogador(partida, "B", jog.id, "gol", 1)}>
                          <span className="stat-val">{jog.gol ?? 0}</span>
                          <span className="stat-lbl">Gol</span>
                        </button>
                        <button className="stat-dec" onClick={() => updateJogador(partida, "B", jog.id, "gol", -1)}>−</button>
                      </div>
                      <div className="stat-block stat-assist">
                        <button className="stat-inc" onClick={() => updateJogador(partida, "B", jog.id, "assistencia", 1)}>
                          <span className="stat-val">{jog.assistencia ?? 0}</span>
                          <span className="stat-lbl">Ass</span>
                        </button>
                        <button className="stat-dec" onClick={() => updateJogador(partida, "B", jog.id, "assistencia", -1)}>−</button>
                      </div>
                      <div className="stat-block stat-own">
                        <button className="stat-inc" onClick={() => updateJogador(partida, "B", jog.id, "golContra", 1)}>
                          <span className="stat-val">{jog.golContra ?? 0}</span>
                          <span className="stat-lbl">GC</span>
                        </button>
                        <button className="stat-dec" onClick={() => updateJogador(partida, "B", jog.id, "golContra", -1)}>−</button>
                      </div>
                    </div>
                  ) : (
                    <span className="jog-stats-ro">{jog.gol ?? 0}G · {jog.assistencia ?? 0}A · {jog.golContra ?? 0}GC</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {partida.status === 1 && (destaque || bolaMurcha) ? (
            <div className="award-details-box">
              <h4>Premiacao da partida</h4>
              <div className="award-inline-row">
                {destaque ? <span className="award-chip best">Melhor da partida: {destaque.nome}</span> : null}
                {bolaMurcha ? <span className="award-chip worst">Bola murcha: {bolaMurcha.nome}</span> : null}
              </div>
            </div>
          ) : null}

          {isLoggedIn && partida.status === 0 ? (
            <div style={{ marginTop: 12 }}>
              <button className="btn ghost" onClick={() => void abrirModoRegistro(partida.id)}>
                Tela cheia
              </button>{" "}
              <button className="btn primary" onClick={() => setSelected(partida)}>
                Encerrar Partida
              </button>
            </div>
          ) : null}</div> : null}

          {isLoggedIn ? (
            <div style={{ marginTop: 10 }}>
              <button
                className="btn subtle-danger"
                onClick={() => setPendingDelete(partida)}
                disabled={deletingId === partida.id}
              >
                {deletingId === partida.id ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          ) : null}
        </section>
      )})}

      {selected ? (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h2>Encerrar partida</h2>
            <p className="meta">Escolha o melhor da partida. A bola murcha é opcional.</p>
            <div className="form-grid">
              <label>
                Melhor da partida
                <select value={destaqueId} onChange={(e) => setDestaqueId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {jogadoresModal.map((jog) => (
                    <option key={jog.id} value={jog.id}>
                      {jog.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Bola murcha
                <select value={bolaMurchaId} onChange={(e) => setBolaMurchaId(e.target.value)}>
                  <option value="">Nenhum</option>
                  {jogadoresModal.map((jog) => (
                    <option key={jog.id} value={jog.id}>
                      {jog.nome}
                    </option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button className="btn ghost" onClick={() => setSelected(null)}>
                  Cancelar
                </button>
                <button className="btn primary" onClick={() => void encerrarPartida()} disabled={!destaqueId}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="modal-backdrop" onClick={() => setPendingDelete(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h2>Excluir partida</h2>
            <p className="meta">
              Confirma a exclusao da partida de {formatDate(pendingDelete.data)} em {pendingDelete.local}?
            </p>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setPendingDelete(null)}>
                Cancelar
              </button>
              <button
                className="btn danger"
                onClick={() => void excluirPartida(pendingDelete.id)}
                disabled={deletingId === pendingDelete.id}
              >
                {deletingId === pendingDelete.id ? "Excluindo..." : "Confirmar exclusao"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {partidaRegistro && isLoggedIn && partidaRegistro.status === 0 ? (
        <div className="registro-overlay modo-marcacao">
          <div className="marcacao-shell">
            <div className="marcacao-topo">
              <div className="marcacao-placar" aria-label="Placar">
                <span className="team-score team-a">{partidaRegistro.totalGolsTimeA}</span>
                <span className="score-separator">x</span>
                <span className="team-score team-b">{partidaRegistro.totalGolsTimeB}</span>
              </div>
              <p className="marcacao-dica">Segure o nome por 3 segundos para corrigir.</p>
              <button className="btn ghost marcacao-fechar" type="button" onClick={() => void fecharModoRegistro()}>
                Fechar
              </button>
            </div>

            <div className="marcacao-times">
              <section className="marcacao-time time-a">
                <div className="marcacao-time-topo">
                  <h3>Time A</h3>
                  <span className="marcacao-legenda">
                    <i className="gol" />G <i className="assistencia" />A <i className="contra" />GC
                  </span>
                </div>
                <div className="marcacao-lista">
                  {partidaRegistro.timeA.map((jog) => (
                    <LinhaMarcacao
                      key={jog.id}
                      nome={jog.nome}
                      gol={jog.gol ?? 0}
                      assistencia={jog.assistencia ?? 0}
                      golContra={jog.golContra ?? 0}
                      onMarcar={(lance) => marcarLance("A", jog, lance)}
                      onAjustar={() =>
                        setAjusteJogador({
                          time: "A",
                          id: jog.id,
                          nome: jog.nome,
                          gol: jog.gol ?? 0,
                          assistencia: jog.assistencia ?? 0,
                          golContra: jog.golContra ?? 0,
                        })
                      }
                    />
                  ))}
                </div>
              </section>
              <section className="marcacao-time time-b">
                <div className="marcacao-time-topo">
                  <h3>Time B</h3>
                  <span className="marcacao-legenda">
                    <i className="gol" />G <i className="assistencia" />A <i className="contra" />GC
                  </span>
                </div>
                <div className="marcacao-lista">
                  {partidaRegistro.timeB.map((jog) => (
                    <LinhaMarcacao
                      key={jog.id}
                      nome={jog.nome}
                      gol={jog.gol ?? 0}
                      assistencia={jog.assistencia ?? 0}
                      golContra={jog.golContra ?? 0}
                      onMarcar={(lance) => marcarLance("B", jog, lance)}
                      onAjustar={() =>
                        setAjusteJogador({
                          time: "B",
                          id: jog.id,
                          nome: jog.nome,
                          gol: jog.gol ?? 0,
                          assistencia: jog.assistencia ?? 0,
                          golContra: jog.golContra ?? 0,
                        })
                      }
                    />
                  ))}
                </div>
              </section>
            </div>

            <button className="btn primary marcacao-encerrar" type="button" onClick={pedirEncerramento}>
              Encerrar partida
            </button>

            {ajusteJogador ? (
              <div className="marcacao-ajuste" role="dialog" aria-modal="true" aria-label={`Corrigir ${ajusteJogador.nome}`}>
                <form
                  className="marcacao-ajuste-card"
                  onSubmit={(event) => {
                    event.preventDefault();
                    definirEstatisticas(ajusteJogador.time, ajusteJogador.id, ajusteJogador);
                  }}
                >
                  <h2>{ajusteJogador.nome}</h2>
                  <p className="meta">Ajuste os números desta partida.</p>
                  {(
                    [
                      ["gol", "Gols", "gol"],
                      ["assistencia", "Assistências", "assistencia"],
                      ["golContra", "Gols contra", "contra"],
                    ] as const
                  ).map(([campo, rotulo, cor]) => (
                    <div className={`ajuste-linha ${cor}`} key={campo}>
                      <span>{rotulo}</span>
                      <div className="ajuste-controles">
                        <button
                          type="button"
                          aria-label={`Diminuir ${rotulo}`}
                          onClick={() =>
                            setAjusteJogador((atual) =>
                              atual ? { ...atual, [campo]: Math.max(0, atual[campo] - 1) } : atual
                            )
                          }
                        >
                          −
                        </button>
                        <strong>{ajusteJogador[campo]}</strong>
                        <button
                          type="button"
                          aria-label={`Aumentar ${rotulo}`}
                          onClick={() =>
                            setAjusteJogador((atual) => (atual ? { ...atual, [campo]: atual[campo] + 1 } : atual))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="modal-actions">
                    <button className="btn ghost" type="button" onClick={() => setAjusteJogador(null)}>
                      Cancelar
                    </button>
                    <button className="btn primary" type="submit">
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
