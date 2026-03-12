"use client";

import { Globe, Linkedin, Mail } from "lucide-react";

export function CreditsContent() {
  return (
    <div className="w-full max-w-sm mx-auto bg-white/80 dark:bg-black/80 backdrop-blur-md p-12 rounded-2xl border border-black/10 dark:border-white/10 shadow-lg text-center text-black dark:text-white">
      <div className="mb-10">
        <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Diseño y desarrollo
        </h3>
        <p className="text-sm font-medium tracking-wide text-black dark:text-white">
          Alvaro "Pelusa" Cortés
        </p>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
          Links de contacto
        </h3>
        <div className="flex justify-center items-center gap-6">
          <a
            href="https://www.alvarocortes.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-muted-foreground transition-colors"
            aria-label="Sitio web"
          >
            <Globe strokeWidth={1.5} size={20} />
          </a>
          <a
            href="https://www.linkedin.com/in/alvarocortesopazo/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-muted-foreground transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin strokeWidth={1.5} size={20} />
          </a>
          <a
            href="mailto:contacto@alvarocortes.cl"
            className="text-black dark:text-white hover:text-muted-foreground transition-colors"
            aria-label="Email"
          >
            <Mail strokeWidth={1.5} size={20} />
          </a>
        </div>
      </div>
    </div>
  );
}
