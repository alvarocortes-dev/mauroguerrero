import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins/two-factor";
import { magicLink } from "better-auth/plugins";
import { multiSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    disableSignUp: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 dias
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 900, max: 5 },
      "/two-factor/*": { window: 900, max: 5 },
      "/sign-in/magic-link": { window: 60, max: 3 },
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "cf-connecting-ip"],
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const path = ctx.path;

      // Only enforce TOTP on sign-in paths
      if (path !== "/sign-in/email" && path !== "/sign-in/magic-link") {
        return;
      }

      const newSession = ctx.context.newSession;
      if (!newSession) return;

      const user = newSession.user as { twoFactorEnabled?: boolean };
      if (!user.twoFactorEnabled) {
        // Session is created but admin access is gated
        // The login page checks for this redirect
        throw ctx.redirect("/editor/setup-totp");
      }
      // If twoFactorEnabled is true, better-auth's twoFactor plugin
      // automatically handles the TOTP verification step via its built-in
      // /two-factor/verify-login endpoint — no additional redirect needed here.
    }),
  },
  plugins: [
    twoFactor({ issuer: "Mauro Guerrero" }),
    magicLink({
      expiresIn: 300,
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        await resend.emails.send({
          from:
            process.env.RESEND_FROM_EMAIL ?? "acceso@mauroguerrero.com",
          to: [email],
          subject: "Tu enlace de acceso — Mauro Guerrero",
          html: `
            <p>Haz clic en el enlace para entrar al editor:</p>
            <a href="${url}">${url}</a>
            <p>El enlace expira en 5 minutos.</p>
            <p>Si no solicitaste este enlace, ignora este correo.</p>
          `,
        });
      },
    }),
    multiSession({ maximumSessions: 2 }),
    nextCookies(), // Must be last
  ],
});
