"use client";

import { useTransition } from "react";
import { disconnectGoogleCalendar } from "@/app/actions/admin";
import { Wifi, WifiOff, AlertCircle, CheckCircle } from "lucide-react";

type Props = {
  sellerId: string;
  connected: boolean;
  calendarId: string;
  gcalParam?: string;
};

export function GoogleCalendarSection({ sellerId, connected, calendarId, gcalParam }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-zinc-200 p-4 flex flex-col gap-4">
      {gcalParam === "connected" && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          <CheckCircle size={15} />
          Google Calendar conectado com sucesso!
        </div>
      )}
      {(gcalParam === "error" || gcalParam === "no_refresh_token") && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle size={15} />
          {gcalParam === "no_refresh_token"
            ? "Google não retornou refresh token. Tente revogar o acesso em myaccount.google.com/permissions e tente novamente."
            : "Erro ao conectar. Tente novamente."}
        </div>
      )}

      <div className="flex items-center gap-3">
        {connected ? (
          <Wifi size={18} className="text-green-600" />
        ) : (
          <WifiOff size={18} className="text-zinc-400" />
        )}
        <div>
          <p className="text-sm font-medium text-zinc-900">
            {connected ? "Google Calendar conectado" : "Google Calendar não conectado"}
          </p>
          {connected && (
            <p className="text-xs text-zinc-400 mt-0.5">
              Calendário: {calendarId}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={`/api/google/auth?sellerId=${sellerId}`}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark transition"
        >
          {connected ? "Reconectar" : "Conectar Google Calendar"}
        </a>

        {connected && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => { disconnectGoogleCalendar(sellerId); })}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition"
          >
            {pending ? "Desconectando..." : "Desconectar"}
          </button>
        )}
      </div>

      {!connected && (
        <p className="text-xs text-zinc-400">
          Ao conectar, a disponibilidade do vendedor será calculada em tempo real
          bloqueando horários ocupados no Google Calendar.
          Novos agendamentos criados no sistema aparecerão automaticamente no Google Calendar do vendedor.
        </p>
      )}
    </div>
  );
}
