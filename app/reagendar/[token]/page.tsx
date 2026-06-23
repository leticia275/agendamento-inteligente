import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function ReagendarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const appt = await prisma.appointment.findUnique({
    where: { cancelToken: token },
    select: {
      leadName: true,
      date: true,
      status: true,
      seller: { select: { name: true, slug: true } },
    },
  });

  if (!appt || !appt.seller.slug) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white px-8 py-8 shadow-sm text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="font-semibold text-zinc-900">Link inválido</p>
          <p className="text-sm text-zinc-500 mt-1">Este link não existe ou expirou.</p>
        </div>
      </div>
    );
  }

  if (appt.status === "CANCELLED") {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white px-8 py-8 shadow-sm text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="font-semibold text-zinc-900">Agendamento cancelado</p>
          <p className="text-sm text-zinc-500 mt-1">
            Este agendamento já foi cancelado. Para marcar um novo horário, entre em contato com nossa equipe.
          </p>
        </div>
      </div>
    );
  }

  if (appt.status === "COMPLETED") {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white px-8 py-8 shadow-sm text-center">
          <div className="text-4xl mb-4">✅</div>
          <p className="font-semibold text-zinc-900">Reunião já realizada</p>
          <p className="text-sm text-zinc-500 mt-1">Este agendamento já foi concluído.</p>
        </div>
      </div>
    );
  }

  // Redireciona para a página do vendedor com o token para pré-cancelar o anterior
  redirect(`/agendar/${appt.seller.slug}?from=${token}`);
}
