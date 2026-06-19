"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { startOfDay } from "date-fns";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Sem permissão.");
  return session;
}

export async function addSeller(
  _prev: { error: string } | { success: true },
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  try { await requireAdmin(); } catch { return { error: "Sem permissão." }; }

  const name  = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const slug  = (formData.get("slug") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string) || "senha123";
  const duration = parseInt(formData.get("defaultMeetingDuration") as string) || 60;

  if (!name || !email || !slug) return { error: "Nome, e-mail e slug são obrigatórios." };

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { slug }] } });
  if (existing) return { error: "E-mail ou slug já cadastrado." };

  await prisma.user.create({
    data: {
      name,
      email,
      slug,
      password:               await bcrypt.hash(password, 10),
      role:                   "SELLER",
      defaultMeetingDuration: duration,
    },
  });

  revalidatePath("/admin/vendedores");
  redirect("/admin/vendedores");
}

export async function updateSeller(
  sellerId: string,
  _prev: { error: string } | { success: true },
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  try { await requireAdmin(); } catch { return { error: "Sem permissão." }; }

  const name     = (formData.get("name") as string)?.trim();
  const duration = parseInt(formData.get("defaultMeetingDuration") as string) || 60;
  const active   = formData.get("active") === "true";

  const weightRaw = formData.get("conversionWeightOverride") as string;
  const conversionWeightOverride =
    !weightRaw || weightRaw.trim() === ""
      ? null
      : parseFloat(weightRaw) / 100;

  const maxRaw = formData.get("maxMeetingsPerDay") as string;
  const maxMeetingsPerDay = !maxRaw || maxRaw.trim() === "" ? null : parseInt(maxRaw);

  const bufferMinutes    = parseInt(formData.get("bufferMinutes") as string) || 0;
  const bookingWindowDays = parseInt(formData.get("bookingWindowDays") as string) || 30;

  const noticeRaw = formData.get("minSchedulingNoticeHours") as string;
  const minSchedulingNoticeHours = !noticeRaw || noticeRaw.trim() === "" ? null : parseInt(noticeRaw);

  await prisma.user.update({
    where: { id: sellerId },
    data: {
      name,
      active,
      defaultMeetingDuration:   duration,
      conversionWeightOverride,
      maxMeetingsPerDay,
      bufferMinutes,
      bookingWindowDays,
      minSchedulingNoticeHours,
    },
  });

  revalidatePath("/admin/vendedores");
  return { success: true as const };
}

export async function updateSystemConfig(
  _prev: { error: string } | { success: true },
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  try { await requireAdmin(); } catch { return { error: "Sem permissão." }; }

  const template    = (formData.get("eventDescriptionTemplate") as string) ?? "";
  const noticeHours = parseInt(formData.get("minSchedulingNoticeHours") as string) || 0;
  const slackUrl    = (formData.get("slackWebhookUrl") as string)?.trim() || null;

  await prisma.systemConfig.upsert({
    where:  { id: "global" },
    update: { eventDescriptionTemplate: template, minSchedulingNoticeHours: noticeHours, slackWebhookUrl: slackUrl },
    create: { id: "global", eventDescriptionTemplate: template, minSchedulingNoticeHours: noticeHours, slackWebhookUrl: slackUrl },
  });

  revalidatePath("/admin/configuracoes");
  return { success: true };
}

export async function disconnectGoogleCalendar(sellerId: string) {
  try { await requireAdmin(); } catch { return { error: "Sem permissão." }; }

  await prisma.user.update({
    where: { id: sellerId },
    data: { googleRefreshToken: null, googleCalendarId: null },
  });

  revalidatePath(`/admin/vendedores/${sellerId}`);
  return { success: true };
}

export async function addAvailabilityOverride(
  sellerId: string,
  _prev: { error: string } | { success: true },
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  try { await requireAdmin(); } catch { return { error: "Sem permissão." }; }

  const dateStr = formData.get("date") as string;
  if (!dateStr) return { error: "Data obrigatória." };

  const date = startOfDay(new Date(dateStr + "T12:00:00")); // noon to avoid TZ drift

  await prisma.availabilityOverride.upsert({
    where: { sellerId_date: { sellerId, date } },
    update: { isBlocked: true },
    create: { sellerId, date, isBlocked: true },
  });

  revalidatePath(`/admin/vendedores/${sellerId}`);
  return { success: true };
}

export async function removeAvailabilityOverride(sellerId: string, overrideId: string) {
  try { await requireAdmin(); } catch { return { error: "Sem permissão." }; }

  await prisma.availabilityOverride.delete({ where: { id: overrideId } });

  revalidatePath(`/admin/vendedores/${sellerId}`);
  return { success: true };
}
