"use client";

import { useActionState } from "react";
import { updateSeller } from "@/app/actions/admin";

type Props = {
  sellerId: string;
  defaultValues: {
    name: string;
    active: boolean;
    defaultMeetingDuration: number;
    conversionWeightOverride: number | null | undefined;
    autoConversionRate: number | null;
    maxMeetingsPerDay: number | null;
    bufferMinutes: number;
    bookingWindowDays: number;
    minSchedulingNoticeHours: number | null;
  };
};

type State = { error: string } | { success: true };
const init: State = { success: true };

export function SellerEditForm({ sellerId, defaultValues }: Props) {
  const boundAction = updateSeller.bind(null, sellerId);
  const [state, action, pending] = useActionState(boundAction, init);

  const weightPct =
    defaultValues.conversionWeightOverride != null
      ? (defaultValues.conversionWeightOverride * 100).toFixed(0)
      : "";

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="active" value="true" />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Nome</label>
        <input
          name="name"
          defaultValue={defaultValues.name}
          required
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="active"
          name="active"
          value="true"
          defaultChecked={defaultValues.active}
          onChange={(e) => {
            const hidden = e.currentTarget.form?.querySelector('input[name="active"][type="hidden"]') as HTMLInputElement | null;
            if (hidden) hidden.value = e.currentTarget.checked ? "true" : "false";
          }}
          className="h-4 w-4 accent-brand"
        />
        <label htmlFor="active" className="text-sm font-medium text-zinc-700">
          Vendedor ativo (aparece no rodízio)
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Duração padrão da reunião</label>
          <select
            name="defaultMeetingDuration"
            defaultValue={defaultValues.defaultMeetingDuration}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand bg-white"
          >
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Máx. reuniões por dia</label>
          <input
            name="maxMeetingsPerDay"
            type="number"
            min="1"
            max="20"
            defaultValue={defaultValues.maxMeetingsPerDay ?? ""}
            placeholder="Sem limite"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
          <p className="text-xs text-zinc-400">Deixe vazio para sem limite.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Buffer entre reuniões</label>
          <select
            name="bufferMinutes"
            defaultValue={defaultValues.bufferMinutes}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand bg-white"
          >
            <option value="0">Sem buffer</option>
            <option value="10">10 min</option>
            <option value="15">15 min</option>
            <option value="30">30 min</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Janela de agendamento</label>
          <div className="flex items-center gap-2">
            <input
              name="bookingWindowDays"
              type="number"
              min="1"
              max="365"
              defaultValue={defaultValues.bookingWindowDays}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
            <span className="text-sm text-zinc-400 whitespace-nowrap">dias</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Aviso mínimo (h)</label>
          <input
            name="minSchedulingNoticeHours"
            type="number"
            min="0"
            max="168"
            defaultValue={defaultValues.minSchedulingNoticeHours ?? ""}
            placeholder="Global"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
          <p className="text-xs text-zinc-400">Vazio = usa global</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Peso de conversão manual (%)</label>
        <input
          name="conversionWeightOverride"
          type="number"
          min="1"
          max="100"
          step="1"
          defaultValue={weightPct}
          placeholder={
            defaultValues.autoConversionRate !== null
              ? `Auto: ${(defaultValues.autoConversionRate * 100).toFixed(0)}%`
              : "Auto (sem dados ainda)"
          }
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
        <p className="text-xs text-zinc-400">
          Deixe em branco para usar a taxa calculada automaticamente (vendas ÷ reuniões).
        </p>
      </div>

      {"error" in state && <p className="text-sm text-red-600">{state.error}</p>}
      {"success" in state && !pending && <p className="text-sm text-green-600">Salvo com sucesso!</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
