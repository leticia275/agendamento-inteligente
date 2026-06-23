"use client";

import { useTransition, useState } from "react";
import { cancelByToken } from "@/app/actions/appointments";

export function ConfirmCancel({ token }: { token: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleCancel() {
    start(async () => {
      const res = await cancelByToken(token);
      if ("error" in res) setError(res.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-lg font-semibold text-zinc-900 mb-1">Agendamento cancelado</p>
        <p className="text-sm text-zinc-500">O evento foi removido do calendário do vendedor.</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      {error && (
        <p className="text-sm text-red-600 mb-4 bg-red-50 rounded-lg px-4 py-2">{error}</p>
      )}
      <button
        onClick={handleCancel}
        disabled={pending}
        className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-60"
      >
        {pending ? "Cancelando..." : "Confirmar cancelamento"}
      </button>
    </div>
  );
}
