import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const ORIGIN_LABEL: Record<string, string> = {
  REATIVACAO: "Reativação", RECUPERACAO: "Recuperação",
  FABRICA_CONTATOS: "Fábrica de contatos", INDICACAO: "Indicação", FOLLOW_UP: "Follow-up",
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const appointments = await prisma.appointment.findMany({
    select: {
      status: true, converted: true, origin: true, revenueRange: true,
      utmSource: true, utmMedium: true, utmCampaign: true,
      seller: { select: { name: true } },
    },
  });

  const total      = appointments.length;
  const completed  = appointments.filter((a) => a.status === "COMPLETED").length;
  const converted  = appointments.filter((a) => a.converted).length;
  const noShow     = appointments.filter((a) => a.status === "NO_SHOW").length;
  const cancelled  = appointments.filter((a) => a.status === "CANCELLED").length;
  const scheduled  = appointments.filter((a) => a.status === "SCHEDULED").length;

  const attendanceRate = (total - cancelled) > 0
    ? ((completed / (total - cancelled - scheduled)) * 100).toFixed(0)
    : "—";
  const conversionRate = completed > 0 ? ((converted / completed) * 100).toFixed(0) : "—";
  const noShowRate = (total - cancelled - scheduled) > 0
    ? ((noShow / (total - cancelled - scheduled)) * 100).toFixed(0)
    : "—";

  // By origin
  const origins = ["REATIVACAO", "RECUPERACAO", "FABRICA_CONTATOS", "INDICACAO", "FOLLOW_UP"];
  const byOrigin = origins.map((origin) => {
    const group = appointments.filter((a) => a.origin === origin);
    const gc = group.filter((a) => a.status === "COMPLETED").length;
    const gv = group.filter((a) => a.converted).length;
    const gn = group.filter((a) => a.status === "NO_SHOW").length;
    return {
      origin,
      total: group.length,
      completed: gc,
      converted: gv,
      noShow: gn,
      conversionRate: gc > 0 ? ((gv / gc) * 100).toFixed(0) : "—",
      noShowRate: gc + gn > 0 ? ((gn / (gc + gn)) * 100).toFixed(0) : "—",
    };
  }).filter((r) => r.total > 0);

  // By seller
  const sellerMap = new Map<string, { name: string; total: number; completed: number; converted: number; noShow: number }>();
  for (const a of appointments) {
    const name = a.seller.name ?? "?";
    if (!sellerMap.has(name)) sellerMap.set(name, { name, total: 0, completed: 0, converted: 0, noShow: 0 });
    const s = sellerMap.get(name)!;
    s.total++;
    if (a.status === "COMPLETED") s.completed++;
    if (a.converted) s.converted++;
    if (a.status === "NO_SHOW") s.noShow++;
  }
  const bySeller = [...sellerMap.values()].sort((a, b) => b.total - a.total);

  // UTM breakdown
  const withUtm = appointments.filter((a) => a.utmSource);
  const utmMap = new Map<string, number>();
  for (const a of withUtm) {
    const key = [a.utmSource, a.utmMedium, a.utmCampaign].filter(Boolean).join(" / ");
    utmMap.set(key, (utmMap.get(key) ?? 0) + 1);
  }
  const byUtm = [...utmMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-900">Admin</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">Analytics</span>
      </div>

      <h1 className="text-xl font-semibold text-zinc-900 mb-8">Analytics de agendamentos</h1>

      {/* Cards globais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total agendado", value: total, sub: "" },
          { label: "Taxa de comparecimento", value: `${attendanceRate}%`, sub: `${completed} realizados` },
          { label: "Taxa de conversão", value: `${conversionRate}%`, sub: `${converted} fechados` },
          { label: "Taxa de no-show", value: `${noShowRate}%`, sub: `${noShow} ausências` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
            <p className="text-xs text-zinc-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-zinc-900">{value}</p>
            {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Por origem */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">Por origem</h2>
        <div className="rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Origem</th>
                <th className="px-4 py-3 text-right">Agendados</th>
                <th className="px-4 py-3 text-right">Realizados</th>
                <th className="px-4 py-3 text-right">Convertidos</th>
                <th className="px-4 py-3 text-right">Conversão</th>
                <th className="px-4 py-3 text-right">No-show</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {byOrigin.map((r) => (
                <tr key={r.origin} className="bg-white">
                  <td className="px-4 py-3 font-medium text-zinc-900">{ORIGIN_LABEL[r.origin]}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">{r.total}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">{r.completed}</td>
                  <td className="px-4 py-3 text-right text-green-700 font-medium">{r.converted}</td>
                  <td className="px-4 py-3 text-right font-semibold text-zinc-900">{r.conversionRate}%</td>
                  <td className="px-4 py-3 text-right text-red-600">{r.noShow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Por vendedor */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">Por vendedor</h2>
        <div className="rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Vendedor</th>
                <th className="px-4 py-3 text-right">Agendados</th>
                <th className="px-4 py-3 text-right">Realizados</th>
                <th className="px-4 py-3 text-right">Convertidos</th>
                <th className="px-4 py-3 text-right">Conversão</th>
                <th className="px-4 py-3 text-right">No-show</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {bySeller.map((s) => {
                const conv = s.completed > 0 ? ((s.converted / s.completed) * 100).toFixed(0) : "—";
                return (
                  <tr key={s.name} className="bg-white">
                    <td className="px-4 py-3 font-medium text-zinc-900">{s.name}</td>
                    <td className="px-4 py-3 text-right text-zinc-600">{s.total}</td>
                    <td className="px-4 py-3 text-right text-zinc-600">{s.completed}</td>
                    <td className="px-4 py-3 text-right text-green-700 font-medium">{s.converted}</td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-900">{conv}%</td>
                    <td className="px-4 py-3 text-right text-red-600">{s.noShow}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* UTMs */}
      {byUtm.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">Top origens de campanha (UTM)</h2>
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Source / Medium / Campaign</th>
                  <th className="px-4 py-3 text-right">Agendamentos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {byUtm.map(([key, count]) => (
                  <tr key={key} className="bg-white">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">{key}</td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-900">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
