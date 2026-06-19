"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { generateImpersonateToken } from "@/app/actions/admin";
import { LogIn } from "lucide-react";

export function ImpersonateButton({ userId, userName }: { userId: string; userName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const token = await generateImpersonateToken(userId);
      if (!token) { alert("Sem permissão."); return; }
      await signIn("credentials", { impersonateToken: token, callbackUrl: "/" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={`Entrar como ${userName}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-brand hover:text-brand transition disabled:opacity-50"
    >
      <LogIn size={13} />
      {loading ? "Entrando..." : "Entrar como"}
    </button>
  );
}
