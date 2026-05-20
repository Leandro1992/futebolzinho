"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Jogador } from "@/lib/types";
import { useAuth } from "@/components/auth-context";

export default function JogadoresPage() {
  const { isLoggedIn } = useAuth();
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [nome, setNome] = useState("");
  const [mensalista, setMensalista] = useState(true);
  const [editing, setEditing] = useState<Jogador | null>(null);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function carregar() {
    try {
      setError(null);
      const response = await api.getJogadores();
      setJogadores(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar jogadores");
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const jogadoresFiltrados = useMemo(() => {
    return jogadores
      .filter((j) => j.nome.toLowerCase().includes(filtro.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [filtro, jogadores]);

  async function salvarNovo() {
    if (!nome.trim()) return;
    try {
      const response = await api.criarJogador({ nome: nome.trim(), mensalista });
      setJogadores((prev) => [...prev, response.data]);
      setNome("");
      setMensalista(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar jogador");
    }
  }

  async function salvarEdicao() {
    if (!editing) return;
    try {
      await api.editarJogador(editing);
      setJogadores((prev) => prev.map((j) => (j.id === editing.id ? editing : j)));
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar jogador");
    }
  }

  return (
    <div>
      <section className="card">
        <h1 className="section-title">Jogadores</h1>
        <p className="meta">Cadastro de atletas e mensalistas.</p>
      </section>

      {error ? <section className="card error-msg">{error}</section> : null}

      {isLoggedIn ? (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Novo jogador</h2>
          <div className="form-grid">
            <label>
              Nome
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do jogador" />
            </label>
            <label>
              Mensalista
              <select
                value={mensalista ? "sim" : "nao"}
                onChange={(e) => setMensalista(e.target.value === "sim")}
              >
                <option value="sim">Sim</option>
                <option value="nao">Nao</option>
              </select>
            </label>
            <button className="btn primary" onClick={() => void salvarNovo()}>
              Salvar
            </button>
          </div>
        </section>
      ) : null}

      <section className="card">
        <label>
          Filtrar
          <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Busque pelo nome" />
        </label>
      </section>

      <section className="card">
        {jogadoresFiltrados.map((jogador) => (
          <div key={jogador.id} className="list-row">
            <div>
              <strong>{jogador.nome}</strong>
              <div className="meta">{jogador.mensalista ? "Mensalista" : "Avulso"}</div>
            </div>
            {isLoggedIn ? (
              <button className="btn ghost" onClick={() => setEditing({ ...jogador })}>
                Editar
              </button>
            ) : null}
          </div>
        ))}
      </section>

      {editing ? (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Editar jogador</h2>
            <div className="form-grid">
              <label>
                Nome
                <input
                  value={editing.nome}
                  onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
                />
              </label>
              <label>
                Mensalista
                <select
                  value={editing.mensalista ? "sim" : "nao"}
                  onChange={(e) => setEditing({ ...editing, mensalista: e.target.value === "sim" })}
                >
                  <option value="sim">Sim</option>
                  <option value="nao">Nao</option>
                </select>
              </label>
              <div className="modal-actions">
                <button className="btn ghost" onClick={() => setEditing(null)}>
                  Cancelar
                </button>
                <button className="btn primary" onClick={() => void salvarEdicao()}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
