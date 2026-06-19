import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBusyTimes } from "@/lib/google-calendar";
import { parse, startOfDay, endOfDay, addMinutes, format, isBefore } from "date-fns";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const sellerId = request.nextUrl.searchParams.get("sellerId");
  const dateStr  = request.nextUrl.searchParams.get("date"); // "yyyy-MM-dd"

  if (!sellerId || !dateStr) {
    return NextResponse.json({ error: "sellerId e date são obrigatórios." }, { status: 400 });
  }

  const date = new Date(`${dateStr}T00:00:00`);
  const dow  = date.getDay();

  const [seller, avail, booked] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        name: true,
        googleRefreshToken: true,
        googleCalendarId: true,
        defaultMeetingDuration: true,
      },
    }),
    prisma.availability.findFirst({
      where: { sellerId, dayOfWeek: dow },
    }),
    prisma.appointment.findMany({
      where: {
        sellerId,
        status: { notIn: ["CANCELLED"] },
        date: { gte: startOfDay(date), lte: endOfDay(date) },
      },
      select: {
        date: true,
        duration: true,
        leadName: true,
        status: true,
      },
    }),
  ]);

  if (!seller) {
    return NextResponse.json({ error: "Vendedor não encontrado." }, { status: 404 });
  }

  // Schedule from our DB
  const schedule = avail
    ? { startTime: avail.startTime, endTime: avail.endTime }
    : null;

  // All possible slots (if schedule exists)
  let allSlots: string[] = [];
  if (avail && seller) {
    const duration = seller.defaultMeetingDuration;
    const dayStart = startOfDay(date);
    let cursor = parse(avail.startTime, "HH:mm", dayStart);
    const end  = parse(avail.endTime,   "HH:mm", dayStart);
    while (!isBefore(end, addMinutes(cursor, duration))) {
      allSlots.push(format(cursor, "HH:mm"));
      cursor = addMinutes(cursor, duration);
    }
  }

  // Google Calendar busy times
  let gcalBusy: { start: string; end: string }[] = [];
  let gcalError: string | null = null;
  if (seller.googleRefreshToken) {
    try {
      const busy = await getBusyTimes(
        seller.googleRefreshToken,
        seller.googleCalendarId ?? "primary",
        startOfDay(date),
        endOfDay(date),
      );
      gcalBusy = busy.map((b) => ({
        start: format(b.start, "HH:mm"),
        end:   format(b.end,   "HH:mm"),
      }));
    } catch (e) {
      gcalError = String(e);
    }
  }

  // System bookings
  const systemBooked = booked.map((b) => ({
    start:    format(b.date, "HH:mm"),
    end:      format(addMinutes(b.date, b.duration), "HH:mm"),
    leadName: b.leadName,
    status:   b.status,
  }));

  // Final available slots (what system offers)
  const bookedIntervals = [
    ...booked.map((b) => ({ start: b.date, end: addMinutes(b.date, b.duration) })),
    ...(seller.googleRefreshToken
      ? await getBusyTimes(
          seller.googleRefreshToken,
          seller.googleCalendarId ?? "primary",
          startOfDay(date),
          endOfDay(date),
        )
      : []),
  ];

  const availableSlots = avail && seller
    ? (() => {
        const duration = seller.defaultMeetingDuration;
        const dayStart = startOfDay(date);
        let cursor = parse(avail.startTime, "HH:mm", dayStart);
        const end  = parse(avail.endTime,   "HH:mm", dayStart);
        const slots: string[] = [];
        while (!isBefore(end, addMinutes(cursor, duration))) {
          const slotEnd = addMinutes(cursor, duration);
          const blocked = bookedIntervals.some(
            (b) =>
              (cursor >= b.start && cursor < b.end) ||
              (b.start >= cursor && b.start < slotEnd),
          );
          if (!blocked) slots.push(format(cursor, "HH:mm"));
          cursor = addMinutes(cursor, duration);
        }
        return slots;
      })()
    : [];

  return NextResponse.json({
    sellerName:    seller.name,
    date:          dateStr,
    dayOfWeek:     dow,
    hasSchedule:   !!avail,
    schedule,
    meetingDuration: seller.defaultMeetingDuration,
    gcalConnected: !!seller.googleRefreshToken,
    gcalError,
    allSlots,
    gcalBusy,
    systemBooked,
    availableSlots,
  });
}
