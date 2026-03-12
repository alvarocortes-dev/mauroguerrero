import { z } from "zod";

export const layoutImageSchema = z.object({
  id: z.string(),
  type: z.literal("image"),
  src: z.string(),
  publicId: z.string().optional(),
  alt: z.string().default(""),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: z.string().optional(),
});

export const layoutTextSchema = z.object({
  id: z.string(),
  type: z.literal("text"),
  content: z.string(),
});

export const layoutSpacerSchema = z.object({
  id: z.string(),
  type: z.literal("spacer"),
  height: z.number().int().positive(),
});

export const layoutItemSchema = z.union([
  layoutImageSchema,
  layoutTextSchema,
  layoutSpacerSchema,
]);

export const layoutSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  items: z.array(layoutItemSchema),
  updatedAt: z.string(),
});

export type Layout = z.infer<typeof layoutSchema>;
export type LayoutItem = z.infer<typeof layoutItemSchema>;
