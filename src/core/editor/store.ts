import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Layout, LayoutItem } from "@/core/renderer/types";
import { arrayMove } from "@dnd-kit/sortable";

interface EditorState {
  layout: Layout | null;
  selectedId: string | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;

  // Actions
  setLayout: (layout: Layout) => void;
  selectItem: (id: string | null) => void;
  updateItem: (id: string, updates: Partial<LayoutItem>) => void;
  addItem: (type: LayoutItem["type"]) => void;
  removeItem: (id: string) => void;
  moveItem: (activeId: string, overId: string) => void;
  setSaving: (saving: boolean) => void;
  saveLayout: () => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  layout: null,
  selectedId: null,
  isSaving: false,
  hasUnsavedChanges: false,

  setLayout: (layout) => set({ layout, hasUnsavedChanges: false }),

  selectItem: (id) => set({ selectedId: id }),

  updateItem: (id, updates) =>
    set((state) => {
      if (!state.layout) return state;
      const newItems = state.layout.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      );
      return {
        layout: { ...state.layout, items: newItems as LayoutItem[] },
        hasUnsavedChanges: true,
      };
    }),

  addItem: (type) =>
    set((state) => {
      if (!state.layout) return state;

      let newItem: LayoutItem;

      if (type === "image") {
        newItem = {
          id: nanoid(),
          type: "image",
          src: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba", // Placeholder
          alt: "Nueva imagen",
          width: 800,
          height: 600,
        };
      } else if (type === "text") {
        newItem = {
          id: nanoid(),
          type: "text",
          content: "Escribe tu texto aquí...",
        };
      } else {
        newItem = {
          id: nanoid(),
          type: "spacer",
          height: 50,
        };
      }

      return {
        layout: {
          ...state.layout,
          items: [...state.layout.items, newItem],
        },
        hasUnsavedChanges: true,
        selectedId: newItem.id,
      };
    }),

  removeItem: (id) =>
    set((state) => {
      if (!state.layout) return state;
      return {
        layout: {
          ...state.layout,
          items: state.layout.items.filter((item) => item.id !== id),
        },
        hasUnsavedChanges: true,
        selectedId: null,
      };
    }),

  moveItem: (activeId, overId) =>
    set((state) => {
      if (!state.layout) return state;

      const oldIndex = state.layout.items.findIndex(
        (item) => item.id === activeId,
      );
      const newIndex = state.layout.items.findIndex(
        (item) => item.id === overId,
      );

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return state;
      }

      return {
        layout: {
          ...state.layout,
          items: arrayMove(state.layout.items, oldIndex, newIndex),
        },
        hasUnsavedChanges: true,
      };
    }),

  setSaving: (saving) => set({ isSaving: saving }),

  saveLayout: async () => {
    const { layout, setSaving } = get();
    if (!layout) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/layouts/${layout.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layout),
      });

      if (!response.ok) {
        throw new Error("Failed to save layout");
      }

      set({ hasUnsavedChanges: false });
    } catch (error) {
      console.error("Error saving layout:", error);
      alert("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  },
}));
