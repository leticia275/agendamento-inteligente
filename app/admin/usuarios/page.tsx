import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ImpersonateButton } from "@/app/components/impersonate-button";
import { AddPreSellerForm } from "./_add-pre-seller-form";

const ROLE_LABEL: Record<string, string> = {
  ADMIN:      "Admin",
  SELLER:     "Vendedor",
  PRE_SELLER: "Pré-vendedor",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN:      "bg-brand/10 text-brand",
  SELLER:     "bg-blue-50 text-blue-700",
  PRE_SELLER: "bg-zinc-100 text-zinc-600",
};

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  const grouped = {
    SELLER:     users.filter((u) => u.role === "SELLER"),
    PRE_SELLER: users.filter((u) => u.role === "PRE_SELLER"),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-900">Admin</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">Usuários</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-zinc-900">Usuários</h1>
        <AddPreSellerForm />
      </div>

      {(["SELLER", "PRE_SELLER"] as const).map((role) => (
        <section key={role} className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            {ROLE_LABEL[role]}s
          </h2>
          <div className="flex flex-col gap-2">
            {grouped[role].length === 0 && (
              <p className="text-sm text-zinc-400 py-4">Nenhum {ROLE_LABEL[role].toLowerCase()} cadastrado.</p>
            )}
            {grouped[role].map((u) => (
              <div
                key={u.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  u.active ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50"
                }`}
              >
                <div>
                  <p className={`font-medium text-sm ${u.active ? "text-zinc-900" : "text-zinc-400"}`}>
                    {u.name}
                    {!u.active && <span className="ml-2 text-xs text-zinc-400">(inativo)</span>}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                  <ImpersonateButton userId={u.id} userName={u.name ?? u.email} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
