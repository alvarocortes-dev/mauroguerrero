"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Script from "next/script";
import { authClient } from "@/lib/auth/client";

type LoginState =
  | "idle"
  | "loading"
  | "totp_required"
  | "magic_link_sent"
  | "error";

type TabType = "password" | "magic-link";

export default function LoginForm() {
  const [state, setState] = useState<LoginState>("idle");
  const [activeTab, setActiveTab] = useState<TabType>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  const turnstileEnabled = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const showTurnstile = failedAttempts >= 3 && turnstileEnabled;

  // Render Turnstile widget when needed and script is loaded
  useEffect(() => {
    if (
      showTurnstile &&
      turnstileLoaded &&
      turnstileContainerRef.current &&
      !turnstileWidgetId.current
    ) {
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      if (!siteKey) return;

      turnstileWidgetId.current = (window as any).turnstile.render(
        turnstileContainerRef.current,
        {
          sitekey: siteKey,
          callback: (token: string) => setTurnstileToken(token),
          "error-callback": () => setTurnstileToken(null),
        }
      );
    }
  }, [showTurnstile, turnstileLoaded]);

  const resetTurnstile = useCallback(() => {
    if (turnstileWidgetId.current && (window as any).turnstile) {
      (window as any).turnstile.reset(turnstileWidgetId.current);
      setTurnstileToken(null);
    }
  }, []);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;

    if (showTurnstile && !turnstileToken) {
      setErrorMessage("Verifica que no eres un robot.");
      setState("error");
      return;
    }

    setState("loading");
    setErrorMessage("");

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/editor",
        fetchOptions: showTurnstile
          ? {
              body: {
                "cf-turnstile-response": turnstileToken,
              } as any,
            }
          : undefined,
      });

      if (result.error) {
        const code = result.error.code ?? result.error.message ?? "";

        if (
          code === "TOO_MANY_REQUESTS" ||
          code.includes("rate") ||
          code.includes("Too many")
        ) {
          setErrorMessage(
            "Demasiados intentos. Intenta de nuevo en 15 minutos."
          );
          setState("error");
          return;
        }

        // Check if TOTP is required
        if (
          code === "TWO_FACTOR_REQUIRED" ||
          code.includes("two-factor") ||
          code.includes("totp")
        ) {
          setState("totp_required");
          return;
        }

        setFailedAttempts((prev) => prev + 1);
        resetTurnstile();
        setErrorMessage("Credenciales incorrectas");
        setState("error");
        return;
      }

      // If the response indicates TOTP is needed
      if (result.data && (result.data as any).twoFactorRedirect) {
        setState("totp_required");
        return;
      }

      // Success - redirect handled by callbackURL
      window.location.href = "/editor";
    } catch {
      setFailedAttempts((prev) => prev + 1);
      resetTurnstile();
      setErrorMessage("Credenciales incorrectas");
      setState("error");
    }
  };

  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;

    setState("loading");
    setErrorMessage("");

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: totpCode,
      });

      if (result.error) {
        setErrorMessage(
          "Codigo incorrecto. Revisa tu app de autenticacion."
        );
        setTotpCode("");
        setState("totp_required");
        return;
      }

      window.location.href = "/editor";
    } catch {
      setErrorMessage(
        "Codigo incorrecto. Revisa tu app de autenticacion."
      );
      setTotpCode("");
      setState("totp_required");
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;

    setState("loading");
    setErrorMessage("");

    try {
      const result = await authClient.signIn.magicLink({
        email,
        callbackURL: "/editor",
      });

      if (result.error) {
        setErrorMessage("Error al enviar el enlace. Intenta de nuevo.");
        setState("error");
        return;
      }

      setState("magic_link_sent");
    } catch {
      setErrorMessage("Error al enviar el enlace. Intenta de nuevo.");
      setState("error");
    }
  };

  const isLoading = state === "loading";

  // TOTP verification step
  if (state === "totp_required" || (state === "loading" && totpCode)) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <img
            src="/avatar.jpg"
            alt="Mauro Guerrero"
            className="h-20 w-20 rounded-full object-cover"
          />
        </div>

        <div className="backdrop-blur-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-8">
          <h1 className="mb-2 text-center text-xl font-semibold text-[var(--foreground)]">
            Verificacion en dos pasos
          </h1>
          <p className="mb-6 text-center text-sm text-[var(--muted-foreground)]">
            Ingresa el codigo de tu app de autenticacion
          </p>

          {errorMessage && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleTotpVerify} className="flex flex-col gap-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={totpCode}
              onChange={(e) =>
                setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              autoFocus
              className="bg-transparent border border-[var(--foreground)]/20 rounded-lg px-4 py-3 text-[var(--foreground)] text-center text-2xl tracking-[0.5em] font-mono placeholder:text-[var(--foreground)]/20 focus:outline-none focus:border-[var(--foreground)]/40"
            />
            <button
              type="submit"
              disabled={isLoading || totpCode.length !== 6}
              className="bg-[var(--foreground)] text-[var(--background)] rounded-lg py-2.5 font-medium disabled:opacity-50 transition-opacity"
            >
              {isLoading ? "Verificando..." : "Verificar"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setState("idle");
              setTotpCode("");
              setErrorMessage("");
            }}
            className="mt-4 w-full text-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Volver al inicio de sesion
          </button>
        </div>
      </div>
    );
  }

  // Magic link sent confirmation
  if (state === "magic_link_sent") {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <img
            src="/avatar.jpg"
            alt="Mauro Guerrero"
            className="h-20 w-20 rounded-full object-cover"
          />
        </div>

        <div className="backdrop-blur-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Enlace enviado
          </h1>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Revisa tu correo. El enlace expira en 5 minutos.
          </p>
          <button
            type="button"
            onClick={() => {
              setState("idle");
              setErrorMessage("");
            }}
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Volver al inicio de sesion
          </button>
        </div>
      </div>
    );
  }

  // Main login form
  return (
    <div className="w-full max-w-sm">
      {showTurnstile && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
          onLoad={() => setTurnstileLoaded(true)}
        />
      )}

      <div className="mb-8 flex justify-center">
        <img
          src="/avatar.jpg"
          alt="Mauro Guerrero"
          className="h-20 w-20 rounded-full object-cover"
        />
      </div>

      <div className="backdrop-blur-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-8">
        <h1 className="mb-6 text-center text-xl font-semibold text-[var(--foreground)]">
          Iniciar sesion
        </h1>

        {/* Tabs */}
        <div className="mb-6 flex border-b border-[var(--foreground)]/10">
          <button
            type="button"
            onClick={() => {
              setActiveTab("password");
              setErrorMessage("");
              setState("idle");
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === "password"
                ? "text-[var(--foreground)] border-b-2 border-[var(--foreground)]"
                : "text-[var(--muted-foreground)]"
            }`}
          >
            Contrasena
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("magic-link");
              setErrorMessage("");
              setState("idle");
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === "magic-link"
                ? "text-[var(--foreground)] border-b-2 border-[var(--foreground)]"
                : "text-[var(--muted-foreground)]"
            }`}
          >
            Enlace magico
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Password tab */}
        {activeTab === "password" && (
          <form
            onSubmit={handlePasswordLogin}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted-foreground)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-transparent border border-[var(--foreground)]/20 rounded-lg px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:border-[var(--foreground)]/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted-foreground)]">
                Contrasena
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-transparent border border-[var(--foreground)]/20 rounded-lg px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:border-[var(--foreground)]/40"
              />
            </div>

            {showTurnstile && (
              <div className="flex justify-center">
                <div ref={turnstileContainerRef} />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (showTurnstile && !turnstileToken)}
              className="bg-[var(--foreground)] text-[var(--background)] rounded-lg py-2.5 font-medium disabled:opacity-50 transition-opacity"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}

        {/* Magic link tab */}
        {activeTab === "magic-link" && (
          <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted-foreground)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-transparent border border-[var(--foreground)]/20 rounded-lg px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:border-[var(--foreground)]/40"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[var(--foreground)] text-[var(--background)] rounded-lg py-2.5 font-medium disabled:opacity-50 transition-opacity"
            >
              {isLoading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
