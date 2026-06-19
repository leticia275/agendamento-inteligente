import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { AppointmentStatus, LeadOrigin } from "@/app/generated/prisma/enums";
import { AdminActions } from "./_components/admin-actions";
import { Users, Settings, BarChart2 } from "lucide-react";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW:   "Não compareceu",
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-zinc-100 text-zinc-500",
  NO_SHOW:   "bg-red-50 text-red-600",
};

const ORIGIN_LABEL: Record<LeadOrigin, string> = {
  REATIVACAO:       "Reativação",
  RECUPERACAO:      "Recuperação",
  FABRICA_CONTATOS: "Fábrica de contatos",
  INDICACAO:        "Indicação",
  FOLLOW_UP:        "Follow-up",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "PRE_SELLER") redirect("/");

  const appointments = await prisma.appointment.findMany({
    orderBy: { date: "desc" },
    include: {
      seller:    { select: { name: true } },
      preSeller: { select: { name: true } },
    },
    take: 200,
  });

  const total     = appointments.length;
  const converted = appointments.filter((a) => a.converted).length;
  const convRate  = total > 0 ? Math.round((converted / total) * 100) : 0;
  const scheduled = appointments.filter((a) => a.status === "SCHEDULED").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-brand" style={{ fontFamily: "Georgia, serif" }}>Painel Admin</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Olá, {session.user.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/vendedores"
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 px-3.5 py-2 text-sm font-medium text-brand hover:bg-brand-light transition"
          >
            <Users size={15} />
            Vendedores
          </Link>
          {session.user.role === "ADMIN" && (
            <>
              <Link
                href="/admin/analytics"
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 px-3.5 py-2 text-sm font-medium text-brand hover:bg-brand-light transition"
              >
                <BarChart2 size={15} />
                Analytics
              </Link>
              <Link
                href="/admin/configuracoes"
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 px-3.5 py-2 text-sm font-medium text-brand hover:bg-brand-light transition"
              >
                <Settings size={15} />
                Configurações
              </Link>
            </>
          )}
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-brand underline underline-offset-2 transition"
          >
            ← Início
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: total, color: "text-zinc-900" },
          { label: "Agendados", value: scheduled, color: "text-blue-700" },
          { label: "Convertidos", value: converted, color: "text-green-600" },
          { label: "Taxa de conversão", value: `${convRate}%`, color: "text-zinc-900" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-zinc-200 p-4">
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Lead</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Data</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Vendedor</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Pré-vendedor</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Origem</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Conv.</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-zinc-50 transition">
                <td className="px-4 py-3 font-medium text-zinc-900">{a.leadName}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {format(a.date, "dd/MM/yy HH:mm", { locale: ptBR })}
                </td>
                <td className="px-4 py-3 text-zinc-600">{a.seller.name}</td>
                <td className="px-4 py-3 text-zinc-600">{a.preSeller.name}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {ORIGIN_LABEL[a.origin]}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {a.converted
                    ? <span className="text-green-600 font-medium">Sim</span>
                    : <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <AdminActions id={a.id} currentStatus={a.status} converted={a.converted} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 && (
          <p className="text-center text-zinc-400 text-sm py-12">Nenhum agendamento ainda.</p>
        )}
      </div>
    </div>
  );
}
