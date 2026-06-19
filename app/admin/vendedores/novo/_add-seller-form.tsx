"use client";

import { useActionState } from "react";
import { addSeller } from "@/app/actions/admin";

type State = { error: string } | { success: true };
const init: State = { success: true };

export function AddSellerForm() {
  const [state, action, pending] = useActionState(addSeller, init);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Nome *</label>
        <input
          name="name"
          required
          placeholder="Ex: Andrezza"
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">E-mail *</label>
        <input
          name="email"
          type="email"
          required
          placeholder="vendedor@empresa.com"
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Slug *</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">/agendar/</span>
          <input
            name="slug"
            required
            placeholder="andrezza"
            pattern="[a-z0-9-]+"
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <p className="text-xs text-zinc-400">Apenas letras minúsculas, números e hífens.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Senha inicial</label>
        <input
          name="password"
          type="password"
          placeholder="senha123 (padrão)"
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Duração padrão da reunião (min)</label>
        <select
          name="defaultMeetingDuration"
          defaultValue="60"
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand bg-white"
        >
          <option value="30">30 min</option>
          <option value="45">45 min</option>
          <option value="60">60 min</option>
          <option value="90">90 min</option>
        </select>
      </div>

      {"error" in state && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition"
      >
        {pending ? "Criando..." : "Criar vendedor"}
      </button>
    </form>
  );
}
