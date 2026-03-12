import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { session as sessionTable, user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Only the dev account (identified by DEV_EMAIL) can use this endpoint
async function isDevAccount(userId: string): Promise<boolean> {
  const devEmail = process.env.DEV_EMAIL;
  if (!devEmail) return false;
  const [user] = await db
    .select({ email: userTable.email })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return user?.email === devEmail;
}

// GET: List all sessions grouped by account
export async function GET() {
  const currentSession = await getAuthSession();
  if (!currentSession) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!(await isDevAccount(currentSession.user.id))) {
    return NextResponse.json({ error: "Solo acceso dev" }, { status: 403 });
  }

  // List all active sessions from all users
  const allSessions = await db
    .select({
      id: sessionTable.id,
      token: sessionTable.token,
      userId: sessionTable.userId,
      userAgent: sessionTable.userAgent,
      ipAddress: sessionTable.ipAddress,
      createdAt: sessionTable.createdAt,
      expiresAt: sessionTable.expiresAt,
    })
    .from(sessionTable);

  // Get all users for grouping
  const allUsers = await db
    .select({ id: userTable.id, email: userTable.email, name: userTable.name })
    .from(userTable);

  // Group sessions by user
  const grouped = allUsers.map((user) => ({
    user: { id: user.id, email: user.email, name: user.name },
    sessions: allSessions.filter((s) => s.userId === user.id),
  }));

  return NextResponse.json({ accounts: grouped });
}

// DELETE: Revoke a specific session (any account) — dev only
export async function DELETE(request: NextRequest) {
  const currentSession = await getAuthSession();
  if (!currentSession) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!(await isDevAccount(currentSession.user.id))) {
    return NextResponse.json({ error: "Solo acceso dev" }, { status: 403 });
  }

  const { sessionToken } = await request.json();
  if (!sessionToken) {
    return NextResponse.json(
      { error: "sessionToken requerido" },
      { status: 400 }
    );
  }

  // Revoke the session via better-auth API (requires headers + token)
  await auth.api.revokeSession({
    headers: request.headers,
    body: { token: sessionToken },
  });

  return NextResponse.json({ success: true });
}
