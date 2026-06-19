"use client";

import { useActionState } from "react";
import { updateSystemConfig } from "@/app/actions/admin";

type State = { error: string } | { success: true };
const init: State = { success: true };

const PLACEHOLDERS = [
  { key: "{seller}",       desc: "Nome do vendedor" },
  { key: "{leadName}",     desc: "Nome do lead" },
  { key: "{revenueRange}", desc: "Faturamento (ex: Acima de R$12k)" },
  { key: "{origin}",       desc: "Origem do lead" },
  { key: "{notes}",        desc: "Observações preenchidas na hora do agendamento" },
];

type Props = {
  defaultTemplate:          string;
  minSchedulingNoticeHours: number;
  slackWebhookUrl:          string;
};

export function SystemConfigForm({ defaultTemplate, minSchedulingNoticeHours, slackWebhookUrl }: Props) {
  const [state, action, pending] = useActionState(updateSystemConfig, init);

  return (
    <form action={action} className="flex flex-col gap-6">

      {/* Slack */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-700 mb-1 flex items-center gap-2">
          <span className="text-base">💬</span> Slack
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          Receba uma mensagem no Slack a cada novo agendamento. Cole a URL do Incoming Webhook do seu workspace.
        </p>
        <input
          type="url"
          name="slackWebhookUrl"
          defaultValue={slackWebhookUrl}
          placeholder="https://hooks.slack.com/services/..."
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand font-mono"
        />
        <p className="text-xs text-zinc-400 mt-2">
          Deixe em branco para desativar. Crie um webhook em <strong>api.slack.com/apps</strong>.
        </p>
      </section>

      {/* Aviso mínimo */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-700">
          Antecedência mínima para agendamento
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            name="minSchedulingNoticeHours"
            min="0"
            max="168"
            defaultValue={minSchedulingNoticeHours}
            className="w-24 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
          <span className="text-sm text-zinc-500">horas antes do horário</span>
        </div>
        <p className="text-xs text-zinc-400">
          Ex: 2 = não permite agendar para menos de 2 horas a partir de agora. Use 0 para sem restrição.
        </p>
      </div>

      {/* Descrição GCal */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-zinc-700">
          Descrição padrão dos eventos no Google Calendar
        </label>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
          <p className="text-xs font-medium text-zinc-500 mb-2">Variáveis disponíveis:</p>
          <div className="flex flex-col gap-1">
            {PLACEHOLDERS.map(({ key, desc }) => (
              <div key={key} className="flex items-baseline gap-2">
                <code className="text-xs font-mono text-zinc-900 bg-white border border-zinc-200 rounded px-1">
                  {key}
                </code>
                <span className="text-xs text-zinc-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>
        <textarea
          name="eventDescriptionTemplate"
          rows={10}
          defaultValue={defaultTemplate}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand font-mono resize-y"
        />
      </div>

      {"error" in state && <p className="text-sm text-red-600">{state.error}</p>}
      {"success" in state && pending === false && <p className="text-sm text-green-600">Configuração salva!</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition"
      >
        {pending ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}
