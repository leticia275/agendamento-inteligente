import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmCancel } from "./_confirm-cancel";

export default async function CancelarPage({
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
      duration: true,
      status: true,
      meetLink: true,
      seller: { select: { name: true } },
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://reconecta-calendar.vercel.app";

  if (!appt) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white px-8 py-8 shadow-sm text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="font-semibold text-zinc-900">Link inválido</p>
          <p className="text-sm text-zinc-500 mt-1">Este link de cancelamento não existe ou expirou.</p>
        </div>
      </div>
    );
  }

  const alreadyCancelled = appt.status === "CANCELLED";
  const alreadyCompleted = appt.status === "COMPLETED";

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-xl font-bold text-brand" style={{ fontFamily: "Georgia, serif" }}>
            Reconecta
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white px-8 py-8 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900 mb-1">Cancelar agendamento</h1>
          <p className="text-sm text-zinc-500 mb-6">Confirme os detalhes abaixo antes de cancelar.</p>

          <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-4 py-4 mb-6 space-y-1.5 text-sm">
            <p><span className="text-zinc-400">Lead:</span> <span className="font-medium text-zinc-900">{appt.leadName}</span></p>
            <p><span className="text-zinc-400">Vendedor:</span> <span className="text-zinc-700">{appt.seller.name}</span></p>
            <p>
              <span className="text-zinc-400">Data:</span>{" "}
              <span className="text-zinc-700 capitalize">
                {format(new Date(appt.date), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </span>
            </p>
            <p><span className="text-zinc-400">Duração:</span> <span className="text-zinc-700">{appt.duration} min</span></p>
          </div>

          {alreadyCancelled ? (
            <div className="text-center">
              <p className="text-sm text-zinc-500">Este agendamento já foi cancelado.</p>
            </div>
          ) : alreadyCompleted ? (
            <div className="text-center">
              <p className="text-sm text-zinc-500">Este agendamento já foi realizado e não pode ser cancelado.</p>
            </div>
          ) : (
            <>
              <ConfirmCancel token={token} />
              <div className="mt-4 text-center">
                <a
                  href={`${baseUrl}/reagendar/${token}`}
                  className="text-sm text-brand underline underline-offset-2 hover:text-brand-dark"
                >
                  Prefere reagendar?
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
