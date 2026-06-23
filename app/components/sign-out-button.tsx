"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const cls = variant === "dark"
    ? "text-white/60 hover:text-white"
    : "text-zinc-400 hover:text-zinc-700";

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      title="Sair"
      className={`inline-flex items-center gap-1.5 text-sm transition ${cls}`}
    >
      <LogOut size={15} />
      Sair
    </button>
  );
}
