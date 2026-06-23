"use client";

import { useTransition } from "react";
import { toggleSellerActive } from "@/app/actions/admin";

export function ToggleActive({ sellerId, active }: { sellerId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        startTransition(() => toggleSellerActive(sellerId, !active));
      }}
      disabled={pending}
      title={active ? "Remover do rodízio" : "Adicionar ao rodízio"}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        active ? "bg-brand" : "bg-zinc-300"
      } ${pending ? "opacity-60" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          active ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
