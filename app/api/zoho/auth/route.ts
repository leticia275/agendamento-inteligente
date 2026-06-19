import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getZohoAuthUrl } from "@/lib/zoho";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const redirectUri = new URL("/api/zoho/callback", req.url).toString();
  return NextResponse.redirect(getZohoAuthUrl(redirectUri));
}
