"use client";

import { useEffect } from "react";
import { EditorCanvas } from "@/core/editor/EditorCanvas";
import { Toolbar } from "@/core/editor/Toolbar";
import { PropertiesPanel } from "@/core/editor/PropertiesPanel";
import { useEditorStore } from "@/core/editor/store";
import { sampleLayout } from "@/core/renderer/sample-layout";

export default function EditorPage() {
  const { setLayout } = useEditorStore();

  useEffect(() => {
    // In a real app, we would fetch the layout from the API here.
    // For now, we use the sample layout.
    // Also, we should check if we are creating a new layout or editing an existing one.
    
    const fetchLayout = async () => {
      try {
        const res = await fetch("/api/layouts/home");
        if (res.ok) {
           const data = await res.json();
           setLayout(data);
           return;
        }
      } catch (e) {
        console.error(e);
      }
      setLayout(sampleLayout);
    };

    fetchLayout();
  }, [setLayout]);

  return (
    <main className="relative min-h-screen w-full">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
        <h1 className="font-semibold">Editor: Home</h1>
        <div className="text-xs text-neutral-500">
           Borrador automático
        </div>
      </header>
      
      <div className="flex justify-center bg-neutral-100">
         <div className="w-full max-w-5xl bg-white shadow-sm min-h-screen">
            <EditorCanvas />
         </div>
      </div>

      <Toolbar />
      <PropertiesPanel />
    </main>
  );
}
