import { NextRequest, NextResponse } from "next/server";
import { generateSignature } from "@/lib/cloudinary";
import { getAuthSession } from "@/lib/auth/helpers";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { folder = "default" } = await request.json();

    const data = generateSignature(folder);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating upload signature:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
