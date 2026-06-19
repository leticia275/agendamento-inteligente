const ORIGIN_LABEL: Record<string, string> = {
  REATIVACAO: "Reativação", RECUPERACAO: "Recuperação",
  FABRICA_CONTATOS: "Fábrica de contatos", INDICACAO: "Indicação", FOLLOW_UP: "Follow-up",
};

export async function notifySlack(webhookUrl: string, data: {
  leadName: string;
  sellerName: string;
  preSeller: string;
  date: Date;
  origin: string;
  revenueRange: string;
  meetLink?: string | null;
}) {
  const dateStr = data.date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short", day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  const revenue = data.revenueRange === "ABOVE_12K" ? "Acima de R$12k" : "Abaixo de R$12k";
  const origin  = ORIGIN_LABEL[data.origin] ?? data.origin;
  const meet    = data.meetLink ? `\n🔗 <${data.meetLink}|Abrir no Google Meet>` : "";

  const text = [
    `📅 *Novo agendamento!*`,
    `*Lead:* ${data.leadName}`,
    `*Vendedor:* ${data.sellerName}`,
    `*Pré-vendedor:* ${data.preSeller}`,
    `*Data:* ${dateStr}`,
    `*Faturamento:* ${revenue}`,
    `*Origem:* ${origin}`,
    meet,
  ].filter(Boolean).join("\n");

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).catch(() => {});
}
