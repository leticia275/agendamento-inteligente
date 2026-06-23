"use client";

import { useTransition } from "react";
import { setSellerRodizio } from "@/app/actions/admin";

export function RodizioChips({
  sellerId,
  inRodizioPlus,
  inRodizioMinus,
}: {
  sellerId: string;
  inRodizioPlus: boolean;
  inRodizioMinus: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const toggle = (plus: boolean, minus: boolean) => {
    startTransition(() => setSellerRodizio(sellerId, plus, minus));
  };

  return (
    <div
      className={`flex items-center gap-1.5 ${pending ? "opacity-60 pointer-events-none" : ""}`}
      onClick={(e) => e.preventDefault()}
    >
      <button
        onClick={() => toggle(!inRodizioPlus, inRodizioMinus)}
        className={`text-xs px-2.5 py-1 rounded-full font-medium border transition ${
          inRodizioPlus
            ? "bg-brand text-white border-brand"
            : "bg-white text-zinc-400 border-zinc-200"
        }`}
      >
        Plus
      </button>
      <button
        onClick={() => toggle(inRodizioPlus, !inRodizioMinus)}
        className={`text-xs px-2.5 py-1 rounded-full font-medium border transition ${
          inRodizioMinus
            ? "bg-brand text-white border-brand"
            : "bg-white text-zinc-400 border-zinc-200"
        }`}
      >
        Minus
      </button>
    </div>
  );
}
