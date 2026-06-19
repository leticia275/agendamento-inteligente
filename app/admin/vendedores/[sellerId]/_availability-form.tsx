"use client";

import { useState, useTransition } from "react";
import { saveAvailability } from "@/app/actions/availability";
import { useRouter } from "next/navigation";

type AvailabilityRow = {
  id: string;
  sellerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type Props = {
  sellerId: string;
  availability: AvailabilityRow[];
};

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

type DayState = { enabled: boolean; startTime: string; endTime: string };

function buildInitialState(availability: AvailabilityRow[]): Record<number, DayState> {
  const byDay: Record<number, DayState> = {};
  for (const day of DAYS) {
    const existing = availability.find((a) => a.dayOfWeek === day.value);
    byDay[day.value] = existing
      ? { enabled: true, startTime: existing.startTime, endTime: existing.endTime }
      : { enabled: false, startTime: "09:00", endTime: "18:00" };
  }
  return byDay;
}

export function AvailabilityForm({ sellerId, availability }: Props) {
  const [days, setDays] = useState(() => buildInitialState(availability));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function update(dayOfWeek: number, patch: Partial<DayState>) {
    setDays((prev) => ({ ...prev, [dayOfWeek]: { ...prev[dayOfWeek], ...patch } }));
  }

  function handleSave() {
    startTransition(async () => {
      const schedule = DAYS.map(({ value }) => ({
        dayOfWeek: value,
        ...days[value],
      }));
      const result = await saveAvailability(sellerId, schedule);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {DAYS.map(({ value, label }) => {
        const d = days[value];
        return (
          <div
            key={value}
            className={`rounded-xl border px-4 py-4 transition ${
              d.enabled ? "border-zinc-300 bg-white" : "border-zinc-100 bg-zinc-50"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id={`day-${value}`}
                checked={d.enabled}
                onChange={(e) => update(value, { enabled: e.target.checked })}
                className="h-4 w-4 accent-brand"
              />
              <label
                htmlFor={`day-${value}`}
                className={`text-sm font-medium ${d.enabled ? "text-zinc-900" : "text-zinc-400"}`}
              >
                {label}
              </label>
            </div>

            {d.enabled && (
              <div className="flex items-center gap-3 pl-7">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Início</label>
                  <input
                    type="time"
                    value={d.startTime}
                    onChange={(e) => update(value, { startTime: e.target.value })}
                    className="rounded border border-zinc-200 px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Fim</label>
                  <input
                    type="time"
                    value={d.endTime}
                    onChange={(e) => update(value, { endTime: e.target.value })}
                    className="rounded border border-zinc-200 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={handleSave}
        disabled={pending}
        className="mt-2 rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition"
      >
        {saved ? "Salvo!" : pending ? "Salvando..." : "Salvar disponibilidade"}
      </button>
    </div>
  );
}
