"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface Props {
  user: { name?: string | null; email?: string | null };
}

export function Header({ user }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
      <div className="max-w-2xl mx-auto w-full px-4 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-900">Pré-vendas</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">{user.name ?? user.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-900 transition"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
