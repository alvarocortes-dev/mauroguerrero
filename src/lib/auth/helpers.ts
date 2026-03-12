import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";

/**
 * Get authenticated session or null.
 * Use in API routes and server components for defense-in-depth
 * (middleware checks cookie presence; this validates against DB).
 */
export async function getAuthSession() {
  return auth.api.getSession({ headers: await headers() });
}
