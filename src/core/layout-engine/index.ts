import type { LayoutItem } from "@/core/renderer/types";

export type MasonryItemPosition = {
  id: string;
  column: number;
  order: number;
};

export const buildMasonryPositions = (
  items: LayoutItem[],
  columnCount: number,
) => {
  const heights = Array.from({ length: columnCount }, () => 0);
  const positions: MasonryItemPosition[] = [];

  items.forEach((item, index) => {
    const column = heights.indexOf(Math.min(...heights));
    const height =
      item.type === "image"
        ? item.height / item.width
        : item.type === "text"
          ? 0.6
          : item.height / 300;
    heights[column] += height;
    positions.push({ id: item.id, column, order: index });
  });

  return positions;
};
