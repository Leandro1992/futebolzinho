"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Jogador, Partida } from "@/lib/types";
import { useAuth } from "@/components/auth-context";

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
  const [registroBusca, setRegistroBusca] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, setWakeLockAtivo] = useState(false);
  const [, setWakeLockErro] = useState<string | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  async function carregarPartidas() {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPartidas();
      const ordered = [...response.data].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );
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

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const wakeLockSuportado =
    typeof navigator !== "undefined" && "wakeLock" in navigator && typeof document !== "undefined";

  async function solicitarWakeLock() {
    if (!wakeLockSuportado) return;

    try {
      const wakeLockApi = navigator as Navigator & {
        wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
      };

      if (!wakeLockApi.wakeLock) return;
      wakeLockRef.current = await wakeLockApi.wakeLock.request("screen");
      setWakeLockAtivo(true);
      setWakeLockErro(null);
    } catch {
      setWakeLockAtivo(false);
      setWakeLockErro("Nao foi possivel manter a tela ativa neste dispositivo.");
    }
  }

  async function liberarWakeLock() {
    if (!wakeLockRef.current) return;
    try {
      await wakeLockRef.current.release();
    } finally {
      wakeLockRef.current = null;
      setWakeLockAtivo(false);
    }
  }

  useEffect(() => {
    if (!registroPartidaId) {
      void liberarWakeLock();
      return;
    }

    void solicitarWakeLock();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && registroPartidaId) {
        void solicitarWakeLock();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void liberarWakeLock();
    };
  }, [registroPartidaId]);

  async function persistir(partida: Partida) {
    setPartidas((prev) => prev.map((item) => (item.id === partida.id ? partida : item)));
    try {
      await api.editarPartida(toPayload(partida));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar partida");
      await carregarPartidas();
    }
  }

  function updateJogador(
    partida: Partida,
    time: "A" | "B",
    jogadorId: string,
    field: "gol" | "assistencia" | "golContra",
    delta: 1 | -1
  ) {
    const clone: Partida = structuredClone(partida);
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
  }

  const jogadoresModal = useMemo(() => {
    if (!selected) return [] as Jogador[];
    return [...selected.timeA, ...selected.timeB];
  }, [selected]);

  async function encerrarPartida() {
    if (!selected || !destaqueId || !bolaMurchaId) return;
    const clone: Partida = structuredClone(selected);

    clone.timeA.forEach((j) => {
      j.destaque = j.id === destaqueId;
      j.bolaMurcha = j.id === bolaMurchaId;
    });
    clone.timeB.forEach((j) => {
      j.destaque = j.id === destaqueId;
      j.bolaMurcha = j.id === bolaMurchaId;
    });
    clone.status = 1;

    setSelected(null);
    setDestaqueId("");
    setBolaMurchaId("");
    await persistir(clone);
  }

  async function excluirPartida(partidaId: string) {
    if (!isLoggedIn) return;

    try {
      setDeletingId(partidaId);
      await api.excluirPartida(partidaId);
      setPartidas((prev) => prev.filter((partida) => partida.id !== partidaId));
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
    setRegistroBusca("");
    setWakeLockErro(null);
    setRegistroPartidaId(partidaId);
    try {
      await alternarFullscreen();
    } catch {
      // Mantem o modo de registro aberto mesmo sem fullscreen nativo.
    }
  }

  async function fecharModoRegistro() {
    setRegistroBusca("");
    setRegistroPartidaId(null);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignora erro de saida de fullscreen.
      }
    }
  }

  const termoBuscaRegistro = registroBusca.trim().toLowerCase();
  const jogadoresRegistroA = useMemo(() => {
    if (!partidaRegistro) return [];
    if (!termoBuscaRegistro) return partidaRegistro.timeA;
    return partidaRegistro.timeA.filter((jogador) =>
      jogador.nome.toLowerCase().includes(termoBuscaRegistro)
    );
  }, [partidaRegistro, termoBuscaRegistro]);

  const jogadoresRegistroB = useMemo(() => {
    if (!partidaRegistro) return [];
    if (!termoBuscaRegistro) return partidaRegistro.timeB;
    return partidaRegistro.timeB.filter((jogador) =>
      jogador.nome.toLowerCase().includes(termoBuscaRegistro)
    );
  }, [partidaRegistro, termoBuscaRegistro]);

  return (
    <div>
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
                    Modo Registro
                  </span>
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
                Modo Registro
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
            <p className="meta">Defina destaque e bola murcha.</p>
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
                  <option value="">Selecione...</option>
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
                <button className="btn primary" onClick={() => void encerrarPartida()}>
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
        <div className="registro-overlay">
          <div className="registro-shell">
            <div className="registro-header">
              <div>
                <strong>{formatDate(partidaRegistro.data)}</strong>
                <p className="meta" style={{ margin: 0 }}>{partidaRegistro.local}</p>
              </div>
              <div className="registro-actions">
                <button className="btn ghost" onClick={() => void alternarFullscreen()}>
                  {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                </button>
                <button className="btn danger" onClick={() => void fecharModoRegistro()}>
                  Fechar registro
                </button>
              </div>
            </div>

            <div className="scoreline registro-scoreline">
              <span className="team-score team-a">Time A {partidaRegistro.totalGolsTimeA}</span>
              <span className="score-separator">x</span>
              <span className="team-score team-b">{partidaRegistro.totalGolsTimeB} Time B</span>
            </div>

            <div className="registro-wakelock-meta">
              <label className="registro-search-wrap">
                <span className="meta">Buscar jogador</span>
                <input
                  className="registro-search"
                  type="text"
                  value={registroBusca}
                  onChange={(e) => setRegistroBusca(e.target.value)}
                  placeholder="Digite um nome"
                />
              </label>
            </div>

            <div className="registro-grid">
              <div className="team-box registro-team-box time-a">
                <h3 className="team-title">Time A</h3>
                {jogadoresRegistroA.map((jog) => (
                  <div className="jog-row" key={jog.id}>
                    <span className="jog-name">{jog.nome}</span>
                    <div className="stat-grid">
                      <div className="stat-block stat-goal">
                        <button className="stat-inc" onClick={() => updateJogador(partidaRegistro, "A", jog.id, "gol", 1)}>
                          <span className="stat-val">{jog.gol ?? 0}</span>
                          <span className="stat-lbl">Gol</span>
                        </button>
                        <button className="stat-dec" onClick={() => updateJogador(partidaRegistro, "A", jog.id, "gol", -1)}>−</button>
                      </div>
                      <div className="stat-block stat-assist">
                        <button className="stat-inc" onClick={() => updateJogador(partidaRegistro, "A", jog.id, "assistencia", 1)}>
                          <span className="stat-val">{jog.assistencia ?? 0}</span>
                          <span className="stat-lbl">Ass</span>
                        </button>
                        <button className="stat-dec" onClick={() => updateJogador(partidaRegistro, "A", jog.id, "assistencia", -1)}>−</button>
                      </div>
                      <div className="stat-block stat-own">
                        <button className="stat-inc" onClick={() => updateJogador(partidaRegistro, "A", jog.id, "golContra", 1)}>
                          <span className="stat-val">{jog.golContra ?? 0}</span>
                          <span className="stat-lbl">GC</span>
                        </button>
                        <button className="stat-dec" onClick={() => updateJogador(partidaRegistro, "A", jog.id, "golContra", -1)}>−</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="team-box registro-team-box time-b">
                <h3 className="team-title">Time B</h3>
                {jogadoresRegistroB.map((jog) => (
                  <div className="jog-row" key={jog.id}>
                    <span className="jog-name">{jog.nome}</span>
                    <div className="stat-grid">
                      <div className="stat-block stat-goal">
                        <button className="stat-inc" onClick={() => updateJogador(partidaRegistro, "B", jog.id, "gol", 1)}>
                          <span className="stat-val">{jog.gol ?? 0}</span>
                          <span className="stat-lbl">Gol</span>
                        </button>
                        <button className="stat-dec" onClick={() => updateJogador(partidaRegistro, "B", jog.id, "gol", -1)}>−</button>
                      </div>
                      <div className="stat-block stat-assist">
                        <button className="stat-inc" onClick={() => updateJogador(partidaRegistro, "B", jog.id, "assistencia", 1)}>
                          <span className="stat-val">{jog.assistencia ?? 0}</span>
                          <span className="stat-lbl">Ass</span>
                        </button>
                        <button className="stat-dec" onClick={() => updateJogador(partidaRegistro, "B", jog.id, "assistencia", -1)}>−</button>
                      </div>
                      <div className="stat-block stat-own">
                        <button className="stat-inc" onClick={() => updateJogador(partidaRegistro, "B", jog.id, "golContra", 1)}>
                          <span className="stat-val">{jog.golContra ?? 0}</span>
                          <span className="stat-lbl">GC</span>
                        </button>
                        <button className="stat-dec" onClick={() => updateJogador(partidaRegistro, "B", jog.id, "golContra", -1)}>−</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
