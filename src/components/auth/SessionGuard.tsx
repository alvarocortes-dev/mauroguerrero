"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { useRouter, usePathname } from "next/navigation";

/**
 * Polls session validity every 30 seconds.
 * When session is revoked, redirects to /login with a reason parameter
 * so the login page can display "Sesion cerrada desde otro dispositivo".
 * Skips polling on public pages (login, setup-totp) where no session is expected.
 */
export default function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't poll on pages where no session is expected
    if (pathname === "/login" || pathname === "/editor/setup-totp") return;

    const interval = setInterval(async () => {
      try {
        const session = await authClient.getSession();
        if (!session.data) {
          router.replace("/login?reason=revoked");
        }
      } catch {
        // Network error — don't redirect, just skip this check
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [router, pathname]);

  return null;
}
