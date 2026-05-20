import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/server/http";
import { LegacyModels } from "@/lib/server/legacy";

export const runtime = "nodejs";

export async function GET() {
  try {
    const todos = await LegacyModels.PartidasAvulsas.obterTodas();
    return NextResponse.json({ data: todos }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar partidas avulsas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const partida = new LegacyModels.PartidasAvulsas(body);
    await partida.salvar();
    return NextResponse.json({ data: partida }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao criar partida avulsa ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await LegacyModels.PartidasAvulsas.atualizarPartida(body);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao atualizar partida avulsa ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}
