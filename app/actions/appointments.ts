"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pickSeller } from "@/lib/rodizio";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";
import { notifySlack } from "@/lib/slack";
import { syncZohoAppointment } from "@/lib/zoho";
import { RevenueRange, LeadOrigin, AppointmentStatus } from "@/app/generated/prisma/enums";
import { addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";

const ORIGIN_LABEL: Record<LeadOrigin, string> = {
  REATIVACAO:       "Reativação",
  RECUPERACAO:      "Recuperação",
  FABRICA_CONTATOS: "Fábrica de contatos",
  INDICACAO:        "Indicação",
  FOLLOW_UP:        "Follow-up",
};

const REVENUE_LABEL: Record<RevenueRange, string> = {
  BELOW_12K: "Abaixo de R$12k",
  ABOVE_12K: "Acima de R$12k",
};

function buildDescription(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{${k}}`, v),
    template,
  );
}

export async function bookAppointment(
  _prev: { error?: string; success?: boolean },
  formData: FormData,
) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Não autenticado." };

  const rawDate   = formData.get("selectedDateTime") as string;
  const rrStr     = formData.get("revenueRange") as string;
  const isRodizio = formData.get("isRodizio") === "true";
  let sellerId    = formData.get("sellerId") as string | null;

  if (!rawDate) return { error: "Data não selecionada." };

  const revenueRange = rrStr === "ABOVE_12K" ? RevenueRange.ABOVE_12K : RevenueRange.BELOW_12K;

  if (isRodizio || !sellerId) {
    try {
      sellerId = await pickSeller(revenueRange);
    } catch {
      return { error: "Nenhum vendedor disponível para rodízio." };
    }
  }

  const leadName = (formData.get("leadName") as string)?.trim();
  if (!leadName) return { error: "Nome do lead é obrigatório." };

  const originRaw = formData.get("origin") as string;
  const origin = (
    ["REATIVACAO", "RECUPERACAO", "FABRICA_CONTATOS", "INDICACAO", "FOLLOW_UP"].includes(originRaw)
      ? originRaw
      : "REATIVACAO"
  ) as LeadOrigin;

  const seller = await prisma.user.findUnique({
    where: { id: sellerId! },
    select: {
      name: true,
      email: true,
      googleRefreshToken: true,
      googleCalendarId: true,
      defaultMeetingDuration: true,
    },
  });

  const duration = seller?.defaultMeetingDuration ?? 60;
  const date     = new Date(rawDate);
  const notes    = (formData.get("notes") as string) || "";

  const appointment = await prisma.appointment.create({
    data: {
      sellerId:    sellerId!,
      preSellerId: session.user.id,
      date,
      duration,
      leadName,
      leadEmail:   (formData.get("leadEmail") as string) || null,
      leadPhone:   (formData.get("leadPhone") as string) || null,
      revenueRange,
      origin,
      notes:       notes || null,
      utmSource:   (formData.get("utmSource")   as string) || null,
      utmMedium:   (formData.get("utmMedium")   as string) || null,
      utmCampaign: (formData.get("utmCampaign") as string) || null,
      utmContent:  (formData.get("utmContent")  as string) || null,
      utmTerm:     (formData.get("utmTerm")     as string) || null,
      fbClickId:   (formData.get("fbClickId")   as string) || null,
      fbBrowserId: (formData.get("fbBrowserId") as string) || null,
    },
  });

  const config = await prisma.systemConfig.findUnique({ where: { id: "global" } });
  let meetLink: string | null = null;

  // Create Google Calendar event with Meet link (best-effort)
  if (seller?.googleRefreshToken) {
    const template    = config?.eventDescriptionTemplate ?? "";
    const description = buildDescription(template, {
      seller:       seller.name ?? "",
      leadName,
      revenueRange: REVENUE_LABEL[revenueRange],
      origin:       ORIGIN_LABEL[origin],
      notes,
    });

    const gcalResult = await createCalendarEvent(
      seller.googleRefreshToken,
      seller.googleCalendarId ?? "primary",
      {
        summary:     `Reunião: ${leadName} e ${seller.name ?? ""}`,
        description,
        start:       date,
        end:         addMinutes(date, duration),
      },
    );

    if (gcalResult) {
      meetLink = gcalResult.meetLink;
      await prisma.appointment.update({
        where: { id: appointment.id },
        data:  { googleEventId: gcalResult.eventId, meetLink: gcalResult.meetLink },
      });
    }
  }

  const preSeller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  // Slack notification (best-effort)
  if (config?.slackWebhookUrl) {
    await notifySlack(config.slackWebhookUrl, {
      leadName,
      sellerName: seller?.name ?? "?",
      preSeller:  preSeller?.name ?? session.user.name ?? "?",
      date,
      origin,
      revenueRange: revenueRange as string,
      meetLink,
    });
  }

  // Zoho CRM sync (best-effort)
  if (config?.zohoRefreshToken) {
    await syncZohoAppointment(config.zohoRefreshToken, {
      leadName,
      leadEmail:    (formData.get("leadEmail") as string) || null,
      leadPhone:    (formData.get("leadPhone") as string) || null,
      origin,
      revenueRange: revenueRange as string,
      sellerName:   seller?.name ?? "",
      sellerEmail:  seller?.email ?? null,
      notes:        notes || null,
      meetLink,
      date,
      duration,
    });
  }

  revalidatePath("/");
  return { success: true };
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "PRE_SELLER") return { error: "Sem permissão." };

  await prisma.appointment.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
  return { success: true };
}

export async function markConverted(id: string, converted: boolean) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "PRE_SELLER") return { error: "Sem permissão." };

  await prisma.appointment.update({ where: { id }, data: { converted } });
  revalidatePath("/admin");
  return { success: true };
}

export async function cancelAppointment(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Não autenticado." };

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { seller: { select: { googleRefreshToken: true, googleCalendarId: true } } },
  });
  if (!appt) return { error: "Agendamento não encontrado." };

  if (session.user.role === "PRE_SELLER" && appt.preSellerId !== session.user.id)
    return { error: "Sem permissão." };

  await prisma.appointment.update({
    where: { id },
    data: { status: AppointmentStatus.CANCELLED },
  });

  // Delete Google Calendar event (best-effort)
  if (appt.googleEventId && appt.seller.googleRefreshToken) {
    await deleteCalendarEvent(
      appt.seller.googleRefreshToken,
      appt.seller.googleCalendarId ?? "primary",
      appt.googleEventId,
    );
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}
