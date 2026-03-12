"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

/**
 * Polls session validity every 30 seconds.
 * When session is revoked, redirects to /login with a reason parameter
 * so the login page can display "Sesion cerrada desde otro dispositivo".
 */
export default function SessionGuard() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const session = await authClient.getSession();
        if (!session.data) {
          // Session was revoked or expired
          router.replace("/login?reason=revoked");
        }
      } catch {
        // Network error — don't redirect, just skip this check
      }
    }, 30_000); // 30 second interval

    return () => clearInterval(interval);
  }, [router]);

  return null; // No UI — invisible guard
}
