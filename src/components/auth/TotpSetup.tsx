"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { authClient } from "@/lib/auth/client";

type SetupStep = "loading" | "display" | "verifying" | "success" | "error";

export default function TotpSetup() {
  const [step, setStep] = useState<SetupStep>("loading");
  const [totpUri, setTotpUri] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchTotpUri() {
      try {
        const result = await authClient.twoFactor.enable({
          password: "",
        });

        if (result.error) {
          setErrorMessage("Error al generar el codigo QR. Recarga la pagina.");
          setStep("error");
          return;
        }

        if (result.data) {
          setTotpUri((result.data as any).totpURI ?? "");
          // Extract secret from URI: otpauth://totp/...?secret=XXXX&...
          const uri = (result.data as any).totpURI ?? "";
          const secretMatch = uri.match(/secret=([A-Z2-7]+)/i);
          if (secretMatch) {
            setSecret(secretMatch[1]);
          }
        }

        setStep("display");
      } catch {
        setErrorMessage("Error al generar el codigo QR. Recarga la pagina.");
        setStep("error");
      }
    }

    fetchTotpUri();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("verifying");
    setErrorMessage("");

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code,
      });

      if (result.error) {
        setErrorMessage(
          "Codigo incorrecto. Verifica que tu app este sincronizada."
        );
        setCode("");
        setStep("display");
        return;
      }

      setStep("success");
      setTimeout(() => {
        window.location.href = "/editor";
      }, 2000);
    } catch {
      setErrorMessage(
        "Codigo incorrecto. Verifica que tu app este sincronizada."
      );
      setCode("");
      setStep("display");
    }
  };

  if (step === "loading") {
    return (
      <div className="w-full max-w-sm backdrop-blur-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-8 text-center">
        <p className="text-[var(--muted-foreground)]">
          Generando codigo QR...
        </p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="w-full max-w-sm backdrop-blur-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-8 text-center">
        <p className="text-red-400">{errorMessage}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Recargar pagina
        </button>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="w-full max-w-sm backdrop-blur-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-8 text-center">
        <h1 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
          Autenticacion de dos factores activada
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Redirigiendo al editor...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm backdrop-blur-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-8">
      <h1 className="mb-2 text-center text-xl font-semibold text-[var(--foreground)]">
        Configurar autenticacion
      </h1>
      <p className="mb-6 text-center text-sm text-[var(--muted-foreground)]">
        Escanea el codigo QR con tu app de autenticacion (Google Authenticator,
        Authy, 1Password, etc.) o ingresa el codigo manualmente.
      </p>

      {/* QR Code */}
      <div className="mb-4 flex justify-center">
        <div className="rounded-xl bg-white p-3">
          <QRCodeSVG value={totpUri} size={200} level="M" />
        </div>
      </div>

      {/* Manual secret */}
      {secret && (
        <div className="mb-6">
          <p className="mb-2 text-center text-xs text-[var(--muted-foreground)]">
            O ingresa este codigo manualmente:
          </p>
          <code className="font-mono text-sm bg-[var(--foreground)]/10 px-3 py-2 rounded-lg select-all block text-center text-[var(--foreground)]">
            {secret}
          </code>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Verify code form */}
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm text-[var(--muted-foreground)]">
            Codigo de verificacion
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="000000"
            autoFocus
            className="w-full bg-transparent border border-[var(--foreground)]/20 rounded-lg px-4 py-3 text-[var(--foreground)] text-center text-2xl tracking-[0.5em] font-mono placeholder:text-[var(--foreground)]/20 focus:outline-none focus:border-[var(--foreground)]/40"
          />
        </div>
        <button
          type="submit"
          disabled={step === "verifying" || code.length !== 6}
          className="bg-[var(--foreground)] text-[var(--background)] rounded-lg py-2.5 font-medium disabled:opacity-50 transition-opacity"
        >
          {step === "verifying" ? "Verificando..." : "Verificar y activar"}
        </button>
      </form>
    </div>
  );
}
