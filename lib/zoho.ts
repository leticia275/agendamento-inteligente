const ZOHO_REGION   = process.env.ZOHO_REGION ?? "com";
const CLIENT_ID     = process.env.ZOHO_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET ?? "";

const ACCOUNTS_URL = `https://accounts.zoho.${ZOHO_REGION}`;
const API_URL      = `https://www.zohoapis.${ZOHO_REGION}/crm/v2`;

export function getZohoAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    scope: [
      "ZohoCRM.modules.leads.CREATE",
      "ZohoCRM.modules.leads.UPDATE",
      "ZohoCRM.modules.contacts.READ",
      "ZohoCRM.modules.Deals.READ",
      "ZohoCRM.modules.Deals.UPDATE",
      "ZohoCRM.modules.Events.CREATE",
    ].join(","),
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

// ---------- helpers de busca ----------

async function searchRecord(
  token: string,
  module: string,
  field: string,
  value: string,
): Promise<string | null> {
  const criteria = encodeURIComponent(`(${field}:equals:${value})`);
  const res = await fetch(`${API_URL}/${module}/search?criteria=${criteria}&per_page=1`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  if (!res.ok) return null;
  const json = await res.json() as { data?: { id: string }[] };
  return json.data?.[0]?.id ?? null;
}

async function findContact(
  token: string,
  email?: string | null,
  phone?: string | null,
): Promise<string | null> {
  if (email) {
    const id = await searchRecord(token, "Contacts", "Email", email);
    if (id) return id;
  }
  if (phone) {
    const id = await searchRecord(token, "Contacts", "Phone", phone);
    if (id) return id;
  }
  return null;
}

async function findLead(
  token: string,
  email?: string | null,
  phone?: string | null,
): Promise<string | null> {
  if (email) {
    const id = await searchRecord(token, "Leads", "Email", email);
    if (id) return id;
  }
  if (phone) {
    const id = await searchRecord(token, "Leads", "Phone", phone);
    if (id) return id;
  }
  return null;
}

// Busca o primeiro Negócio (Deal) vinculado ao Contato
async function findDealByContact(token: string, contactId: string): Promise<string | null> {
  const res = await fetch(`${API_URL}/Contacts/${contactId}/Deals?per_page=1`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  if (!res.ok) return null;
  const json = await res.json() as { data?: { id: string }[] };
  return json.data?.[0]?.id ?? null;
}

// ---------- ações ----------

async function updateDealStage(token: string, dealId: string): Promise<void> {
  await fetch(`${API_URL}/Deals/${dealId}`, {
    method: "PUT",
    headers: {
      Authorization:  `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{ Stage: "Reunião Agendada" }],
      trigger: [],
    }),
  });
}

async function updateLeadStatus(token: string, leadId: string): Promise<void> {
  await fetch(`${API_URL}/Leads/${leadId}`, {
    method: "PUT",
    headers: {
      Authorization:  `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{ Lead_Status: "Appointment Scheduled" }],
      trigger: [],
    }),
  });
}

