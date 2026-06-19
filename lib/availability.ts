import { prisma } from "@/lib/prisma";
import { getBusyTimes } from "@/lib/google-calendar";
import {
  startOfDay, endOfDay, addMinutes, getDay,
  isWithinInterval, parse, format, isBefore, addHours, addDays,
} from "date-fns";

export type TimeSlot = { start: Date; end: Date; label: string };

export async function getSlotsForRange(
  sellerId: string,
  days: Date[],
): Promise<Record<string, TimeSlot[]>> {
  if (days.length === 0) return {};

  const rangeStart = startOfDay(days[0]);
  const rangeEnd   = endOfDay(days[days.length - 1]);

  const [seller, availabilities, config, overrides] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        googleRefreshToken:       true,
        googleCalendarId:         true,
        defaultMeetingDuration:   true,
        maxMeetingsPerDay:        true,
        bufferMinutes:            true,
        bookingWindowDays:        true,
        minSchedulingNoticeHours: true,
      },
    }),
    prisma.availability.findMany({ where: { sellerId } }),
    prisma.systemConfig.findUnique({ where: { id: "global" }, select: { minSchedulingNoticeHours: true } }),
    prisma.availabilityOverride.findMany({
      where: { sellerId, date: { gte: rangeStart, lte: rangeEnd } },
    }),
  ]);

  if (!seller) return {};

  const [booked, gcalBusy] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        sellerId,
        status: { notIn: ["CANCELLED"] },
        date: { gte: rangeStart, lte: rangeEnd },
      },
      select: { date: true, duration: true },
    }),
    seller.googleRefreshToken
      ? getBusyTimes(
          seller.googleRefreshToken,
          seller.googleCalendarId ?? "primary",
          rangeStart,
          rangeEnd,
        )
      : Promise.resolve([]),
  ]);

  // Minimum scheduling notice: seller overrides global
  const noticeHours = seller.minSchedulingNoticeHours ?? config?.minSchedulingNoticeHours ?? 2;
  const earliestBookable = addHours(new Date(), noticeHours);

  // Booking window: seller-level (default 30 days)
  const windowCutoff = addDays(startOfDay(new Date()), seller.bookingWindowDays);

  // Buffer: expand blocked intervals by bufferMinutes on each side
  const buffer = seller.bufferMinutes;
  const blockedIntervals = [
    ...booked.map((b) => ({
      start: addMinutes(b.date, -buffer),
      end:   addMinutes(b.date, b.duration + buffer),
    })),
    ...gcalBusy.map((b) => ({
      start: addMinutes(b.start, -buffer),
      end:   addMinutes(b.end, buffer),
    })),
  ];

  // bookings per day for daily cap
  const bookedPerDay: Record<string, number> = {};
  for (const b of booked) {
    const key = format(b.date, "yyyy-MM-dd");
    bookedPerDay[key] = (bookedPerDay[key] ?? 0) + 1;
  }

  const duration = seller.defaultMeetingDuration;
  const result: Record<string, TimeSlot[]> = {};

  for (const day of days) {
    // Booking window: skip days beyond seller's window
    if (!isBefore(startOfDay(day), windowCutoff)) continue;

    const key = format(day, "yyyy-MM-dd");
    const dow = getDay(day);

    // Date override: skip if fully blocked
    const override = overrides.find((o) => format(o.date, "yyyy-MM-dd") === key);
    if (override?.isBlocked) continue;

    const avail = availabilities.find((a) => a.dayOfWeek === dow);
    if (!avail) continue;

    // Daily cap
    if (seller.maxMeetingsPerDay != null && (bookedPerDay[key] ?? 0) >= seller.maxMeetingsPerDay) continue;

    const dayStart  = startOfDay(day);
    const slotStart = parse(avail.startTime, "HH:mm", dayStart);
    const slotEnd   = parse(avail.endTime,   "HH:mm", dayStart);

    const slots: TimeSlot[] = [];
    let cursor = slotStart;

    while (!isBefore(slotEnd, addMinutes(cursor, duration))) {
      const end = addMinutes(cursor, duration);

      // Min scheduling notice
      if (isBefore(cursor, earliestBookable)) {
        cursor = addMinutes(cursor, duration);
        continue;
      }

      const blocked = blockedIntervals.some(
        (b) =>
          isWithinInterval(cursor, { start: b.start, end: b.end }) ||
          isWithinInterval(b.start, { start: cursor, end }) ||
          +cursor === +b.start,
      );

      if (!blocked) {
        slots.push({ start: cursor, end, label: format(cursor, "HH:mm") });
      }

      cursor = addMinutes(cursor, duration);
    }

    if (slots.length > 0) result[key] = slots;
  }

  return result;
}

// Kept for backwards compatibility (diagnostic tool)
export async function getSlotsForDay(sellerId: string, date: Date): Promise<TimeSlot[]> {
  const result = await getSlotsForRange(sellerId, [date]);
  return result[format(date, "yyyy-MM-dd")] ?? [];
}
