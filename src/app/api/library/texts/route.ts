import { NextRequest, NextResponse } from "next/server";
import { LIBRARY_TEXTS } from "@/content/library/texts";
import type { Tradition } from "@/types/library";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tradition = searchParams.get("tradition") as Tradition | null;
  const theme = searchParams.get("theme");
  const q = searchParams.get("q")?.toLowerCase();

  let items = LIBRARY_TEXTS;
  if (tradition) items = items.filter((t) => t.tradition === tradition);
  if (theme) items = items.filter((t) => t.themes.includes(theme as never));
  if (q) {
    items = items.filter((t) => {
      const hay = `${t.title} ${t.englishText} ${t.source ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  return NextResponse.json({ items });
}

