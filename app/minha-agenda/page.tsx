import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BrandHeader } from "@/app/components/brand-header";
import { SignOutButton } from "@/app/components/sign-out-button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ORIGIN_LABEL: Record<string, string> = {
  REATIVACAO: "Reativação", RECUPERACAO: "Recuperação",
  FABRICA_CONTATOS: "Fábrica de contatos", INDICACAO: "Indicação", FOLLOW_UP: "Follow-up",
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: "Agendado",  className: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Realizado", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelado", className: "bg-zinc-100 text-zinc-500" },
  NO_SHOW:   { label: "No-show",   className: "bg-red-100 text-red-600" },
};

export default async function MinhaAgendaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isPreSeller = session.user.role === "PRE_SELLER";
  const isSeller    = session.user.role === "SELLER" || session.user.role === "ADMIN";

  if (!isPreSeller && !isSeller) redirect("/");

  const userId = session.user.id;

  const appointments = await prisma.appointment.findMany({
    where: isPreSeller ? { preSellerId: userId } : { sellerId: userId },
    orderBy: { date: "desc" },
    select: {
      id: true, date: true, duration: true, status: true, converted: true,
      leadName: true, revenueRange: true, origin: true, notes: true,
      seller:    isPreSeller ? { select: { name: true } } : false,
      preSeller: isPreSeller ? false : { select: { name: true } },
    },
  });

  const total     = appointments.length;
  const completed = appointments.filter((a) => a.status === "COMPLETED").length;
  const converted = appointments.filter((a) => a.converted).length;
  const noShow    = appointments.filter((a) => a.status === "NO_SHOW").length;
  const scheduled = appointments.filter((a) => a.status === "SCHEDULED").length;
  const attended  = completed + noShow;

  const convRate       = completed > 0 ? ((converted / completed) * 100).toFixed(0) : "—";
  const attendanceRate = attended  > 0 ? ((completed / attended)  * 100).toFixed(0) : "—";
  const noShowRate     = attended  > 0 ? ((noShow / attended)     * 100).toFixed(0) : "—";

  const metrics = isPreSeller
    ? [
        { label: "Leads agendados",       value: total,               sub: `${scheduled} pendentes` },
        { label: "Taxa de comparecimento", value: `${attendanceRate}%`, sub: `${completed} compareceram` },
        { label: "Taxa de conversão",      value: `${convRate}%`,       sub: `${converted} fechados` },
        { label: "No-show",               value: `${noShowRate}%`,     sub: `${noShow} ausências` },
      ]
    : [
        { label: "Total recebido",        value: total,               sub: `${scheduled} pendentes` },
        { label: "Realizados",            value: completed,           sub: "" },
        { label: "Taxa de conversão",     value: `${convRate}%`,      sub: `${converted} fechados` },
        { label: "No-show",               value: `${noShowRate}%`,    sub: `${noShow} ausências` },
      ];

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader right={
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60 hidden sm:block">{session.user.name}</span>
          <SignOutButton />
        </div>
      } />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-zinc-900 mb-1">
          {isPreSeller ? "Minha atividade" : "Minha agenda"}
        </h1>
        <p className="text-sm text-zinc-500 mb-8">
          {isPreSeller
            ? "Leads que você agendou e métricas de conversão"
            : "Seus agendamentos e métricas pessoais"}
        </p>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {metrics.map(({ label, value, sub }) => (
            <div key={label} className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
              <p className="text-xs text-zinc-400 mb-1">{label}</p>
              <p className="text-2xl font-bold text-zinc-900">{value}</p>
              {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-3">
          {appointments.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-12">
              {isPreSeller ? "Você ainda não agendou nenhum lead." : "Nenhum agendamento ainda."}
            </p>
          )}
          {appointments.map((a) => {
            const st = STATUS_LABEL[a.status] ?? STATUS_LABEL.SCHEDULED;
            const counterpart = isPreSeller
              ? ("seller" in a && a.seller ? `Vendedor: ${a.seller.name}` : null)
              : null;

            return (
              <div key={a.id} className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-zinc-900">{a.leadName}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 capitalize">
                      {format(new Date(a.date), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      {" · "}{a.duration} min
                    </p>
                    {counterpart && (
                      <p className="text-xs text-zinc-400 mt-0.5">{counterpart}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                        {ORIGIN_LABEL[a.origin]}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                        {a.revenueRange === "ABOVE_12K" ? "+12k" : "-12k"}
                      </span>
                      {a.converted && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                          Convertido
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${st.className}`}>
                    {st.label}
                  </span>
                </div>
                {a.notes && (
                  <p className="text-xs text-zinc-400 mt-3 border-t border-zinc-100 pt-3">{a.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
