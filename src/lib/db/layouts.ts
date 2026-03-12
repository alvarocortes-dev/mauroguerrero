import { eq } from "drizzle-orm";
import { layoutSchema } from "@/core/renderer/types";
import { sampleLayout } from "@/core/renderer/sample-layout";
import { getDb } from "./client";
import { layouts } from "./schema";

export const getLayoutBySlug = async (slug: string) => {
  const db = getDb();
  if (!db) {
    return sampleLayout;
  }

  try {
    const result = await db
      .select()
      .from(layouts)
      .where(eq(layouts.slug, slug));
    const row = result[0];
    if (!row) {
      return sampleLayout;
    }
    return layoutSchema.parse(row.data);
  } catch (error) {
    console.warn("Database error, falling back to sample layout:", error);
    return sampleLayout;
  }
};

export const upsertLayout = async (payload: unknown) => {
  const db = getDb();
  if (!db) {
    return sampleLayout;
  }

  const layout = layoutSchema.parse(payload);
  await db
    .insert(layouts)
    .values({
      id: layout.id,
      slug: layout.slug,
      title: layout.title,
      data: layout,
      updatedAt: new Date(layout.updatedAt),
    })
    .onConflictDoUpdate({
      target: layouts.slug,
      set: {
        title: layout.title,
        data: layout,
        updatedAt: new Date(layout.updatedAt),
      },
    });

  return layout;
};
