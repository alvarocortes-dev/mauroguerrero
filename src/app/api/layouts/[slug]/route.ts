import { NextRequest, NextResponse } from "next/server";
import { getLayoutBySlug, upsertLayout } from "@/lib/db/layouts";
import { deleteImage } from "@/lib/cloudinary";
import { getAuthSession } from "@/lib/auth/helpers";
import { z } from "zod";
import type { Layout } from "@/core/renderer/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { slug } = await params;
  const layout = await getLayoutBySlug(slug);
  return NextResponse.json(layout);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const body = (await request.json()) as Layout;

    // Ensure slug in body matches param
    if (body.slug !== slug) {
      return NextResponse.json({ error: "Slug mismatch" }, { status: 400 });
    }

    // 1. Get existing layout to find deleted images
    const oldLayout = await getLayoutBySlug(slug);

    // 2. Identify removed images
    const newImageIds = new Set(
      body.items.filter((item) => item.type === "image").map((item) => item.id),
    );

    const removedImages = oldLayout.items.filter(
      (item) => item.type === "image" && !newImageIds.has(item.id),
    );

    // 3. Delete from Cloudinary
    await Promise.all(
      removedImages.map(async (item) => {
        if (item.type === "image" && item.publicId) {
          console.log(`Deleting image ${item.publicId} from Cloudinary`);
          try {
            await deleteImage(item.publicId);
          } catch (err) {
            console.error(`Failed to delete image ${item.publicId}:`, err);
            // Continue even if delete fails
          }
        }
      }),
    );

    const updatedLayout = await upsertLayout(body);
    return NextResponse.json(updatedLayout);
  } catch (error) {
    console.error("Error saving layout:", error);
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return NextResponse.json(
        { error: (error as any).errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
