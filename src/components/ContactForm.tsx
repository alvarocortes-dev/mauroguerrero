"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setLoading(false);
    setSuccess(true);

    // Reset after showing success
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white/80 dark:bg-black/80 backdrop-blur-md p-8 rounded-2xl border border-black/10 dark:border-white/10 shadow-lg text-black dark:text-white">
      <h2 className="text-xl font-medium mb-6 text-center tracking-[0.2em] uppercase text-black dark:text-white">
        Contacto
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="name"
            className="text-xs uppercase tracking-[0.1em] text-muted-foreground"
          >
            Nombre
          </label>
          <input
            id="name"
            type="text"
            required
            className="bg-transparent border-b border-muted-foreground/50 py-1 px-0 text-sm focus:outline-none focus:border-foreground transition-colors text-black dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="phone"
            className="text-xs uppercase tracking-[0.1em] text-muted-foreground"
          >
            Teléfono
          </label>
          <input
            id="phone"
            type="tel"
            required
            className="bg-transparent border-b border-muted-foreground/50 py-1 px-0 text-sm focus:outline-none focus:border-foreground transition-colors text-black dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="detail"
            className="text-xs uppercase tracking-[0.1em] text-muted-foreground"
          >
            Detalle
          </label>
          <textarea
            id="detail"
            required
            rows={3}
            className="bg-transparent border-b border-muted-foreground/50 py-1 px-0 text-sm focus:outline-none focus:border-foreground transition-colors resize-none text-black dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="relative h-10 w-full mt-4 overflow-hidden bg-black dark:bg-white text-white dark:text-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-80 rounded-sm"
        >
          <AnimatePresence mode="wait">
            {!loading && !success && (
              <motion.span
                key="default"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                Enviar
              </motion.span>
            )}
            {loading && (
              <motion.span
                key="loading"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                Enviando
              </motion.span>
            )}
            {success && (
              <motion.span
                key="success"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                Enviado
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </form>
    </div>
  );
}
