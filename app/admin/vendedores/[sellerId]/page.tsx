import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SellerEditForm } from "./_seller-edit-form";
import { AvailabilityForm } from "./_availability-form";
import { GoogleCalendarSection } from "./_google-calendar-section";
import { AvailabilityDebug } from "./_availability-debug";
import { OverrideForm } from "./_override-form";

type Props = {
  params: Promise<{ sellerId: string }>;
  searchParams: Promise<{ gcal?: string }>;
};

export default async function SellerDetailPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const { sellerId } = await params;
  const { gcal } = await searchParams;

  const [seller, appointments, overrides] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sellerId, role: "SELLER" },
      include: { availability: { orderBy: { dayOfWeek: "asc" } } },
    }),
    prisma.appointment.findMany({
      where: { sellerId },
      select: { status: true, converted: true, revenueRange: true },
    }),
    prisma.availabilityOverride.findMany({
      where: { sellerId },
      orderBy: { date: "asc" },
    }),
  ]);

  if (!seller) notFound();

  const completed  = appointments.filter((a) => a.status === "COMPLETED").length;
  const converted  = appointments.filter((a) => a.converted).length;
  const autoRate   = completed > 0 ? converted / completed : null;
  const totalBelow = appointments.filter((a) => a.revenueRange === "BELOW_12K").length;
  const totalAbove = appointments.filter((a) => a.revenueRange === "ABOVE_12K").length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Link href="/admin" className="text-zinc-500 hover:text-zinc-900">Admin</Link>
          <span className="text-zinc-300">/</span>
          <Link href="/admin/vendedores" className="text-zinc-500 hover:text-zinc-900">Vendedores</Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 font-medium">{seller.name}</span>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900">{seller.name}</h1>
        <div className="flex gap-6 mt-3 text-sm text-zinc-500">
          <span>{appointments.length} agendamentos</span>
          <span>{converted} conversões</span>
          <span>Taxa auto: {autoRate !== null ? `${(autoRate * 100).toFixed(0)}%` : "sem dados"}</span>
          <span>-12k: {totalBelow} · +12k: {totalAbove}</span>
        </div>
      </div>

      {/* Dados básicos + configurações */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">
          Dados e configurações
        </h2>
        <SellerEditForm
          sellerId={seller.id}
          defaultValues={{
            name:                     seller.name ?? "",
            active:                   seller.active,
            defaultMeetingDuration:   seller.defaultMeetingDuration,
            conversionWeightOverride: seller.conversionWeightOverride,
            autoConversionRate:       autoRate,
            maxMeetingsPerDay:        seller.maxMeetingsPerDay,
            bufferMinutes:            seller.bufferMinutes,
            bookingWindowDays:        seller.bookingWindowDays,
            minSchedulingNoticeHours: seller.minSchedulingNoticeHours,
          }}
        />
      </section>

      {/* Google Calendar */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">
          Google Calendar
        </h2>
        <GoogleCalendarSection
          sellerId={seller.id}
          connected={!!seller.googleRefreshToken}
          calendarId={seller.googleCalendarId ?? "primary"}
          gcalParam={gcal}
        />
      </section>

      {/* Disponibilidade semanal */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">
          Disponibilidade semanal
        </h2>
        <AvailabilityForm
          sellerId={seller.id}
          availability={seller.availability}
        />
      </section>

      {/* Bloqueio de datas avulsas */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-1">
          Bloqueio de datas
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          Bloqueie dias específicos para férias, feriados ou ausências pontuais.
        </p>
        <OverrideForm sellerId={seller.id} overrides={overrides} />
      </section>

      {/* Diagnóstico */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-1">
          Diagnóstico de disponibilidade
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          Veja slot a slot o que está livre, bloqueado pelo Google Calendar ou ocupado no sistema.
        </p>
        <AvailabilityDebug sellerId={seller.id} />
      </section>
    </div>
  );
}
