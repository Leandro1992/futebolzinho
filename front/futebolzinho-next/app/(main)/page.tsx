"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function PartidasPage() {
  const { isLoggedIn } = useAuth();
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Partida | null>(null);
  const [expandedPartidaId, setExpandedPartidaId] = useState<string | null>(null);
  const [destaqueId, setDestaqueId] = useState("");
  const [bolaMurchaId, setBolaMurchaId] = useState("");

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
        return (
        <section key={partida.id} className="card">
          <button
            type="button"
            className="accordion-trigger"
            onClick={() => setExpandedPartidaId((prev) => (prev === partida.id ? null : partida.id))}
            aria-expanded={expanded}
            aria-controls={`partida-panel-${partida.id}`}
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
          </button>

          {expanded ? <div id={`partida-panel-${partida.id}`} className="accordion-panel"><div className="grid two">
            <div className="team-box">
              <h3 className="team-title">Time A</h3>
              {partida.timeA.map((jog) => (
                <div className="list-row" key={jog.id}>
                  <div>
                    <strong>{jog.nome}</strong>
                    <div className="meta">Gols: {jog.gol ?? 0} | Assist: {jog.assistencia ?? 0} | GC: {jog.golContra ?? 0}</div>
                  </div>
                  {isLoggedIn && partida.status === 0 ? (
                    <div className="inline-actions">
                      <div className="score-stepper team-a field-goal">
                        <button onClick={() => updateJogador(partida, "A", jog.id, "gol", -1)}>-</button>
                        <span>G</span>
                        <button onClick={() => updateJogador(partida, "A", jog.id, "gol", 1)}>+</button>
                      </div>
                      <div className="score-stepper team-a field-assist">
                        <button onClick={() => updateJogador(partida, "A", jog.id, "assistencia", -1)}>-</button>
                        <span>A</span>
                        <button onClick={() => updateJogador(partida, "A", jog.id, "assistencia", 1)}>+</button>
                      </div>
                      <div className="score-stepper team-a field-own-goal">
                        <button onClick={() => updateJogador(partida, "A", jog.id, "golContra", -1)}>-</button>
                        <span>GC</span>
                        <button onClick={() => updateJogador(partida, "A", jog.id, "golContra", 1)}>+</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="team-box">
              <h3 className="team-title">Time B</h3>
              {partida.timeB.map((jog) => (
                <div className="list-row" key={jog.id}>
                  <div>
                    <strong>{jog.nome}</strong>
                    <div className="meta">Gols: {jog.gol ?? 0} | Assist: {jog.assistencia ?? 0} | GC: {jog.golContra ?? 0}</div>
                  </div>
                  {isLoggedIn && partida.status === 0 ? (
                    <div className="inline-actions">
                      <div className="score-stepper team-b field-goal">
                        <button onClick={() => updateJogador(partida, "B", jog.id, "gol", -1)}>-</button>
                        <span>G</span>
                        <button onClick={() => updateJogador(partida, "B", jog.id, "gol", 1)}>+</button>
                      </div>
                      <div className="score-stepper team-b field-assist">
                        <button onClick={() => updateJogador(partida, "B", jog.id, "assistencia", -1)}>-</button>
                        <span>A</span>
                        <button onClick={() => updateJogador(partida, "B", jog.id, "assistencia", 1)}>+</button>
                      </div>
                      <div className="score-stepper team-b field-own-goal">
                        <button onClick={() => updateJogador(partida, "B", jog.id, "golContra", -1)}>-</button>
                        <span>GC</span>
                        <button onClick={() => updateJogador(partida, "B", jog.id, "golContra", 1)}>+</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {isLoggedIn && partida.status === 0 ? (
            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={() => setSelected(partida)}>
                Encerrar Partida
              </button>
            </div>
          ) : null}</div> : null}
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
    </div>
  );
}
