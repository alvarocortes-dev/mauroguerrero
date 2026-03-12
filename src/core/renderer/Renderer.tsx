"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Layout, LayoutItem } from "./types";

type RendererProps = {
  layout: Layout;
  mode: "view" | "edit";
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

export const renderItem = (
  item: LayoutItem,
  mode: RendererProps["mode"],
  selectedId: string | null | undefined,
  onSelect: RendererProps["onSelect"],
) => {
  const isSelected = selectedId === item.id;
  const wrapperClass =
    mode === "edit"
      ? `group relative border ${
          isSelected ? "border-black" : "border-transparent"
        } transition`
      : "relative";

  if (item.type === "image") {
    return (
      <motion.div
        key={item.id}
        layout
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 240, damping: 30 }}
        className={wrapperClass}
        onClick={() => onSelect?.(item.id)}
      >
        <div className="overflow-hidden bg-neutral-100">
          <Image
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            className="h-auto w-full object-cover"
          />
        </div>
        {item.caption && (
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {item.caption}
          </p>
        )}
      </motion.div>
    );
  }

  if (item.type === "text") {
    return (
      <motion.div
        key={item.id}
        layout
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 240, damping: 30 }}
        className={`${wrapperClass} p-4 text-sm leading-6 text-foreground`}
        onClick={() => onSelect?.(item.id)}
      >
        {item.content}
      </motion.div>
    );
  }

  return (
    <motion.div
      key={item.id}
      layout
      className={wrapperClass}
      style={{ height: item.height }}
      onClick={() => onSelect?.(item.id)}
    />
  );
};

export const Renderer = ({
  layout,
  mode,
  selectedId,
  onSelect,
}: RendererProps) => {
  return (
    <div className="masonry">
      {layout.items.map((item) => (
        <div key={item.id} className="masonry-item">
          {renderItem(item, mode, selectedId, onSelect)}
        </div>
      ))}
    </div>
  );
};
