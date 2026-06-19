"use client";

import { useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Wifi, WifiOff, Calendar, CalendarX, CheckCircle, XCircle, Clock } from "lucide-react";

type DiagResult = {
  sellerName: string;
  date: string;
  dayOfWeek: number;
  hasSchedule: boolean;
  schedule: { startTime: string; endTime: string } | null;
  meetingDuration: number;
  gcalConnected: boolean;
  gcalError: string | null;
  allSlots: string[];
  gcalBusy: { start: string; end: string }[];
  systemBooked: { start: string; end: string; leadName: string; status: string }[];
  availableSlots: string[];
};

const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AvailabilityDebug({ sellerId }: { sellerId: string }) {
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [result, setResult] = useState<DiagResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runDiag() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/disponibilidade-diagnostico?sellerId=${sellerId}&date=${date}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro desconhecido."); return; }
      setResult(data);
    } catch {
      setError("Falha ao buscar diagnóstico.");
    } finally {
      setLoading(false);
    }
  }

  // Quick-select buttons for next 7 days
  const quickDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(startOfDay(new Date()), i);
    return { label: DOW[d.getDay()], value: format(d, "yyyy-MM-dd"), isToday: i === 0 };
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Date selector */}
      <div className="flex flex-wrap items-center gap-2">
        {quickDays.map((d) => (
          <button
            key={d.value}
            onClick={() => setDate(d.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              date === d.value
                ? "bg-brand text-white"
                : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {d.isToday ? "Hoje" : d.label}
          </button>
        ))}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          onClick={runDiag}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition"
        >
          <Search size={13} />
          {loading ? "Verificando..." : "Verificar"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center gap-3 text-sm text-zinc-600">
            <span className="font-medium text-zinc-900">
              {DOW[result.dayOfWeek]},{" "}
              {format(new Date(result.date + "T12:00:00"), "d 'de' MMMM", { locale: ptBR })}
            </span>
            <span>·</span>
            <span>Reunião de {result.meetingDuration}min</span>
            <span>·</span>
            {result.gcalConnected ? (
              <span className="flex items-center gap-1 text-green-600"><Wifi size={13} /> Google Calendar ativo</span>
            ) : (
              <span className="flex items-center gap-1 text-zinc-400"><WifiOff size={13} /> Sem Google Calendar</span>
            )}
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Col 1: Schedule in our system */}
            <div className="rounded-xl border border-zinc-200 p-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Calendar size={12} /> Agenda configurada
              </p>
              {!result.hasSchedule ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                  <CalendarX size={13} />
                  Sem horário para este dia
                </div>
              ) : (
                <>
                  <p className="text-xs text-zinc-500 mb-2">
                    {result.schedule?.startTime} – {result.schedule?.endTime}
                  </p>
                  <div className="flex flex-col gap-1">
                    {result.allSlots.map((s) => (
                      <div
                        key={s}
                        className={`text-xs px-2 py-1 rounded font-mono ${
                          result.availableSlots.includes(s)
                            ? "bg-green-50 text-green-700"
                            : "bg-zinc-100 text-zinc-400 line-through"
                        }`}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Col 2: Google Calendar busy times */}
            <div className="rounded-xl border border-zinc-200 p-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Wifi size={12} /> Google Calendar
              </p>
              {!result.gcalConnected ? (
                <p className="text-xs text-zinc-400">Não conectado</p>
              ) : result.gcalError ? (
                <div className="text-xs text-red-600 bg-red-50 rounded p-2">
                  Erro: {result.gcalError}
                </div>
              ) : result.gcalBusy.length === 0 ? (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle size={12} /> Sem bloqueios
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {result.gcalBusy.map((b, i) => (
                    <div key={i} className="text-xs px-2 py-1.5 rounded bg-red-50 text-red-700 font-mono">
                      {b.start} – {b.end}
                      <span className="ml-1 text-red-400 font-sans">bloqueado</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Col 3: System bookings + final available */}
            <div className="rounded-xl border border-zinc-200 p-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Clock size={12} /> Agendamentos no sistema
              </p>
              {result.systemBooked.length === 0 ? (
                <p className="text-xs text-zinc-400 mb-3">Nenhum</p>
              ) : (
                <div className="flex flex-col gap-1 mb-3">
                  {result.systemBooked.map((b, i) => (
                    <div key={i} className="text-xs px-2 py-1.5 rounded bg-blue-50 text-blue-700 font-mono">
                      {b.start} – {b.end}
                      <div className="font-sans text-blue-500 truncate">{b.leadName}</div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <CheckCircle size={12} className="text-green-500" /> Slots livres
              </p>
              {result.availableSlots.length === 0 ? (
                <p className="text-xs text-zinc-400 flex items-center gap-1">
                  <XCircle size={12} /> Nenhum slot disponível
                </p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {result.availableSlots.map((s) => (
                    <span key={s} className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary alert */}
          {result.hasSchedule && result.availableSlots.length === 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              ⚠ Todos os slots estão bloqueados neste dia —{" "}
              {result.gcalBusy.length > 0 && `${result.gcalBusy.length} bloqueio(s) no Google Calendar`}
              {result.gcalBusy.length > 0 && result.systemBooked.length > 0 && " e "}
              {result.systemBooked.length > 0 && `${result.systemBooked.length} agendamento(s) no sistema`}.
            </div>
          )}

          {!result.hasSchedule && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              ⚠ Este dia não tem horário configurado na disponibilidade semanal. Configure acima em "Disponibilidade semanal".
            </div>
          )}
        </div>
      )}
    </div>
  );
}
