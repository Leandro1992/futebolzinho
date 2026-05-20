import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/server/http";
import { LegacyModels } from "@/lib/server/legacy";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_: NextRequest, { params }: RouteContext) {
  try {
    const data = await LegacyModels.Desculpa.obterPorId(params.id);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Desculpa não encontrada: ${getErrorMessage(error)}` },
      { status: 404 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const body = await request.json();
    const data = await LegacyModels.Desculpa.atualizar(params.id, body);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    const data = await LegacyModels.Desculpa.excluir(params.id);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
