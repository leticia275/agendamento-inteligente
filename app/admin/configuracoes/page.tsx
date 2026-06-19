import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SystemConfigForm } from "./_system-config-form";

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ zoho?: string; msg?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const [config, params] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { id: "global" } }),
    searchParams,
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-900">Admin</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">Configurações</span>
      </div>

      <h1 className="text-xl font-semibold text-zinc-900 mb-8">Configurações do sistema</h1>

      {/* Zoho CRM */}
      <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-700 mb-1 flex items-center gap-2">
          <span className="text-base">🗂</span> Zoho CRM
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          Cria um Lead no Zoho automaticamente a cada novo agendamento.
        </p>

        {params?.zoho === "ok" && (
          <p className="text-sm text-green-600 mb-3">Zoho CRM conectado com sucesso!</p>
        )}
        {params?.zoho === "error" && (
          <p className="text-sm text-red-600 mb-3">Erro ao conectar: {params.msg}</p>
        )}
        {params?.zoho === "disconnected" && (
          <p className="text-sm text-zinc-500 mb-3">Zoho CRM desconectado.</p>
        )}

        {config?.zohoRefreshToken ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-green-700 font-medium">✓ Conectado</span>
            <form action="/api/zoho/disconnect" method="POST">
              <button
                type="submit"
                className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2"
              >
                Desconectar
              </button>
            </form>
          </div>
        ) : (
          <div>
            {(!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET) ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
                <p className="font-medium mb-1">Configure as variáveis de ambiente:</p>
                <code className="block">ZOHO_CLIENT_ID=seu_client_id</code>
                <code className="block">ZOHO_CLIENT_SECRET=seu_client_secret</code>
                <code className="block">ZOHO_REGION=com  <span className="text-amber-500"># ou eu, in, com.au</span></code>
                <p className="mt-2">Crie o app em <strong>api-console.zoho.com</strong> com redirect URI: <strong>{process.env.NEXTAUTH_URL}/api/zoho/callback</strong></p>
              </div>
            ) : (
              <Link
                href="/api/zoho/auth"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark transition"
              >
                Conectar Zoho CRM
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Formulário principal (Slack + template + aviso mínimo) */}
      <SystemConfigForm
        defaultTemplate={config?.eventDescriptionTemplate ?? ""}
        minSchedulingNoticeHours={config?.minSchedulingNoticeHours ?? 2}
        slackWebhookUrl={config?.slackWebhookUrl ?? ""}
      />
    </div>
  );
}
