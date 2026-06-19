"use client";

import { BrandHeader } from "@/app/components/brand-header";
import { useRouter } from "next/navigation";
import { DollarSign } from "lucide-react";

export default function AgendarPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader />
      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900" style={{ fontFamily: "Georgia, serif" }}>
            Agendar via Rodízio
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Qual o faturamento mensal da empresa do lead?
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/agendar/rodizio-plus")}
            className="group w-full rounded-xl border-2 border-zinc-200 bg-white px-6 py-6 text-left hover:border-brand hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-green-100 p-3 text-green-700 group-hover:bg-green-200 transition">
                <DollarSign size={22} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 text-base group-hover:text-brand transition">
                  Acima de R$12k / mês
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  Rodízio Plus — vendedor selecionado automaticamente pelo sistema
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/agendar/rodizio-minus")}
            className="group w-full rounded-xl border-2 border-zinc-200 bg-white px-6 py-6 text-left hover:border-brand hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-100 p-3 text-blue-700 group-hover:bg-blue-200 transition">
                <DollarSign size={22} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 text-base group-hover:text-brand transition">
                  Abaixo de R$12k / mês
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  Rodízio Minus — vendedor selecionado automaticamente pelo sistema
                </p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-xs text-zinc-400 text-center mt-8">
          O sistema escolhe o vendedor com menor crédito de leads recebidos, priorizando conversão.
        </p>
      </main>
    </div>
  );
}
