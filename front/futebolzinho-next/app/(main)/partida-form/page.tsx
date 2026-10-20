"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Estatistica, Jogador } from "@/lib/types";
import { useAuth } from "@/components/auth-context";

function hoje() {
  return new Date().toISOString().split("T")[0];
}

export default function PartidaFormPage() {
  const { isLoggedIn } = useAuth();
  const [jogadoresBase, setJogadoresBase] = useState<Jogador[]>([]);
  const [disponiveis, setDisponiveis] = useState<Jogador[]>([]);
  const [timeA, setTimeA] = useState<Jogador[]>([]);
  const [timeB, setTimeB] = useState<Jogador[]>([]);
  const [data, setData] = useState(hoje());
  const [local, setLocal] = useState("Paula Ramos");
  const [selectedTime, setSelectedTime] = useState<"A" | "B">("A");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [edicaoId, setEdicaoId] = useState<string | null>(null);
  const [carregandoEdicao, setCarregandoEdicao] = useState(false);
  const [edicaoRecusada, setEdicaoRecusada] = useState<string | null>(null);

  function ordenarJogadores(lista: Jogador[]) {
    return [...lista].sort((a, b) => {
      if (a.mensalista !== b.mensalista) return a.mensalista ? -1 : 1;
      return a.nome.localeCompare(b.nome);
    });
  }

  function copiarDaPartida(jogador: Jogador): Jogador {
    return {
      id: jogador.id,
      nome: jogador.nome,
      mensalista: jogador.mensalista,
      gol: jogador.gol ?? 0,
      assistencia: jogador.assistencia ?? 0,
      golContra: jogador.golContra ?? 0,
      destaque: !!jogador.destaque,
      bolaMurcha: !!jogador.bolaMurcha,
      fixo: false,
    };
  }

  async function carregar() {
    const id = new URLSearchParams(window.location.search).get("id");
    try {
      setError(null);
      if (id) {
        setEdicaoId(id);
        setCarregandoEdicao(true);
      }

      const jogadoresRes = await api.getJogadores();
      const sorted = ordenarJogadores(jogadoresRes.data);
      setJogadoresBase(sorted);

      if (!id) {
        setDisponiveis(sorted);
        return;
      }

      const partidasRes = await api.getPartidas();
      const partida = partidasRes.data.find((item) => item.id === id);
      if (!partida) {
        setEdicaoRecusada("Não encontrei essa partida.");
        return;
      }
      if (partida.status !== 1) {
        setEdicaoRecusada("Essa partida ainda está em aberto. Marque os lances na lista de partidas.");
        return;
      }

      const timeAInicial = partida.timeA.map(copiarDaPartida);
      const timeBInicial = partida.timeB.map(copiarDaPartida);
      const usados = new Set([...timeAInicial, ...timeBInicial].map((jogador) => jogador.id));
      setData(String(partida.data || "").slice(0, 10));
      setLocal(partida.local || "");
      setTimeA(timeAInicial);
      setTimeB(timeBInicial);
      setDisponiveis(sorted.filter((jogador) => !usados.has(jogador.id)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar a partida";
      if (id) setEdicaoRecusada(message);
      else setError(message);
    } finally {
      setCarregandoEdicao(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  function adicionarJogador(jogadorId: string, time: "A" | "B") {
    const alvo = disponiveis.find((j) => j.id === jogadorId);
    if (!alvo) return;
    if (timeA.length >= 10 || timeB.length >= 10) {
      setError("Limite maximo de 10 jogadores por time.");
      return;
    }

    const entry = { ...alvo, gol: 0, assistencia: 0, golContra: 0, fixo: false };
    setDisponiveis((prev) => prev.filter((j) => j.id !== jogadorId));
    if (time === "A") setTimeA((prev) => [...prev, entry]);
    else setTimeB((prev) => [...prev, entry]);
  }

  function removerJogador(jogador: Jogador, time: "A" | "B") {
    if (time === "A") setTimeA((prev) => prev.filter((j) => j.id !== jogador.id));
    else setTimeB((prev) => prev.filter((j) => j.id !== jogador.id));
    setDisponiveis((prev) => [...prev, jogador].sort((a, b) => a.nome.localeCompare(b.nome)));
  }

  function moverJogador(jogador: Jogador, de: "A" | "B") {
    const destinoCheio = de === "A" ? timeB.length >= 10 : timeA.length >= 10;
    if (destinoCheio) {
      setError("Limite maximo de 10 jogadores por time.");
      return;
    }

    setError(null);
    if (de === "A") {
      setTimeA((prev) => prev.filter((j) => j.id !== jogador.id));
      setTimeB((prev) => [...prev, jogador]);
      return;
    }
    setTimeB((prev) => prev.filter((j) => j.id !== jogador.id));
    setTimeA((prev) => [...prev, jogador]);
  }

  function preencherMensalistas() {
    const mensalistas = disponiveis.filter((j) => j.mensalista);
    mensalistas.forEach((jogador, idx) => {
      adicionarJogador(jogador.id, idx % 2 === 0 ? "A" : "B");
    });
  }

  async function equilibrar() {
    try {
      const hojeData = hoje();
      const inicioAno = `${new Date().getFullYear()}-01-01`;
      const response = await api.getEstatisticas(inicioAno, hojeData);
      const estatisticas = response.data as Estatistica[];

      const fixosA = timeA.filter((j) => j.fixo);
      const fixosB = timeB.filter((j) => j.fixo);
      const naoFixos = [...timeA, ...timeB].filter((j) => !j.fixo);

      if (naoFixos.length < 2) {
        setError("E necessario ao menos 2 jogadores nao fixos para equilibrar.");
        return;
      }

      const pontuados = naoFixos.map((j) => {
        const s = estatisticas.find((item) => item.jogadorId === j.id);
        if (!s || s.jogos === 0) return { ...j, score: 0 };
        const score =
          (s.gols / s.jogos) * 3 +
          (s.assistencia / s.jogos) * 2 +
          (s.destaque / s.jogos) * 3 +
          (s.vitorias / s.jogos) * 5;
        return { ...j, score };
      });

      pontuados.sort((a, b) => b.score - a.score);

      const total = pontuados.length + fixosA.length + fixosB.length;
      const alvoA = (total % 2) + Math.floor(total / 2);
      const alvoB = Math.floor(total / 2);

      const novoA = [...fixosA];
      const novoB = [...fixosB];
      let scoreA = 0;
      let scoreB = 0;

      pontuados.forEach((j) => {
        if (novoA.length < alvoA && (scoreA <= scoreB || novoB.length >= alvoB)) {
          novoA.push(j);
          scoreA += j.score;
        } else {
          novoB.push(j);
          scoreB += j.score;
        }
      });

      const usados = new Set([...novoA, ...novoB].map((j) => j.id));
      setTimeA(novoA);
      setTimeB(novoB);
      setDisponiveis(jogadoresBase.filter((j) => !usados.has(j.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao equilibrar");
    }
  }

  function definirLance(
    time: "A" | "B",
    jogadorId: string,
    campo: "gol" | "assistencia" | "golContra",
    valor: string
  ) {
    const numero = Math.max(0, Math.floor(Number(valor) || 0));
    const aplicar = (lista: Jogador[]) =>
      lista.map((jogador) => (jogador.id === jogadorId ? { ...jogador, [campo]: numero } : jogador));
    if (time === "A") setTimeA(aplicar);
    else setTimeB(aplicar);
  }

  function linhaSalva(jogador: Jogador) {
    return {
      id: jogador.id,
      gol: jogador.gol ?? 0,
      assistencia: jogador.assistencia ?? 0,
      golContra: jogador.golContra ?? 0,
      destaque: !!jogador.destaque,
      bolaMurcha: !!jogador.bolaMurcha,
    };
  }

  async function salvar() {
    if (!isLoggedIn) {
      setError(edicaoId ? "Faça login para editar a partida." : "Faça login para criar partida.");
      return;
    }

    if (timeA.length < 5 || timeB.length < 5) {
      setError("Cada time precisa ter ao menos 5 jogadores.");
      return;
    }

    if (timeA.length > 10 || timeB.length > 10) {
      setError("Cada time pode ter no máximo 10 jogadores.");
      return;
    }

    setSaving(true);
    try {
      if (edicaoId) {
        await api.editarPartida({
          id: edicaoId,
          data,
          local,
          status: 1,
          timeA: timeA.map(linhaSalva),
          timeB: timeB.map(linhaSalva),
        });
        setError(null);
        setSuccess("Partida atualizada. Ela continua encerrada.");
      } else {
        await api.criarPartida({
          data,
          local,
          status: 0,
          timeA: timeA.map((j) => ({ id: j.id, gol: 0, assistencia: 0, golContra: 0 })),
          timeB: timeB.map((j) => ({ id: j.id, gol: 0, assistencia: 0, golContra: 0 })),
        });
        setTimeA([]);
        setTimeB([]);
        setDisponiveis(jogadoresBase);
        setData(hoje());
        setLocal("Paula Ramos");
        setError(null);
        setSuccess("Partida criada com sucesso! Os times foram redefinidos.");
      }
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : edicaoId ? "Erro ao atualizar partida" : "Erro ao criar partida");
    } finally {
      setSaving(false);
    }
  }

  const sortedDisponiveis = useMemo(
    () =>
      [...disponiveis].sort((a, b) => {
        if (a.mensalista !== b.mensalista) return a.mensalista ? -1 : 1;
        return a.nome.localeCompare(b.nome);
      }),
    [disponiveis]
  );

  const editando = Boolean(edicaoId) && !edicaoRecusada;
  const placarA = timeA.reduce((total, jogador) => total + (jogador.gol ?? 0), 0) + timeB.reduce((total, jogador) => total + (jogador.golContra ?? 0), 0);
  const placarB = timeB.reduce((total, jogador) => total + (jogador.gol ?? 0), 0) + timeA.reduce((total, jogador) => total + (jogador.golContra ?? 0), 0);

  function camposDeLance(time: "A" | "B", jogador: Jogador) {
    const campos = [
      ["gol", "G", "Gols"],
      ["assistencia", "A", "Assistências"],
      ["golContra", "GC", "Gols contra"],
    ] as const;
    return (
      <div className="lance-campos">
        {campos.map(([campo, rotulo, nome]) => (
          <span className="lance-campo" key={campo}>
            <span>{rotulo}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              aria-label={`${nome} de ${jogador.nome}`}
              value={jogador[campo] ?? 0}
              onChange={(event) => definirLance(time, jogador.id, campo, event.target.value)}
            />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div>
      <section className="card">
        <h1 className="section-title">{editando ? "Editar partida" : "Nova Partida"}</h1>
        <p className="meta">
          {editando
            ? "Ajuste a data, o local, os jogadores e os lances. A partida continua encerrada."
            : "Monte os times, equilibre e salve a partida no mesmo backend atual."}
        </p>
        {editando && !carregandoEdicao ? <p className="meta">Placar: {placarA} x {placarB}. O gol contra entra no time adversário.</p> : null}
      </section>

      {error ? <section className="card error-msg">{error}</section> : null}

      {success ? (
        <section className="card toast-success">
          <span className="toast-icon">✓</span>
          <span>{success}</span>
        </section>
      ) : null}

      {carregandoEdicao ? <section className="card">Carregando partida...</section> : null}
      {edicaoRecusada ? (
        <section className="card">
          <p>{edicaoRecusada}</p>
          <p className="meta"><a href="/">Voltar às partidas</a></p>
        </section>
      ) : null}

      {!carregandoEdicao && !edicaoRecusada ? <section className="card">
        <div className="grid two">
          <label>
            Data
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </label>
          <label>
            Local
            <input value={local} onChange={(e) => setLocal(e.target.value)} />
          </label>
        </div>

        <div className="grid two" style={{ marginTop: 10 }}>
          <label>
            Jogador
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) adicionarJogador(e.target.value, selectedTime);
              }}
            >
              <option value="">Selecione para adicionar...</option>
              {sortedDisponiveis.map((jogador) => (
                <option key={jogador.id} value={jogador.id}>
                  {jogador.nome} {jogador.mensalista ? "(M)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Time
            <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value as "A" | "B")}>
              <option value="A">Time A</option>
              <option value="B">Time B</option>
            </select>
          </label>
        </div>

        <div className="inline-actions" style={{ marginTop: 10 }}>
          {editando ? null : (
            <>
              <button className="btn ghost" onClick={preencherMensalistas} disabled={saving}>
                Preencher com mensalistas
              </button>
              <button className="btn ghost" onClick={() => void equilibrar()} disabled={saving}>
                Equilibrar times
              </button>
            </>
          )}
          <button className="btn primary" onClick={() => void salvar()} disabled={saving}>
            {saving ? (
              <span className="btn-loading">
                <span className="spinner" />
                Salvando...
              </span>
            ) : editando ? "Salvar alterações" : "Salvar partida"}
          </button>
          {editando ? <a className="btn ghost" href="/">Voltar</a> : null}
        </div>
      </section> : null}

      {!carregandoEdicao && !edicaoRecusada ? <div className="grid two">
        <section className="card">
          <h2 className="team-title">Time A ({timeA.length})</h2>
          {timeA.map((jogador) => (
            <div key={jogador.id} className="list-row">
              <div>
                <div className="jogador-edicao-nome">
                  <span>{jogador.nome} {jogador.fixo ? "[FIXO]" : ""}</span>
                  {jogador.destaque ? <span className="award-chip best">Melhor</span> : null}
                  {jogador.bolaMurcha ? <span className="award-chip worst">Bola murcha</span> : null}
                </div>
                {editando ? camposDeLance("A", jogador) : null}
              </div>
              <div className="inline-actions team-row-actions">
                {editando ? null : (
                  <button className="btn ghost" onClick={() => setTimeA((prev) => prev.map((j) => j.id === jogador.id ? { ...j, fixo: !j.fixo } : j))}>
                    Fixar
                  </button>
                )}
                <button className="btn ghost" title="Mover para o time B" aria-label="Mover para o time B" onClick={() => moverJogador(jogador, "A")}>
                  B
                </button>
                <button className="btn danger" title="Remover" aria-label="Remover" onClick={() => removerJogador(jogador, "A")}>
                  X
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="card">
          <h2 className="team-title">Time B ({timeB.length})</h2>
          {timeB.map((jogador) => (
            <div key={jogador.id} className="list-row">
              <div>
                <div className="jogador-edicao-nome">
                  <span>{jogador.nome} {jogador.fixo ? "[FIXO]" : ""}</span>
                  {jogador.destaque ? <span className="award-chip best">Melhor</span> : null}
                  {jogador.bolaMurcha ? <span className="award-chip worst">Bola murcha</span> : null}
                </div>
                {editando ? camposDeLance("B", jogador) : null}
              </div>
              <div className="inline-actions team-row-actions">
                <button className="btn ghost" title="Mover para o time A" aria-label="Mover para o time A" onClick={() => moverJogador(jogador, "B")}>
                  A
                </button>
                {editando ? null : (
                  <button className="btn ghost" onClick={() => setTimeB((prev) => prev.map((j) => j.id === jogador.id ? { ...j, fixo: !j.fixo } : j))}>
                    Fixar
                  </button>
                )}
                <button className="btn danger" title="Remover" aria-label="Remover" onClick={() => removerJogador(jogador, "B")}>
                  X
                </button>
              </div>
            </div>
          ))}
        </section>
      </div> : null}
    </div>
  );
}
