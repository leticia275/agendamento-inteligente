"use client";

import { useActionState, useState } from "react";
import { addPreSeller } from "@/app/actions/admin";
import { Plus, X } from "lucide-react";

const init = { error: "" };

export function AddPreSellerForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addPreSeller, init);

  if ("success" in state && !open) setOpen(false);

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-dark transition"
        >
          <Plus size={15} />
          Novo pré-vendedor
        </button>
      ) : (
        <form
          action={async (fd) => {
            await action(fd);
            if (!("error" in state) || state.error === "") setOpen(false);
          }}
          className="rounded-xl border border-brand/20 bg-white px-5 py-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-zinc-800">Novo pré-vendedor</p>
            <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">Nome</label>
              <input
                name="name"
                required
                placeholder="João Silva"
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600">E-mail</label>
              <input
                name="email"
                type="email"
                required
                placeholder="joao@empresa.com"
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">Senha inicial</label>
            <input
              name="password"
              type="password"
              placeholder="Deixe em branco para usar senha123"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
            <p className="text-xs text-zinc-400">O usuário poderá alterar depois.</p>
          </div>

          {"error" in state && state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          {"success" in state && (
            <p className="text-sm text-green-600">Pré-vendedor criado com sucesso!</p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition"
            >
              {pending ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
