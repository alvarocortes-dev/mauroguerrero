"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth/client";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { UAParser } from "ua-parser-js";

interface SessionInfo {
  id: string;
  token: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  expiresAt: Date;
}

type ManagerState = "idle" | "loading" | "revoking";

function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return <Monitor className="h-5 w-5" />;
  const parser = new UAParser(userAgent);
  const deviceType = parser.getDevice().type;
  if (deviceType === "mobile") return <Smartphone className="h-5 w-5" />;
  if (deviceType === "tablet") return <Tablet className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

function getDeviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Dispositivo desconocido";
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  return `${browser.name ?? "Navegador desconocido"} en ${os.name ?? "SO desconocido"}`;
}

interface SessionManagerProps {
  currentSessionId: string;
  isDevAccount?: boolean;
}

interface AdminAccount {
  user: { id: string; email: string; name: string };
  sessions: SessionInfo[];
}

export default function SessionManager({
  currentSessionId,
  isDevAccount = false,
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [state, setState] = useState<ManagerState>("loading");
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setState("loading");
    try {
      const result = await authClient.multiSession.listDeviceSessions();
      if (result.data) {
        setSessions(
          result.data.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            expiresAt: new Date(s.expiresAt),
          }))
        );
      }

      if (isDevAccount) {
        const res = await fetch("/api/auth/admin/sessions");
        if (res.ok) {
          const data = await res.json();
          setAdminAccounts(
            data.accounts.map((acc: any) => ({
              ...acc,
              sessions: acc.sessions.map((s: any) => ({
                ...s,
                createdAt: new Date(s.createdAt),
                expiresAt: new Date(s.expiresAt),
              })),
            }))
          );
        }
      }
    } catch {
      // Silently fail — user can retry
    }
    setState("idle");
  }, [isDevAccount]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (sessionId: string, sessionToken?: string, isAdmin = false) => {
    const confirmed = window.confirm(
      "Estas seguro de que quieres cerrar esta sesion?"
    );
    if (!confirmed) return;

    setState("revoking");
    try {
      if (isAdmin && sessionToken) {
        await fetch("/api/auth/admin/sessions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken }),
        });
        setAdminAccounts((prev) =>
          prev.map((acc) => ({
            ...acc,
            sessions: acc.sessions.filter((s) => s.id !== sessionId),
          }))
        );
      } else {
        await authClient.multiSession.revoke({ sessionToken: sessionToken ?? sessionId });
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
      setRevokedMessage("Sesion revocada");
      setTimeout(() => setRevokedMessage(null), 3000);
    } catch {
      setRevokedMessage("Error al revocar sesion");
      setTimeout(() => setRevokedMessage(null), 3000);
    }
    setState("idle");
  };

  const renderSessionCard = (
    session: SessionInfo,
    isCurrent: boolean,
    isAdmin = false
  ) => (
    <div
      key={session.id}
      className="backdrop-blur-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-xl p-4 flex items-center gap-4"
    >
      <div className="text-[var(--muted-foreground)]">
        {getDeviceIcon(session.userAgent)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">
            {getDeviceLabel(session.userAgent)}
          </p>
          {isCurrent && (
            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full whitespace-nowrap">
              Sesion actual
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          IP: {session.ipAddress ?? "Desconocida"} &middot; Inicio:{" "}
          {formatDistanceToNow(session.createdAt, {
            addSuffix: true,
            locale: es,
          })}
        </p>
      </div>
      {!isCurrent && (
        <button
          type="button"
          onClick={() => handleRevoke(session.id, session.token, isAdmin)}
          disabled={state === "revoking"}
          className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          Revocar
        </button>
      )}
    </div>
  );

  if (state === "loading" && sessions.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Cargando sesiones...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {revokedMessage && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">
          {revokedMessage}
        </div>
      )}

      {/* Own sessions */}
      <div>
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-3">
          Tus sesiones
        </h2>
        <div className="space-y-3">
          {sessions.map((s) =>
            renderSessionCard(s, s.id === currentSessionId, false)
          )}
          {sessions.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">
              No hay sesiones activas.
            </p>
          )}
        </div>
      </div>

      {/* Admin view: other accounts */}
      {isDevAccount &&
        adminAccounts
          .filter((acc) =>
            acc.sessions.some((s) => s.id !== currentSessionId)
          )
          .map((acc) => (
            <div key={acc.user.id}>
              <h2 className="text-lg font-medium text-[var(--foreground)] mb-3">
                Sesiones de {acc.user.name || acc.user.email}
              </h2>
              <div className="space-y-3">
                {acc.sessions
                  .filter((s) => s.id !== currentSessionId)
                  .map((s) => renderSessionCard(s, false, true))}
              </div>
            </div>
          ))}
    </div>
  );
}
