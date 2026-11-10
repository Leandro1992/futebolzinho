"use client";

import { useEffect, useState } from "react";
import { lanceTitle, type ListedVideo } from "@/lib/lances";

interface LanceList {
  videos: ListedVideo[];
  total: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LancesPage() {
  const [videos, setVideos] = useState<ListedVideo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [openingKey, setOpeningKey] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/lances", { cache: "no-store" });
      const data = (await response.json()) as LanceList & { error?: string };
      if (!response.ok) throw new Error(data.error || "Erro ao carregar os lances");
      setVideos(data.videos);
      setTotal(data.total);
      setOpenKey(null);
      setOpenUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar os lances");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function assistir(video: ListedVideo) {
    if (openKey === video.key) {
      setOpenKey(null);
      setOpenUrl(null);
      return;
    }
    setOpeningKey(video.key);
    setError(null);
    try {
      const response = await fetch(`/api/lances/url?key=${encodeURIComponent(video.key)}`, { cache: "no-store" });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Não foi possível abrir o vídeo");
      setOpenKey(video.key);
      setOpenUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível abrir o vídeo");
    } finally {
      setOpeningKey(null);
    }
  }

  return (
    <div>
      <section className="card lances-head">
        <div>
          <h1 className="section-title">Lances</h1>
          <p className="meta">Os 10 vídeos mais recentes da quinta. O arquivo só baixa quando você assiste.</p>
        </div>
        <button className="btn ghost" type="button" onClick={() => void carregar()} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </section>

      {error ? <p className="lances-error">{error}</p> : null}

      {loading && videos.length === 0 ? <p className="meta">Carregando a lista...</p> : null}

      {!loading && videos.length === 0 && !error ? (
        <section className="card">
          <p className="meta">Nenhum lance enviado ainda.</p>
        </section>
      ) : null}

      {total > videos.length ? (
        <p className="meta">Mostrando os {videos.length} mais recentes de {total}.</p>
      ) : null}

      <div className="lances-grid">
        {videos.map((video) => {
          const open = openKey === video.key && openUrl;
          return (
            <article className="card lance-card" key={video.key}>
              {open ? (
                <video className="lance-player" src={openUrl} controls autoPlay preload="none" playsInline />
              ) : (
                <button className="lance-poster" type="button" onClick={() => void assistir(video)} disabled={openingKey === video.key}>
                  {openingKey === video.key ? "Abrindo..." : "Assistir"}
                </button>
              )}
              <div className="lance-meta">
                <strong>{lanceTitle(video.name, video.lastModified)}</strong>
                <span className="meta">{formatSize(video.size)}</span>
              </div>
              <div className="lance-actions">
                <button className="btn ghost" type="button" onClick={() => void assistir(video)}>
                  {open ? "Fechar" : "Assistir"}
                </button>
                {open ? (
                  <a className="btn primary" href={openUrl} download={video.name}>
                    Baixar
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
