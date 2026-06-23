"use client";

import { useState } from "react";
import { Calendar } from "./calendar";
import { LeadForm } from "./lead-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle } from "lucide-react";

type Slot = { start: string; end: string; label: string };

type Props = {
  availableDaySlots: Record<string, Slot[]>; // keyed by "yyyy-MM-dd"
  sellerId?: string;
  isRodizio?: boolean;
  sellerName?: string;
  fromToken?: string;
};

type Step = "calendar" | "slots" | "form" | "success";

export function BookingFlow({ availableDaySlots, sellerId, isRodizio, sellerName, fromToken }: Props) {
  const [step, setStep] = useState<Step>("calendar");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  const availableDays = Object.keys(availableDaySlots);
  const slotsForDay = selectedDay
    ? availableDaySlots[format(selectedDay, "yyyy-MM-dd")] ?? []
    : [];

  function handleDaySelect(day: Date) {
    setSelectedDay(day);
    setStep("slots");
  }

  function handleSlotSelect(slot: Slot) {
    const dt = new Date(slot.start);
    setSelectedDateTime(dt);
    setStep("form");
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle size={48} className="text-green-500" />
        <h2 className="text-lg font-semibold text-zinc-900">Agendamento confirmado!</h2>
        <p className="text-sm text-zinc-500">
          O lead foi agendado com sucesso
          {sellerName ? ` com ${sellerName}` : ""}.
        </p>
        <button
          onClick={() => {
            setStep("calendar");
            setSelectedDay(null);
            setSelectedDateTime(null);
          }}
          className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark transition"
        >
          Novo agendamento
        </button>
      </div>
    );
  }

  if (step === "form" && selectedDateTime) {
    return (
      <LeadForm
        selectedDateTime={selectedDateTime}
        sellerId={sellerId}
        isRodizio={isRodizio}
        fromToken={fromToken}
        onBack={() => setStep("slots")}
        onSuccess={() => setStep("success")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Calendar
        availableDays={availableDays}
        onSelectDay={handleDaySelect}
        selectedDay={selectedDay}
      />

      {step === "slots" && selectedDay && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">
            Horários disponíveis —{" "}
            <span className="capitalize">
              {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </span>
          </h3>

          {slotsForDay.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhum horário disponível neste dia.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slotsForDay.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => handleSlotSelect(slot)}
                  className="rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-700 hover:border-brand hover:bg-brand-light transition"
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
