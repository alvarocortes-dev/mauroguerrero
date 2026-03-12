import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";
import TotpSetup from "@/components/auth/TotpSetup";

export default async function SetupTotpPage() {
  // Verify session exists (middleware already checked cookie presence,
  // but we do full DB validation here per defense-in-depth)
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  // If TOTP is already enabled, redirect to editor
  if ((session.user as any).twoFactorEnabled) {
    redirect("/editor");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <TotpSetup />
    </div>
  );
}
