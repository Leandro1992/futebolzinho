import { NextRequest, NextResponse } from "next/server";
import { LegacyModels } from "@/lib/server/legacy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const dataInicial = request.nextUrl.searchParams.get("dataInicial") ?? undefined;
    const dataFim = request.nextUrl.searchParams.get("dataFim") ?? undefined;
    const data = await LegacyModels.Partidas.obterEstatisticasPartidas(dataInicial, dataFim);
    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 });
  }
}
