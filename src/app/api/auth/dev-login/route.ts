import { NextRequest, NextResponse } from "next/server";
import {
  validateDevCredentials,
  ensureDevUserExists,
} from "@/lib/auth/dev-account";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Credenciales requeridas" },
        { status: 400 }
      );
    }

    const isValid = await validateDevCredentials(email, password);
    if (!isValid) {
      // Same error as regular login — don't reveal whether it's the dev account
      return NextResponse.json(
        { error: "Credenciales invalidas" },
        { status: 401 }
      );
    }

    // Ensure dev user DB record exists
    await ensureDevUserExists();

    // Get the dev user's DB id to create a session
    const [devUser] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email.toLowerCase()))
      .limit(1);

    if (!devUser) {
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    // Create a session via internal adapter (dev account bypasses normal sign-in)
    const ctx = await auth.$context;
    const session = await ctx.internalAdapter.createSession(
      devUser.id,
      false, // dontRememberMe
    );

    if (!session) {
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    // Set session cookie via better-auth cookie utilities
    const response = NextResponse.json({
      success: true,
      redirect: "/editor/setup-totp",
    });

    // Set the session token cookie
    const sessionCookie = ctx.authCookies.sessionToken;
    response.cookies.set(sessionCookie.name, session.token, {
      httpOnly: sessionCookie.attributes.httpOnly,
      secure: sessionCookie.attributes.secure,
      sameSite: sessionCookie.attributes.sameSite as "lax" | "strict" | "none",
      path: sessionCookie.attributes.path,
      maxAge: sessionCookie.attributes.maxAge,
    });

    return response;
  } catch (error) {
    console.error("Dev login error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
