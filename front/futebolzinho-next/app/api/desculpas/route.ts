import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/server/http";
import { LegacyModels } from "@/lib/server/legacy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const filtros: Record<string, string> = {};
    const jogadorId = request.nextUrl.searchParams.get("jogadorId");
    const dataInicial = request.nextUrl.searchParams.get("dataInicial");
    const dataFinal = request.nextUrl.searchParams.get("dataFinal");

    if (jogadorId) filtros.jogadorId = jogadorId;
    if (dataInicial) filtros.dataInicial = dataInicial;
    if (dataFinal) filtros.dataFinal = dataFinal;

    const data = await LegacyModels.Desculpa.obterTodas(filtros);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao buscar desculpas: ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const desculpa = new LegacyModels.Desculpa(body);
    const data = await desculpa.salvar();
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao criar desculpa: ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}
