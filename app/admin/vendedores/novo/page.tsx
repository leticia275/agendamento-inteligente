import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AddSellerForm } from "./_add-seller-form";

export default async function NovoVendedorPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-900">Admin</Link>
        <span className="text-zinc-300">/</span>
        <Link href="/admin/vendedores" className="text-zinc-500 hover:text-zinc-900">Vendedores</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">Novo</span>
      </div>

      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Adicionar vendedor</h1>
      <AddSellerForm />
    </div>
  );
}