async function createLead(
  token: string,
  data: {
    leadName:    string;
    leadEmail?:  string | null;
    leadPhone?:  string | null;
    origin:      string;
    revenueRange: string;
    sellerName:  string;
    notes?:      string | null;
    meetLink?:   string | null;
  },
): Promise<string | null> {
  const ORIGIN_LABEL: Record<string, string> = {
    REATIVACAO: "Reativação", RECUPERACAO: "Recuperação",
    FABRICA_CONTATOS: "Fábrica de contatos", INDICACAO: "Indicação", FOLLOW_UP: "Follow-up",
  };

  const [firstName, ...rest] = data.leadName.trim().split(" ");
  const lastName    = rest.join(" ") || "-";
  const revenue     = data.revenueRange === "ABOVE_12K" ? "Acima de R$12k" : "Abaixo de R$12k";
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
      Authorization:  `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{
        First_Name:  firstName,
        Last_Name:   lastName,
        Email:       data.leadEmail || undefined,
        Phone:       data.leadPhone || undefined,
        Lead_Source: "Cold Call",
        Lead_Status: "Appointment Scheduled",
        Description: description,
      }],
      trigger: [],
    }),
  });

  const json = await res.json() as { data?: { details?: { id?: string } }[] };
  return json.data?.[0]?.details?.id ?? null;
}

async function createEvent(
  token: string,
  data: {
    leadName:    string;
    sellerName:  string;
    sellerEmail?: string | null;
    leadEmail?:  string | null;
    date:        Date;
    duration:    number;
    meetLink?:   string | null;
    // Negócio (Deal) como registro principal
    seModule:    "Potentials" | "Leads" | "Contacts";
    whatId:      string;
    // Contato vinculado (Who), opcional
    whoId?:      string | null;
  },
): Promise<void> {
  const fmt = (d: Date) => d.toISOString().replace(".000Z", "+00:00");
  const start = fmt(data.date);
  const end   = fmt(new Date(data.date.getTime() + data.duration * 60_000));

  const participants: { participant: string; type: string }[] = [];
  if (data.leadEmail)   participants.push({ participant: data.leadEmail,   type: "email" });
  if (data.sellerEmail) participants.push({ participant: data.sellerEmail, type: "email" });

  await fetch(`${API_URL}/Events`, {
    method: "POST",
    headers: {
      Authorization:  `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{
        Subject:        `${data.leadName} e ${data.sellerName}`,
        Start_DateTime: start,
        End_DateTime:   end,
        Location:       data.meetLink ?? "",
        $se_module:     data.seModule,
        What_Id:        data.whatId,
        ...(data.whoId ? { Who_Id: data.whoId } : {}),
        ...(participants.length > 0 ? { Participants: participants } : {}),
      }],
      trigger: [],
    }),
  });
}

// ---------- exportação principal ----------

export async function syncZohoAppointment(
  refreshToken: string,
  data: {
    leadName:     string;
    leadEmail?:   string | null;
    leadPhone?:   string | null;
    origin:       string;
    revenueRange: string;
    sellerName:   string;
    sellerEmail?: string | null;
    notes?:       string | null;
    meetLink?:    string | null;
    date:         Date;
    duration:     number;
  },
): Promise<void> {
  try {
    const token = await getAccessToken(refreshToken);

    // 1. Verificar se existe Contato
    const contactId = await findContact(token, data.leadEmail, data.leadPhone);

    if (contactId) {
      // 2. Contato encontrado — buscar Negócio vinculado
      const dealId = await findDealByContact(token, contactId);

      if (dealId) {
        // 3a. Negócio encontrado → mover para "Reunião Agendada"
        await updateDealStage(token, dealId);

        // Criar Reunião vinculada ao Negócio + Contato
        await createEvent(token, {
          ...data,
          seModule: "Potentials",
          whatId:   dealId,
          whoId:    contactId,
        });
      } else {
        // 3b. Contato sem Negócio → criar Reunião vinculada ao Contato
        await createEvent(token, {
          ...data,
          seModule: "Contacts",
          whatId:   contactId,
          whoId:    null,
        });
      }
      return;
    }

    // 4. Nenhum Contato — verificar Lead
    const leadId = await findLead(token, data.leadEmail, data.leadPhone);

    if (leadId) {
      // Lead existente → atualizar status
      await updateLeadStatus(token, leadId);
      await createEvent(token, {
        ...data,
        seModule: "Leads",
        whatId:   leadId,
        whoId:    null,
      });
      return;
    }

    // 5. Nenhum registro encontrado → criar Lead novo
    const newLeadId = await createLead(token, data);
    if (!newLeadId) return;

    await createEvent(token, {
      ...data,
      seModule: "Leads",
      whatId:   newLeadId,
      whoId:    null,
    });
  } catch {
    // best-effort — nunca bloqueia o agendamento
  }
}
