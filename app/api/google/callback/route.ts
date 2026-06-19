import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exchangeCode } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = request.nextUrl;
  const code     = searchParams.get("code");
  const sellerId = searchParams.get("state");
  const error    = searchParams.get("error");

  if (error || !code || !sellerId) {
    return NextResponse.redirect(
      new URL(`/admin/vendedores/${sellerId ?? ""}?gcal=error`, request.url),
    );
  }

  try {
    const tokens = await exchangeCode(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL(`/admin/vendedores/${sellerId}?gcal=no_refresh_token`, request.url),
      );
    }

    await prisma.user.update({
      where: { id: sellerId },
      data: {
        googleRefreshToken: tokens.refresh_token,
        googleCalendarId:   "primary",
      },
    });

    return NextResponse.redirect(
      new URL(`/admin/vendedores/${sellerId}?gcal=connected`, request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL(`/admin/vendedores/${sellerId}?gcal=error`, request.url),
    );
  }
}
