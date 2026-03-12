"use client";

import { useEditorStore } from "./store";

export const Toolbar = () => {
  const { addItem, saveLayout, isSaving, hasUnsavedChanges } = useEditorStore();

  return (
    <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-neutral-200 bg-white/90 p-2 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-1 border-r border-neutral-200 pr-2">
        <button
          onClick={() => addItem("image")}
          className="rounded-full px-4 py-2 text-sm font-medium hover:bg-neutral-100"
        >
          + Imagen
        </button>
        <button
          onClick={() => addItem("text")}
          className="rounded-full px-4 py-2 text-sm font-medium hover:bg-neutral-100"
        >
          + Texto
        </button>
        <button
          onClick={() => addItem("spacer")}
          className="rounded-full px-4 py-2 text-sm font-medium hover:bg-neutral-100"
        >
          + Espacio
        </button>
      </div>

      <div className="pl-2">
        <button
          onClick={() => saveLayout()}
          disabled={!hasUnsavedChanges || isSaving}
          className={`rounded-full px-6 py-2 text-sm font-medium text-white transition-all ${
            hasUnsavedChanges
              ? "bg-black hover:bg-neutral-800"
              : "bg-neutral-300"
          }`}
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
};
