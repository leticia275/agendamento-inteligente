"use client";

import { useActionState, startTransition } from "react";
import { addAvailabilityOverride, removeAvailabilityOverride } from "@/app/actions/admin";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X } from "lucide-react";

type Override = { id: string; date: Date };

type Props = {
  sellerId: string;
  overrides: Override[];
};

type State = { error: string } | { success: true };
const init: State = { success: true };

export function OverrideForm({ sellerId, overrides }: Props) {
  const boundAction = addAvailabilityOverride.bind(null, sellerId);
  const [state, action, pending] = useActionState(boundAction, init);

  return (
    <div className="flex flex-col gap-4">
      {/* Existing overrides */}
      {overrides.length > 0 && (
        <div className="flex flex-col gap-2">
          {overrides.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2">
              <span className="text-sm text-red-800 font-medium">
                {format(new Date(o.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <button
                onClick={() => startTransition(() => { removeAvailabilityOverride(sellerId, o.id); })}
                className="text-red-400 hover:text-red-700 transition"
                title="Remover bloqueio"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new override */}
      <form action={action} className="flex items-end gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-sm font-medium text-zinc-700">Bloquear data</label>
          <input
            type="date"
            name="date"
            required
            min={format(new Date(), "yyyy-MM-dd")}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition"
        >
          {pending ? "..." : "Bloquear"}
        </button>
      </form>

      {"error" in state && <p className="text-xs text-red-600">{state.error}</p>}

      <p className="text-xs text-zinc-400">
        Datas bloqueadas não aparecem para agendamento, independente da disponibilidade semanal.
        Útil para férias, feriados ou ausências pontuais.
      </p>
    </div>
  );
}
