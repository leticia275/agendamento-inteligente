import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, User, Settings, Shuffle } from "lucide-react";
import { SignOutButton } from "@/app/components/sign-out-button";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const isSeller = session.user.role === "SELLER";

  const sellers = await prisma.user.findMany({
    where: { role: "SELLER", active: true },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-brand px-6 py-0 h-[100px] overflow-hidden flex items-center justify-between shadow-md">
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            <filter id="remove-white-home">
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                       -1 -1 -1 3 0"
              />
            </filter>
          </defs>
        </svg>
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Reconecta"
            className="h-[250px] w-auto object-contain"
            style={{ filter: "url(#remove-white-home)" }}
          />
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/70 hidden sm:block">{session.user.name}</span>
          {isSeller && (
            <Link href="/minha-agenda" className="text-sm font-semibold text-gold hover:text-white transition">
              Minha agenda
            </Link>
          )}
          {session.user.role === "PRE_SELLER" && (
            <Link href="/minha-agenda" className="text-sm font-semibold text-gold hover:text-white transition">
              Minha atividade
            </Link>
          )}
          {(isAdmin || isSeller) && (
            <Link href="/admin" className="text-sm font-semibold text-gold hover:text-white transition">
              Admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Agendar lead</h2>
        <p className="text-sm text-zinc-500 mb-8">Escolha o tipo de agendamento</p>

        <div className="flex flex-col gap-4">
          {/* Rodízio (qualificação) */}
          <Link
            href="/agendar"
            className="group rounded-xl border-2 border-brand/20 bg-white px-5 py-5 hover:border-brand hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-brand p-2.5 text-white">
                <Shuffle size={20} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 group-hover:text-brand transition">
                  Agendar via Rodízio
                </p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Sistema escolhe o vendedor automaticamente pelo faturamento do lead
                </p>
              </div>
            </div>
          </Link>

          <div className="my-2 border-t border-zinc-200" />

          {/* Individual links */}
          {sellers.map(({ slug, name }) => (
            <Link
              key={slug!}
              href={`/agendar/${slug}`}
              className="group rounded-xl border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-400 hover:shadow-sm transition"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-zinc-100 p-2.5 text-zinc-600">
                  <User size={18} />
                </div>
                <div>
                  <p className="font-medium text-zinc-900 group-hover:text-zinc-700">{name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Link individual</p>
                </div>
              </div>
            </Link>
          ))}

          {(isAdmin || isSeller) && (
            <>
              <div className="my-2 border-t border-zinc-200" />
              <Link
                href="/admin"
                className="group rounded-xl border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-400 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-brand p-2.5 text-white">
                    <Settings size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">Painel Admin</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Ver agendamentos, gerenciar vendedores e disponibilidade
                    </p>
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
