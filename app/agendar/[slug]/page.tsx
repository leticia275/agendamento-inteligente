import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSlotsForRange } from "@/lib/availability";
import { BookingFlow } from "@/app/agendar/_components/booking-flow";
import { BrandHeader } from "@/app/components/brand-header";
import { addDays, startOfDay } from "date-fns";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function SellerBookingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { from: fromToken } = await searchParams;

  const seller = await prisma.user.findUnique({
    where: { slug, role: "SELLER", active: true },
    select: { id: true, name: true },
  });

  if (!seller) notFound();

  const today = startOfDay(new Date());
  const days  = Array.from({ length: 30 }, (_, i) => addDays(today, i));

  const raw = await getSlotsForRange(seller.id, days);

  const availableDaySlots = Object.fromEntries(
    Object.entries(raw).map(([key, slots]) => [
      key,
      slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString(), label: s.label })),
    ]),
  );

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader />
      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-brand" style={{ fontFamily: "Georgia, serif" }}>
            Agendar com {seller.name}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Selecione o dia e horário</p>
        </div>
        <BookingFlow
          availableDaySlots={availableDaySlots}
          sellerId={seller.id}
          sellerName={seller.name ?? undefined}
          fromToken={fromToken}
        />
      </main>
    </div>
  );
}
