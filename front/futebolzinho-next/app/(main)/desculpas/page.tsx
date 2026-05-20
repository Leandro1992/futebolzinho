"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Desculpa, Jogador } from "@/lib/types";
import { useAuth } from "@/components/auth-context";

function hoje() {
  return new Date().toISOString().split("T")[0];
}

export default function DesculpasPage() {
  const { isLoggedIn } = useAuth();
  const [desculpas, setDesculpas] = useState<Desculpa[]>([]);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [filtroJogadorId, setFiltroJogadorId] = useState("");
  const [filtroDataInicial, setFiltroDataInicial] = useState("");
  const [filtroDataFinal, setFiltroDataFinal] = useState("");
  const [nova, setNova] = useState<Desculpa>({
    jogadorId: "",
    jogadorNome: "",
    data: hoje(),
    descricao: "",
  });
  const [editando, setEditando] = useState<Desculpa | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function carregarJogadores() {
    const response = await api.getJogadores();
    setJogadores(response.data.sort((a, b) => a.nome.localeCompare(b.nome)));
  }

  async function carregarDesculpas() {
    try {
      setError(null);
      const response = await api.getDesculpas({
        jogadorId: filtroJogadorId || undefined,
        dataInicial: filtroDataInicial || undefined,
        dataFinal: filtroDataFinal || undefined,
      });
      setDesculpas(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar desculpas");
    }
  }

  useEffect(() => {
    void carregarJogadores();
    void carregarDesculpas();
  }, []);

  async function salvarNova() {
    if (!isLoggedIn) {
      setError("Faça login para registrar desculpas.");
      return;
    }
    if (!nova.jogadorId || !nova.data || !nova.descricao.trim()) {
      setError("Preencha jogador, data e descricao.");
      return;
    }
    try {
      const jogador = jogadores.find((j) => j.id === nova.jogadorId);
      const payload = { ...nova, jogadorNome: jogador?.nome ?? "" };
      await api.criarDesculpa(payload);
      setNova({ jogadorId: "", jogadorNome: "", data: hoje(), descricao: "" });
      await carregarDesculpas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar desculpa");
    }
  }

  async function salvarEdicao() {
    if (!editando?.id) return;
    try {
      const jogador = jogadores.find((j) => j.id === editando.jogadorId);
      await api.editarDesculpa(editando.id, { ...editando, jogadorNome: jogador?.nome ?? "" });
      setEditando(null);
      await carregarDesculpas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar desculpa");
    }
  }

  async function excluir(id: string) {
    if (!isLoggedIn) {
      setError("Faça login para excluir desculpas.");
      return;
    }
    if (!window.confirm("Deseja excluir esta desculpa?")) return;
    try {
      await api.excluirDesculpa(id);
      await carregarDesculpas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir desculpa");
    }
  }

  return (
    <div>
      <section className="card">
        <h1 className="section-title">Desculpas</h1>
        <p className="meta">Registro de ausencias com filtro por periodo e jogador.</p>
      </section>

      {error ? <section className="card error-msg">{error}</section> : null}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Filtros</h2>
        <div className="grid two">
          <label>
            Jogador
            <select value={filtroJogadorId} onChange={(e) => setFiltroJogadorId(e.target.value)}>
              <option value="">Todos</option>
              {jogadores.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data inicial
            <input type="date" value={filtroDataInicial} onChange={(e) => setFiltroDataInicial(e.target.value)} />
          </label>
          <label>
            Data final
            <input type="date" value={filtroDataFinal} onChange={(e) => setFiltroDataFinal(e.target.value)} />
          </label>
        </div>
        <div className="inline-actions" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={() => void carregarDesculpas()}>
            Aplicar
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              setFiltroJogadorId("");
              setFiltroDataInicial("");
              setFiltroDataFinal("");
              void carregarDesculpas();
            }}
          >
            Limpar
          </button>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Nova desculpa</h2>
        <div className="form-grid">
          <label>
            Jogador
            <select
              value={nova.jogadorId}
              onChange={(e) => setNova((prev) => ({ ...prev, jogadorId: e.target.value }))}
              disabled={!isLoggedIn}
            >
              <option value="">Selecione...</option>
              {jogadores.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data
            <input
              type="date"
              value={nova.data}
              onChange={(e) => setNova((prev) => ({ ...prev, data: e.target.value }))}
              disabled={!isLoggedIn}
            />
          </label>
          <label>
            Descricao
            <textarea
              value={nova.descricao}
              onChange={(e) => setNova((prev) => ({ ...prev, descricao: e.target.value }))}
              disabled={!isLoggedIn}
            />
          </label>
          <button className="btn primary" onClick={() => void salvarNova()} disabled={!isLoggedIn}>
            Salvar
          </button>
        </div>
      </section>

      <section className="card">
        {desculpas.map((desculpa) => (
          <div className="list-row" key={desculpa.id}>
            <div>
              <strong>{desculpa.jogadorNome}</strong>
              <div className="meta">{new Date(`${desculpa.data}T00:00:00`).toLocaleDateString("pt-BR")}</div>
              <div>{desculpa.descricao}</div>
            </div>
            <div className="inline-actions">
              {isLoggedIn ? (
                <>
                  <button className="btn ghost" onClick={() => setEditando({ ...desculpa })}>
                    Editar
                  </button>
                  <button className="btn danger" onClick={() => void excluir(desculpa.id ?? "")}>Excluir</button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      {editando ? (
        <div className="modal-backdrop" onClick={() => setEditando(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Editar desculpa</h2>
            <div className="form-grid">
              <label>
                Jogador
                <select
                  value={editando.jogadorId}
                  onChange={(e) => setEditando({ ...editando, jogadorId: e.target.value })}
                >
                  {jogadores.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Data
                <input
                  type="date"
                  value={editando.data}
                  onChange={(e) => setEditando({ ...editando, data: e.target.value })}
                />
              </label>
              <label>
                Descricao
                <textarea
                  value={editando.descricao}
                  onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
                />
              </label>
              <div className="modal-actions">
                <button className="btn ghost" onClick={() => setEditando(null)}>Cancelar</button>
                <button className="btn primary" onClick={() => void salvarEdicao()}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
