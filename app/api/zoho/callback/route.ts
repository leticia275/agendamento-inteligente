import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeZohoCode } from "@/lib/zoho";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code  = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/admin/configuracoes?zoho=error&msg=${encodeURIComponent(error ?? "sem código")}`, req.url),
    );
  }

  try {
    const redirectUri = new URL("/api/zoho/callback", req.url).toString();
    const refreshToken = await exchangeZohoCode(code, redirectUri);

    await prisma.systemConfig.upsert({
      where:  { id: "global" },
      update: { zohoRefreshToken: refreshToken },
      create: { id: "global", zohoRefreshToken: refreshToken },
    });

    return NextResponse.redirect(new URL("/admin/configuracoes?zoho=ok", req.url));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido";
    return NextResponse.redirect(
      new URL(`/admin/configuracoes?zoho=error&msg=${encodeURIComponent(msg)}`, req.url),
    );
  }
}
