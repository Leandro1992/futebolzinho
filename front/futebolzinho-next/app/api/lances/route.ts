import { NextResponse } from "next/server";
import { listLatestLances, r2Config } from "@/lib/server/r2-lances";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!r2Config()) {
    return NextResponse.json({ error: "Armazenamento de vídeos não configurado" }, { status: 503 });
  }
  try {
    const result = await listLatestLances();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao listar lances");
    return NextResponse.json(
      { error: error instanceof Error && error.message === "Armazenamento de vídeos não configurado" ? error.message : "Não foi possível listar os vídeos" },
      { status: 502 }
    );
  }
}
