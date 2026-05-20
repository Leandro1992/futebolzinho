"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PartidaAvulsa } from "@/lib/types";
import { useAuth } from "@/components/auth-context";

function hoje() {
  return new Date().toISOString().split("T")[0];
}

export default function PartidasAvulsasPage() {
  const { isLoggedIn } = useAuth();
  const [partidas, setPartidas] = useState<PartidaAvulsa[]>([]);
  const [nome, setNome] = useState("");
  const [local, setLocal] = useState("Paula Ramos");
  const [data, setData] = useState(hoje());
  const [error, setError] = useState<string | null>(null);

  async function carregar() {
    try {
      setError(null);
      const response = await api.getPartidasAvulsas();
      setPartidas(response.data.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar partidas avulsas");
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function criar() {
    if (!isLoggedIn) {
      setError("Faça login para criar partida avulsa.");
      return;
    }

    if (!nome.trim()) {
      setError("Informe um nome para a partida avulsa.");
      return;
    }

    try {
      await api.criarPartidaAvulsa({
        nome: nome.trim(),
        local,
        data,
        encerrada: false,
        jogadores: [],
      });
      setNome("");
      await carregar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar partida avulsa");
    }
  }

  async function toggleEncerrada(partida: PartidaAvulsa) {
    try {
      await api.editarPartidaAvulsa({ ...partida, encerrada: !partida.encerrada });
      await carregar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar partida avulsa");
    }
  }

  return (
    <div>
      <section className="card">
        <h1 className="section-title">Partidas Avulsas</h1>
        <p className="meta">Gestao de jogos avulsos mantendo compatibilidade de persistencia.</p>
      </section>

      {error ? <section className="card error-msg">{error}</section> : null}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Nova partida avulsa</h2>
        <div className="grid two">
          <label>
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} disabled={!isLoggedIn} />
          </label>
          <label>
            Local
            <input value={local} onChange={(e) => setLocal(e.target.value)} disabled={!isLoggedIn} />
          </label>
          <label>
            Data
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} disabled={!isLoggedIn} />
          </label>
        </div>
        <div style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={() => void criar()} disabled={!isLoggedIn}>Criar</button>
        </div>
      </section>

      <section className="card">
        {partidas.map((partida) => (
          <div key={partida.id} className="list-row">
            <div>
              <strong>{partida.nome}</strong>
              <div className="meta">
                {new Date(`${partida.data}T00:00:00`).toLocaleDateString("pt-BR")} - {partida.local}
              </div>
              <div className="meta">Jogadores: {partida.jogadores?.length ?? 0}</div>
            </div>
            {isLoggedIn ? (
              <button className="btn ghost" onClick={() => void toggleEncerrada(partida)}>
                {partida.encerrada ? "Reabrir" : "Encerrar"}
              </button>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}
