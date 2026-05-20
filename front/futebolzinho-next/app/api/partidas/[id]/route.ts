import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/server/http";
import { LegacyModels } from "@/lib/server/legacy";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    await LegacyModels.Partidas.deletarPartida(params.id);
    return NextResponse.json({ message: "Partida deletada com sucesso" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao deletar partida ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}
