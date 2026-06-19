import { prisma } from "@/lib/prisma";
import { getSlotsForRange } from "@/lib/availability";
import { BookingFlow } from "@/app/agendar/_components/booking-flow";
import { BrandHeader } from "@/app/components/brand-header";
import { addDays, startOfDay } from "date-fns";

export default async function RodizioMaisPage() {
  const sellers = await prisma.user.findMany({
    where: { role: "SELLER", active: true },
    select: { id: true },
  });

  const today = startOfDay(new Date());
  const days  = Array.from({ length: 30 }, (_, i) => addDays(today, i));

  // Fetch all sellers in parallel — one GCal call per seller total
  const allSellerSlots = await Promise.all(
    sellers.map(({ id }) => getSlotsForRange(id, days)),
  );

  // Union of available slots per day (deduped by label)
  const availableDaySlots: Record<string, { start: string; end: string; label: string }[]> = {};
  for (const sellerSlots of allSellerSlots) {
    for (const [key, slots] of Object.entries(sellerSlots)) {
      const existing = availableDaySlots[key];
      const seen = new Set(existing?.map((s) => s.label) ?? []);
      for (const s of slots) {
        if (!seen.has(s.label)) {
          seen.add(s.label);
          if (!availableDaySlots[key]) availableDaySlots[key] = [];
          availableDaySlots[key].push({ start: s.start.toISOString(), end: s.end.toISOString(), label: s.label });
        }
      }
    }
  }

  for (const key of Object.keys(availableDaySlots)) {
    availableDaySlots[key].sort((a, b) => a.label.localeCompare(b.label));
  }

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader />
      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-brand" style={{ fontFamily: "Georgia, serif" }}>Rodízio Plus</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Faturamento acima de R$12k — vendedor selecionado automaticamente
          </p>
        </div>
        <BookingFlow availableDaySlots={availableDaySlots} isRodizio />
      </main>
    </div>
  );
}
