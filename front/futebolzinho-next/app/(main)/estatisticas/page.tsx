"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Estatistica } from "@/lib/types";

type SortKey = keyof Estatistica;

export default function EstatisticasPage() {
  const now = new Date();
  const ano = now.getFullYear();
  const [dataInicial, setDataInicial] = useState(`${ano}-01-01`);
  const [dataFim, setDataFim] = useState(`${ano}-12-31`);
  const [estatisticas, setEstatisticas] = useState<Estatistica[]>([]);
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({
    key: "gols",
    asc: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function carregar() {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getEstatisticas(dataInicial, dataFim);
      setEstatisticas(response.data as Estatistica[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar estatisticas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const sorted = useMemo(() => {
    const list = [...estatisticas];
    list.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "number" && typeof bv === "number") {
        return sort.asc ? av - bv : bv - av;
      }
      return 0;
    });
    return list;
  }, [estatisticas, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) => ({ key, asc: prev.key === key ? !prev.asc : false }));
  }

  return (
    <div>
      <section className="card">
        <h1 className="section-title">Estatisticas</h1>
        <p className="meta">Ranking por periodo com gols, assistencias e desempenho.</p>
      </section>

      <section className="card">
        <div className="grid two">
          <label>
            Data inicial
            <input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
          </label>
          <label>
            Data final
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </label>
        </div>
        <div style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={() => void carregar()} disabled={loading}>
            {loading ? "Carregando..." : "Atualizar"}
          </button>
        </div>
      </section>

      {error ? <section className="card error-msg">{error}</section> : null}

      <section className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr>
              <th>Jogador</th>
              <th><button className="btn ghost" onClick={() => toggleSort("jogos")}>Jogos</button></th>
              <th><button className="btn ghost" onClick={() => toggleSort("gols")}>Gols</button></th>
              <th><button className="btn ghost" onClick={() => toggleSort("assistencia")}>Assist</button></th>
              <th><button className="btn ghost" onClick={() => toggleSort("golContra")}>GC</button></th>
              <th><button className="btn ghost" onClick={() => toggleSort("destaque")}>Destaque</button></th>
              <th><button className="btn ghost" onClick={() => toggleSort("bolaMurcha")}>Bola murcha</button></th>
              <th><button className="btn ghost" onClick={() => toggleSort("vitorias")}>Vitorias</button></th>
              <th><button className="btn ghost" onClick={() => toggleSort("derrotas")}>Derrotas</button></th>
              <th><button className="btn ghost" onClick={() => toggleSort("empates")}>Empates</button></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr key={item.jogadorId}>
                <td style={{ padding: 8 }}>{item.jogador?.nome}</td>
                <td style={{ padding: 8 }}>{item.jogos}</td>
                <td style={{ padding: 8 }}>{item.gols}</td>
                <td style={{ padding: 8 }}>{item.assistencia}</td>
                <td style={{ padding: 8 }}>{item.golContra}</td>
                <td style={{ padding: 8 }}>{item.destaque}</td>
                <td style={{ padding: 8 }}>{item.bolaMurcha}</td>
                <td style={{ padding: 8 }}>{item.vitorias}</td>
                <td style={{ padding: 8 }}>{item.derrotas}</td>
                <td style={{ padding: 8 }}>{item.empates}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
