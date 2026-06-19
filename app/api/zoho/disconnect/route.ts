import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.systemConfig.upsert({
    where:  { id: "global" },
    update: { zohoRefreshToken: null },
    create: { id: "global", zohoRefreshToken: null },
  });

  return NextResponse.redirect(new URL("/admin/configuracoes?zoho=disconnected", req.url));
}
