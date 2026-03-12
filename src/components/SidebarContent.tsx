"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Modal } from "@/components/Modal";
import { ContactForm } from "@/components/ContactForm";
import { CreditsContent } from "@/components/CreditsContent";

const navItems = [
  "sobre mí",
  "proyectos",
  "diarios",
  "35mm",
  "blog",
  "contacto",
  "créditos",
];

export function SidebarContent() {
  const [modalType, setModalType] = useState<"contact" | "credits" | null>(
    null,
  );

  const handleNavClick = (item: string) => {
    if (item === "contacto") {
      setModalType("contact");
    } else if (item === "créditos") {
      setModalType("credits");
    }
  };

  return (
    <>
      <div className="flex flex-col h-full items-center text-center lg:items-start lg:text-left">
        <div className="mb-10">
          <h1 className="text-xl font-semibold">Mauro Guerrero</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Fotógrafo
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-10 items-center lg:items-start">
          {navItems.map((item) => (
            <span
              key={item}
              className="cursor-pointer hover:text-foreground"
              onClick={() => handleNavClick(item)}
            >
              {item}
            </span>
          ))}
        </nav>

        <div className="flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-10 lg:justify-start">
          <span className="cursor-pointer hover:text-foreground">ig</span>
          <span className="cursor-pointer hover:text-foreground">yt</span>
          <span className="cursor-pointer hover:text-foreground">be</span>
        </div>

        <div className="flex flex-col items-center gap-2 lg:flex-row lg:gap-4">
          <div className="h-14 w-14 overflow-hidden rounded-full bg-muted-foreground/20">
            <img
              src="/avatar.jpg"
              alt="Perfil"
              className="h-full w-full object-cover grayscale"
            />
          </div>
          <div className="text-center lg:text-left">
            <p className="hidden lg:block text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Perfil
            </p>
            <p className="text-sm font-medium">Mauro Guerrero</p>
          </div>
        </div>

        <div className="flex justify-center mt-auto pb-4 lg:mt-24 lg:pb-0 w-full [&_.theme-toggle]:!text-white lg:[&_.theme-toggle]:!text-[var(--icon-fill)]">
          <ThemeToggle />
        </div>
      </div>

      <Modal isOpen={!!modalType} onClose={() => setModalType(null)}>
        {modalType === "contact" && <ContactForm />}
        {modalType === "credits" && <CreditsContent />}
      </Modal>
    </>
  );
}
