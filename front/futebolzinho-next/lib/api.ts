import type { Desculpa, PartidaAvulsa } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

type Envelope<T> = { data: T };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? body.message ?? "Erro na requisicao");
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ success: boolean; token: { email: string } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getJogadores: () => request<Envelope<any[]>>("/api/jogadores"),
  criarJogador: (payload: unknown) =>
    request<Envelope<any>>("/api/jogadores", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  editarJogador: (payload: unknown) =>
    request<Envelope<any>>("/api/jogadores", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getPartidas: () => request<Envelope<any[]>>("/api/partidas"),
  criarPartida: (payload: unknown) =>
    request<Envelope<string>>("/api/partidas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  editarPartida: (payload: unknown) =>
    request<Envelope<string>>("/api/partidas", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  excluirPartida: (id: string) =>
    request<{ message: string }>(`/api/partidas/${id}`, {
      method: "DELETE",
    }),
  getEstatisticas: (dataInicial: string, dataFim: string) =>
    request<Envelope<any[]>>(
      `/api/partidas/estatisticas?dataInicial=${encodeURIComponent(dataInicial)}&dataFim=${encodeURIComponent(dataFim)}`
    ),

  getDesculpas: (query?: { jogadorId?: string; dataInicial?: string; dataFinal?: string }) => {
    const params = new URLSearchParams();
    if (query?.jogadorId) params.set("jogadorId", query.jogadorId);
    if (query?.dataInicial) params.set("dataInicial", query.dataInicial);
    if (query?.dataFinal) params.set("dataFinal", query.dataFinal);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request<Envelope<Desculpa[]>>(`/api/desculpas${suffix}`);
  },
  criarDesculpa: (payload: Desculpa) =>
    request<Envelope<Desculpa>>("/api/desculpas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  editarDesculpa: (id: string, payload: Desculpa) =>
    request<Envelope<Desculpa>>(`/api/desculpas/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  excluirDesculpa: (id: string) =>
    request<{ message: string }>(`/api/desculpas/${id}`, {
      method: "DELETE",
    }),

  getPartidasAvulsas: () => request<Envelope<any[]>>("/api/partidas-avulsas"),
  criarPartidaAvulsa: (payload: PartidaAvulsa) =>
    request<Envelope<PartidaAvulsa>>("/api/partidas-avulsas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  editarPartidaAvulsa: (payload: PartidaAvulsa) =>
    request<Envelope<string>>("/api/partidas-avulsas", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
