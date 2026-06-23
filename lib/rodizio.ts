import { prisma } from "@/lib/prisma";
import { RevenueRange } from "@/app/generated/prisma/enums";

// Weighted round-robin: credit = leads_received_in_pool / effective_conversion_rate
// Seller with LOWEST credit gets the next lead (they're "owed" more leads proportionally).
// effective_conversion_rate: use override if set, otherwise calculate from history (min 0.01).

export async function pickSeller(revenueRange: RevenueRange): Promise<string> {
  const sellers = await prisma.user.findMany({
    where: {
      role: "SELLER",
      active: true,
      ...(revenueRange === RevenueRange.ABOVE_12K
        ? { inRodizioPlus: true }
        : { inRodizioMinus: true }),
    },
    select: { id: true, conversionWeightOverride: true },
  });

  if (sellers.length === 0) throw new Error("Nenhum vendedor ativo disponível.");

  const stats = await Promise.all(
    sellers.map(async ({ id, conversionWeightOverride }) => {
      const [completed, converted, receivedInPool] = await Promise.all([
        prisma.appointment.count({ where: { sellerId: id, status: "COMPLETED" } }),
        prisma.appointment.count({ where: { sellerId: id, status: "COMPLETED", converted: true } }),
        prisma.appointment.count({ where: { sellerId: id, revenueRange } }),
      ]);

      const conversionRate =
        conversionWeightOverride !== null && conversionWeightOverride !== undefined
          ? conversionWeightOverride
          : completed > 0
          ? converted / completed
          : 0.01;

      const effectiveRate = Math.max(conversionRate, 0.01);
      const credit = receivedInPool / effectiveRate;

      return { id, credit };
    }),
  );

  stats.sort((a, b) => a.credit - b.credit);
  return stats[0].id;
}
