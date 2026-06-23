"use client";

import { useState, useTransition } from "react";
import { deleteUser, changeUserRole } from "@/app/actions/admin";
import { Trash2, ShieldCheck, UserCheck, User } from "lucide-react";

type Role = "SELLER" | "PRE_SELLER" | "ADMIN";

const ROLE_OPTIONS: { role: Role; label: string; icon: React.ReactNode }[] = [
  { role: "ADMIN",      label: "Tornar Admin",        icon: <ShieldCheck size={13} /> },
  { role: "SELLER",     label: "Tornar Vendedor",     icon: <UserCheck size={13} /> },
  { role: "PRE_SELLER", label: "Tornar Pré-vendedor", icon: <User size={13} /> },
];

export function UserActions({
  userId,
  currentRole,
  isSelf,
}: {
  userId:      string;
  currentRole: Role;
  isSelf:      boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    startTransition(async () => {
      await deleteUser(userId);
    });
  }

  function handleRoleChange(role: Role) {
    startTransition(async () => {
      await changeUserRole(userId, role);
    });
  }

  if (isSelf) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Opções de função */}
      <div className="relative group">
        <button
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-500 hover:border-zinc-400 transition disabled:opacity-50"
        >
          Função ▾
        </button>
        <div className="absolute right-0 top-full mt-1 z-10 hidden group-hover:flex flex-col bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden min-w-[170px]">
          {ROLE_OPTIONS.filter((o) => o.role !== currentRole).map((o) => (
            <button
              key={o.role}
              onClick={() => handleRoleChange(o.role)}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-700 hover:bg-zinc-50 transition text-left disabled:opacity-50"
            >
              {o.icon}
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Excluir */}
      {!confirmDelete ? (
        <button
          onClick={handleDelete}
          disabled={isPending}
          title="Excluir usuário"
          className="inline-flex items-center rounded-lg border border-zinc-200 p-1.5 text-zinc-400 hover:border-red-300 hover:text-red-500 transition disabled:opacity-50"
        >
          <Trash2 size={13} />
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-xs text-red-600">Confirmar?</span>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs font-semibold text-red-600 hover:text-red-800 transition disabled:opacity-50"
          >
            Sim
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition"
          >
            Não
          </button>
        </div>
      )}
    </div>
  );
}
