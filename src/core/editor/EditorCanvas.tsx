"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { useEditorStore } from "./store";
import { SortableItem } from "./SortableItem";
import { renderItem } from "@/core/renderer/Renderer";

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

export const EditorCanvas = () => {
  const { layout, moveItem, selectItem, selectedId } = useEditorStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (!layout) return <div>Cargando...</div>;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    selectItem(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      moveItem(active.id as string, over.id as string);
    }

    setActiveId(null);
  };

  const activeItem = activeId
    ? layout.items.find((item) => item.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="masonry min-h-[500px] p-8 pb-32">
        <SortableContext
          items={layout.items.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          {layout.items.map((item) => (
            <div key={item.id} className="masonry-item">
              <SortableItem id={item.id}>
                {renderItem(item, "edit", selectedId, selectItem)}
              </SortableItem>
            </div>
          ))}
        </SortableContext>
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeItem ? (
          <div className="w-[300px] opacity-80">
            {/* Simple preview while dragging */}
            {renderItem(activeItem, "view", null, undefined)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
