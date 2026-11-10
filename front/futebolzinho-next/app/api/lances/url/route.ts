import { NextRequest, NextResponse } from "next/server";
import { r2Config, signLanceUrl } from "@/lib/server/r2-lances";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!r2Config()) {
    return NextResponse.json({ error: "Armazenamento de vídeos não configurado" }, { status: 503 });
  }
  const key = request.nextUrl.searchParams.get("key") ?? "";
  try {
    const url = await signLanceUrl(key);
    if (!url) {
      return NextResponse.json({ error: "Vídeo fora dos 10 mais recentes" }, { status: 404 });
    }
    return NextResponse.json({ url });
  } catch {
    console.error("Erro ao preparar o vídeo");
    return NextResponse.json({ error: "Não foi possível abrir o vídeo" }, { status: 502 });
  }
}
