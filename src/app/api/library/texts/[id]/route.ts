import { NextRequest, NextResponse } from "next/server";
import { LIBRARY_TEXTS } from "@/content/library/texts";

export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;
  const item = LIBRARY_TEXTS.find((t) => t.id === id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ item });
}

