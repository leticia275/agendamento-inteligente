import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DEFAULT_SCHEDULE = [1, 2, 3, 4, 5].map((day) => ({
  dayOfWeek: day,
  startTime: "09:00",
  endTime:   "18:00",
}));

const SELLERS = [
  { name: "Andrezza", slug: "andrezza", email: "andrezza@reconectaoficial.com.br" },
  { name: "Hawinne",  slug: "hawinne",  email: "hawinne@reconectaoficial.com.br"  },
  { name: "Stefany",  slug: "stefany",  email: "stefany@reconectaoficial.com.br"  },
  { name: "Marcelo",  slug: "marcelo",  email: "marcelo@reconectaoficial.com.br"  },
];

const PRE_SELLERS = [
  { name: "Leticia (Admin)", email: "admin@reconectaoficial.com.br", role: "ADMIN" as const },
  { name: "Pré-vendedor 1",  email: "pre1@reconectaoficial.com.br",  role: "PRE_SELLER" as const },
  { name: "Pré-vendedor 2",  email: "pre2@reconectaoficial.com.br",  role: "PRE_SELLER" as const },
];

async function main() {
  const hash = async (pw: string) => bcrypt.hash(pw, 10);

  console.log("Criando configuração do sistema...");
  await prisma.systemConfig.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global" },
  });

  console.log("Criando pré-vendedores e admin...");
  for (const u of PRE_SELLERS) {
    const user = await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, password: await hash("senha123"), role: u.role },
    });
    console.log(`  ✓ ${user.name} (${user.role})`);
  }

  console.log("Criando vendedores e disponibilidade...");
  for (const s of SELLERS) {
    const seller = await prisma.user.upsert({
      where:  { email: s.email },
      update: {},
      create: {
        name: s.name, email: s.email,
        password: await hash("senha123"),
        role: "SELLER",
        slug: s.slug,
      },
    });

    await prisma.availability.deleteMany({ where: { sellerId: seller.id } });
    await prisma.availability.createMany({
      data: DEFAULT_SCHEDULE.map((d) => ({ ...d, sellerId: seller.id })),
    });

    console.log(`  ✓ ${seller.name} (${s.slug}) — seg a sex 09–18`);
  }

  console.log("\nSeed concluído.");
  console.log("Login admin: admin@reconectaoficial.com.br / senha123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
