import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const sellerId = request.nextUrl.searchParams.get("sellerId");
  if (!sellerId) {
    return NextResponse.json({ error: "sellerId obrigatório." }, { status: 400 });
  }

  // SELLER só pode conectar a própria conta
  if (session.user.role === "SELLER" && session.user.id !== sellerId) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  if (session.user.role === "PRE_SELLER") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Google OAuth não configurado. Adicione GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env." },
      { status: 500 },
    );
  }

  const url = getAuthUrl(sellerId);
  return NextResponse.redirect(url);
}
