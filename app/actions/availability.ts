"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type DaySchedule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
};

export async function saveAvailability(sellerId: string, schedule: DaySchedule[]) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Sem permissão." };
  if (session.user.role !== "ADMIN" && session.user.id !== sellerId)
    return { error: "Sem permissão." };

  await prisma.availability.deleteMany({ where: { sellerId } });

  const enabled = schedule.filter((d) => d.enabled);
  if (enabled.length > 0) {
    await prisma.availability.createMany({
      data: enabled.map(({ dayOfWeek, startTime, endTime }) => ({
        sellerId,
        dayOfWeek,
        startTime,
        endTime,
      })),
    });
  }

  revalidatePath(`/admin/vendedores/${sellerId}`);
  return { success: true };
}
