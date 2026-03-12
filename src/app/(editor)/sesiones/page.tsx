import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/helpers";
import SessionManager from "@/components/auth/SessionManager";

export default async function SessionsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  // Check if current user is the dev account
  const isDevAccount = session.user.email === process.env.DEV_EMAIL;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-6">
        Sesiones activas
      </h1>
      <SessionManager
        currentSessionId={session.session.id}
        isDevAccount={isDevAccount}
      />
    </div>
  );
}
