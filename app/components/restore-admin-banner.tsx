"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { generateRestoreToken } from "@/app/actions/admin";
import { ShieldAlert } from "lucide-react";

export function RestoreAdminBanner({ impersonatedName }: { impersonatedName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleRestore() {
    setLoading(true);
    try {
      const token = await generateRestoreToken();
      if (!token) { alert("Não foi possível restaurar sessão."); return; }
      await signIn("credentials", { impersonateToken: token, callbackUrl: "/admin" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full bg-amber-500 px-4 py-2 flex items-center justify-between text-sm text-white">
      <div className="flex items-center gap-2">
        <ShieldAlert size={15} />
        <span>Você está navegando como <strong>{impersonatedName}</strong></span>
      </div>
      <button
        onClick={handleRestore}
        disabled={loading}
        className="rounded-md bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-semibold transition disabled:opacity-50"
      >
        {loading ? "Voltando..." : "Voltar como Admin"}
      </button>
    </div>
  );
}
