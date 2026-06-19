const ZOHO_REGION  = process.env.ZOHO_REGION ?? "com";
const CLIENT_ID    = process.env.ZOHO_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET ?? "";

const ACCOUNTS_URL = `https://accounts.zoho.${ZOHO_REGION}`;
const API_URL      = `https://www.zohoapis.${ZOHO_REGION}/crm/v2`;

export function getZohoAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    scope:         "ZohoCRM.modules.leads.CREATE,ZohoCRM.modules.leads.UPDATE",
    client_id:     CLIENT_ID,
    response_type: "code",
    access_type:   "offline",
    redirect_uri:  redirectUri,
  });
  return `${ACCOUNTS_URL}/oauth/v2/auth?${params}`;
}

export async function exchangeZohoCode(
  code: string,
  redirectUri: string,
): Promise<string> {
  const res = await fetch(`${ACCOUNTS_URL}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "authorization_code",
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  redirectUri,
      code,
    }),
  });
  const json = await res.json() as { refresh_token?: string; error?: string };
  if (!json.refresh_token) throw new Error(json.error ?? "No refresh_token from Zoho");
  return json.refresh_token;
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(`${ACCOUNTS_URL}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "refresh_token",
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });
  const json = await res.json() as { access_token?: string; error?: string };
  if (!json.access_token) throw new Error(json.error ?? "Failed to refresh Zoho token");
  return json.access_token;
}

const ORIGIN_LABEL: Record<string, string> = {
  REATIVACAO: "Reativação", RECUPERACAO: "Recuperação",
  FABRICA_CONTATOS: "Fábrica de contatos", INDICACAO: "Indicação", FOLLOW_UP: "Follow-up",
};

export async function createZohoLead(refreshToken: string, data: {
  leadName:    string;
  leadEmail?:  string | null;
  leadPhone?:  string | null;
  origin:      string;
  revenueRange: string;
  sellerName:  string;
  notes?:      string | null;
  meetLink?:   string | null;
}) {
  try {
    const accessToken = await getAccessToken(refreshToken);

    const [firstName, ...rest] = data.leadName.trim().split(" ");
    const lastName = rest.join(" ") || "-";
    const revenue  = data.revenueRange === "ABOVE_12K" ? "Acima de R$12k" : "Abaixo de R$12k";

    const description = [
      data.notes,
      data.meetLink ? `Google Meet: ${data.meetLink}` : null,
      `Faturamento: ${revenue}`,
      `Origem: ${ORIGIN_LABEL[data.origin] ?? data.origin}`,
      `Vendedor: ${data.sellerName}`,
    ].filter(Boolean).join("\n");

    const res = await fetch(`${API_URL}/Leads`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [{
          First_Name:   firstName,
          Last_Name:    lastName,
          Email:        data.leadEmail  || undefined,
          Phone:        data.leadPhone  || undefined,
          Lead_Source:  "Cold Call",
          Description:  description,
        }],
        trigger: [],
      }),
    });

    const json = await res.json() as { data?: { details?: { id?: string } }[] };
    return json.data?.[0]?.details?.id ?? null;
  } catch {
    return null;
  }
}
