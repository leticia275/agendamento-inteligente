import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RestoreAdminBanner } from "./restore-admin-banner";

export async function ImpersonationBanner() {
  const session = await getServerSession(authOptions);
  if (!session?.user.originalAdminId) return null;

  return <RestoreAdminBanner impersonatedName={session.user.name ?? session.user.email ?? "usuário"} />;
}
