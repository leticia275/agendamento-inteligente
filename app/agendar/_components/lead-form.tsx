"use client";

import { useActionState, useEffect, useState } from "react";
import { bookAppointment } from "@/app/actions/appointments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Props = {
  selectedDateTime: Date;
  sellerId?: string;
  isRodizio?: boolean;
  onBack: () => void;
  onSuccess: () => void;
};

type Tracking = {
  utmSource: string; utmMedium: string; utmCampaign: string;
  utmContent: string; utmTerm: string;
  fbClickId: string; fbBrowserId: string;
};

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}

const initialState = { error: undefined as string | undefined, success: false };

export function LeadForm({ selectedDateTime, sellerId, isRodizio, onBack, onSuccess }: Props) {
  const [tracking, setTracking] = useState<Tracking>({
    utmSource: "", utmMedium: "", utmCampaign: "",
    utmContent: "", utmTerm: "", fbClickId: "", fbBrowserId: "",
  });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    // Also check sessionStorage for UTMs captured on entry page
    const stored = sessionStorage.getItem("__utms");
    const saved = stored ? JSON.parse(stored) : {};

    const utm = {
      utmSource:   p.get("utm_source")   || saved.utm_source   || "",
      utmMedium:   p.get("utm_medium")   || saved.utm_medium   || "",
      utmCampaign: p.get("utm_campaign") || saved.utm_campaign || "",
      utmContent:  p.get("utm_content")  || saved.utm_content  || "",
      utmTerm:     p.get("utm_term")     || saved.utm_term     || "",
      fbClickId:   p.get("_fbc") || getCookie("_fbc") || "",
      fbBrowserId: getCookie("_fbp") || "",
    };

    // Persist UTMs in sessionStorage so they survive navigation
    if (utm.utmSource || utm.utmMedium || utm.utmCampaign) {
      sessionStorage.setItem("__utms", JSON.stringify({
        utm_source: utm.utmSource, utm_medium: utm.utmMedium,
        utm_campaign: utm.utmCampaign, utm_content: utm.utmContent,
        utm_term: utm.utmTerm,
      }));
    }

    setTracking(utm);
  }, []);

  const [state, action, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await bookAppointment(_prev, formData);
      if (result.success) onSuccess();
      return result as typeof initialState;
    },
    initialState
  );

  const dateLabel = format(selectedDateTime, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR });

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Hidden: scheduling */}
      <input type="hidden" name="selectedDateTime" value={selectedDateTime.toISOString()} />
      {sellerId && <input type="hidden" name="sellerId" value={sellerId} />}
      <input type="hidden" name="isRodizio" value={isRodizio ? "true" : "false"} />

      {/* Hidden: tracking */}
      <input type="hidden" name="utmSource"   value={tracking.utmSource} />
      <input type="hidden" name="utmMedium"   value={tracking.utmMedium} />
      <input type="hidden" name="utmCampaign" value={tracking.utmCampaign} />
      <input type="hidden" name="utmContent"  value={tracking.utmContent} />
      <input type="hidden" name="utmTerm"     value={tracking.utmTerm} />
      <input type="hidden" name="fbClickId"   value={tracking.fbClickId} />
      <input type="hidden" name="fbBrowserId" value={tracking.fbBrowserId} />

      <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-sm text-zinc-700 capitalize">
        {dateLabel}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Nome do lead *</label>
        <input name="leadName" required placeholder="Nome completo"
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">E-mail</label>
        <input name="leadEmail" type="email" placeholder="email@empresa.com"
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Telefone</label>
        <input name="leadPhone" placeholder="(11) 9 0000-0000"
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Faturamento *</label>
        <select name="revenueRange" required defaultValue=""
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand bg-white">
          <option value="">Selecione...</option>
          <option value="BELOW_12K">Abaixo de R$12k</option>
          <option value="ABOVE_12K">Acima de R$12k</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Origem *</label>
        <select name="origin" required defaultValue=""
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand bg-white">
          <option value="">Selecione...</option>
          <option value="REATIVACAO">Reativação</option>
          <option value="RECUPERACAO">Recuperação</option>
          <option value="FABRICA_CONTATOS">Fábrica de contatos</option>
          <option value="INDICACAO">Indicação</option>
          <option value="FOLLOW_UP">Follow-up</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Observações</label>
        <textarea name="notes" rows={3} placeholder="Contexto, objeções, informações relevantes..."
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand resize-none" />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onBack}
          className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">
          Voltar
        </button>
        <button type="submit" disabled={pending}
          className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition">
          {pending ? "Agendando..." : "Confirmar agendamento"}
        </button>
      </div>
    </form>
  );
}
