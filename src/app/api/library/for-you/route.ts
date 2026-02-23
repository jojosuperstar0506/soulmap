import { NextRequest, NextResponse } from "next/server";
import { LIBRARY_TEXTS } from "@/content/library/texts";
import { rankForYou } from "@/lib/library/for-you";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { elementBalance, favorableElements, currentConcern } = body ?? {};

  const ranked = rankForYou(LIBRARY_TEXTS, {
    elementBalance,
    favorableElements,
    currentConcern,
  });

  return NextResponse.json({ items: ranked.slice(0, 20) });
}

