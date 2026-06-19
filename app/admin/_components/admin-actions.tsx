"use client";

import { useTransition } from "react";
import { updateAppointmentStatus, markConverted, cancelAppointment } from "@/app/actions/appointments";
import { AppointmentStatus } from "@/app/generated/prisma/enums";

type Props = {
  id: string;
  currentStatus: AppointmentStatus;
  converted: boolean;
};

export function AdminActions({ id, currentStatus, converted }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {currentStatus === "SCHEDULED" && (
        <>
          <button
            disabled={pending}
            onClick={() =>
              startTransition(() => { updateAppointmentStatus(id, AppointmentStatus.COMPLETED); })
            }
            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition"
          >
            Concluído
          </button>
          <button
            disabled={pending}
            onClick={() =>
              startTransition(() => { updateAppointmentStatus(id, AppointmentStatus.NO_SHOW); })
            }
            className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
          >
            No-show
          </button>
          <button
            disabled={pending}
            onClick={() => startTransition(() => { cancelAppointment(id); })}
            className="text-xs px-2 py-1 rounded bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-50 transition"
          >
            Cancelar
          </button>
        </>
      )}

      {currentStatus === "COMPLETED" && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => { markConverted(id, !converted); })}
          className={`text-xs px-2 py-1 rounded transition disabled:opacity-50 ${
            converted
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {converted ? "Desmarcar conversão" : "Marcar convertido"}
        </button>
      )}
    </div>
  );
}
