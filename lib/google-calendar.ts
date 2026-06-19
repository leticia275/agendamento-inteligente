import { google } from "googleapis";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export function getAuthUrl(sellerId: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
    state: sellerId,
  });
}

export async function exchangeCode(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

function makeAuth(refreshToken: string) {
  const client = getOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export async function getBusyTimes(
  refreshToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<{ start: Date; end: Date }[]> {
  try {
    const calendar = google.calendar({ version: "v3", auth: makeAuth(refreshToken) });
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: calendarId }],
      },
    });
    const busy = res.data.calendars?.[calendarId]?.busy ?? [];
    return busy
      .filter((b) => b.start && b.end)
      .map((b) => ({ start: new Date(b.start!), end: new Date(b.end!) }));
  } catch {
    return [];
  }
}

export async function createCalendarEvent(
  refreshToken: string,
  calendarId: string,
  event: { summary: string; description: string; start: Date; end: Date },
): Promise<{ eventId: string; meetLink: string | null } | null> {
  try {
    const calendar = google.calendar({ version: "v3", auth: makeAuth(refreshToken) });
    const res = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary:     event.summary,
        description: event.description,
        start: { dateTime: event.start.toISOString(), timeZone: "America/Sao_Paulo" },
        end:   { dateTime: event.end.toISOString(),   timeZone: "America/Sao_Paulo" },
        conferenceData: {
          createRequest: {
            requestId:             `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });
    if (!res.data.id) return null;
    return {
      eventId:  res.data.id,
      meetLink: res.data.hangoutLink ?? res.data.conferenceData?.entryPoints?.[0]?.uri ?? null,
    };
  } catch {
    return null;
  }
}

export async function deleteCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  try {
    const calendar = google.calendar({ version: "v3", auth: makeAuth(refreshToken) });
    await calendar.events.delete({ calendarId, eventId });
  } catch {
    // Best-effort deletion
  }
}
