import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight, Plus, Wifi, WifiOff } from "lucide-react";
import { RodizioChips } from "./_toggle-active";

export default async function VendedoresPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      active: true,
      inRodizioPlus: true,
      inRodizioMinus: true,
      googleRefreshToken: true,
      defaultMeetingDuration: true,
      conversionWeightOverride: true,
      _count: { select: { appointments: true } },
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-900">Admin</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">Vendedores</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Vendedores</h1>
        <Link
          href="/admin/vendedores/novo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-dark transition"
        >
          <Plus size={15} />
          Adicionar
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {sellers.map((s) => (
          <Link
            key={s.id}
            href={`/admin/vendedores/${s.id}`}
            className={`flex items-center justify-between rounded-xl border px-4 py-4 hover:border-zinc-400 transition ${
              s.active ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${s.active ? "text-zinc-900" : "text-zinc-400"}`}>
                    {s.name}
                  </span>
                  {!s.active && (
                    <span className="text-xs bg-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded">
                      Inativo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-zinc-400">/{s.slug}</span>
                  <span className="text-xs text-zinc-400">
                    {s._count.appointments} agendamentos
                  </span>
                  <span className="text-xs text-zinc-400">
                    {s.defaultMeetingDuration}min
                  </span>
                  {s.conversionWeightOverride !== null && s.conversionWeightOverride !== undefined && (
                    <span className="text-xs text-amber-600">
                      peso manual: {(s.conversionWeightOverride * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {s.googleRefreshToken ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Wifi size={13} /> Google Calendar
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <WifiOff size={13} /> Sem Calendar
                </span>
              )}
              <RodizioChips sellerId={s.id} inRodizioPlus={s.inRodizioPlus} inRodizioMinus={s.inRodizioMinus} />
              <ChevronRight size={16} className="text-zinc-400" />
            </div>
          </Link>
        ))}

        {sellers.length === 0 && (
          <p className="text-center text-zinc-400 text-sm py-10">
            Nenhum vendedor cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}
