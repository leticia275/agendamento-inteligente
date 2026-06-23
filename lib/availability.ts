import { prisma } from "@/lib/prisma";
import { getBusyTimes } from "@/lib/google-calendar";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import {
  startOfDay, endOfDay, addMinutes, getDay,
  isWithinInterval, parse, format, isBefore, addHours, addDays,
} from "date-fns";

const TZ = "America/Sao_Paulo";

// Given a UTC Date representing a calendar day (e.g. from startOfDay on a UTC server),
// returns midnight BRT for that same calendar date.
function brtMidnightFor(utcCalendarDay: Date): Date {
  // Adding 12h ensures we're at midday UTC = same calendar date in BRT (UTC-3).
  const midday = new Date(utcCalendarDay.getTime() + 12 * 60 * 60 * 1000);
  const middayZoned = toZonedTime(midday, TZ);
  const midnightZoned = startOfDay(middayZoned);
  return fromZonedTime(midnightZoned, TZ);
}

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

  // Booking window in BRT
  const todayBRT = fromZonedTime(startOfDay(toZonedTime(new Date(), TZ)), TZ);
  const windowCutoff = addDays(todayBRT, seller.bookingWindowDays);

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

  // Bookings per day (keyed by BRT date)
  const bookedPerDay: Record<string, number> = {};
  for (const b of booked) {
    const key = formatInTimeZone(b.date, TZ, "yyyy-MM-dd");
    bookedPerDay[key] = (bookedPerDay[key] ?? 0) + 1;
  }

  const duration = seller.defaultMeetingDuration;
  const result: Record<string, TimeSlot[]> = {};

  for (const day of days) {
    const brtMidnight = brtMidnightFor(day);

    // Booking window check (BRT)
    if (!isBefore(brtMidnight, windowCutoff)) continue;

    const key = formatInTimeZone(brtMidnight, TZ, "yyyy-MM-dd");
    const dow = getDay(toZonedTime(brtMidnight, TZ));

    // Date override: stored as midnight UTC keyed by same UTC date as day
    const utcKey = format(day, "yyyy-MM-dd");
    const override = overrides.find((o) => format(o.date, "yyyy-MM-dd") === utcKey);
    if (override?.isBlocked) continue;

    const avail = availabilities.find((a) => a.dayOfWeek === dow);
    if (!avail) continue;

    // Daily cap (BRT-keyed)
    if (seller.maxMeetingsPerDay != null && (bookedPerDay[key] ?? 0) >= seller.maxMeetingsPerDay) continue;

    // Parse start/end times as BRT local times → real UTC
    const dayStartZoned = toZonedTime(brtMidnight, TZ);
    const slotStartZoned = parse(avail.startTime, "HH:mm", dayStartZoned);
    const slotEndZoned   = parse(avail.endTime,   "HH:mm", dayStartZoned);
    const slotStart = fromZonedTime(slotStartZoned, TZ);
    const slotEnd   = fromZonedTime(slotEndZoned,   TZ);

    const slots: TimeSlot[] = [];
    let cursor = slotStart;

    while (!isBefore(slotEnd, addMinutes(cursor, duration))) {
      const end = addMinutes(cursor, duration);

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
        slots.push({
          start: cursor,
          end,
          label: formatInTimeZone(cursor, TZ, "HH:mm"),
        });
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
