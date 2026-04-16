import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/server/http";
import { LegacyModels } from "@/lib/server/legacy";

export const runtime = "nodejs";

export async function GET() {
  try {
    const todos = await LegacyModels.Jogadores.obterTodos();
    return NextResponse.json({ data: todos }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar jogadores" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const jogador = new LegacyModels.Jogadores(body);
    const data = await jogador.salvar();
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao criar jogador ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const jogador = new LegacyModels.Jogadores(body);
    const data = await jogador.atualizarDados(body);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
