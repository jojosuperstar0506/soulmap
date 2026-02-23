import { NextRequest, NextResponse } from "next/server";
import { LIBRARY_TEXTS } from "@/content/library/texts";
import { getCurrentLuckPillar } from "@/lib/current-luck";
import { callLLM } from "@/lib/llm";
import { getSoulSystemPrompt } from "@/lib/soul-prompt";
import type { BlueprintAnalysis } from "@/types/bazi";

const CURATE_TASK = `
## Task: Library For You curation (JSON only)

Given the person's Blueprint (theme, challenge, strength, current 大运) and BaZi context, select the 8 excerpts from the list that best speak to their situation right now. Rank most relevant first. For each, provide 1-2 sentences (whyThisSpeaksToYouNow) — reference theme, challenge, strength, or 大运. Be specific and warm.

Respond with a single JSON object only: { "items": [ { "id": "<excerpt id>", "whyThisSpeaksToYouNow": "<1-2 sentences>" }, ... ] }. Use exact excerpt "id" values. Include exactly 8 items.`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI curation is not configured. Set GEMINI_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { blueprintAnalysis, chart, currentConcern } = body ?? {};
    if (!blueprintAnalysis || !chart?.luckPillars) {
      return NextResponse.json(
        { error: "Blueprint analysis and chart with luckPillars are required" },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    const currentLuck = getCurrentLuckPillar(chart.luckPillars, currentYear);
    const excerptList = LIBRARY_TEXTS.map((t) => ({
      id: t.id,
      title: t.title,
      themes: t.themes,
      relatedElements: t.relatedElements,
      englishText: t.englishText.slice(0, 300),
    }));

    const context = {
      blueprintAnalysis: blueprintAnalysis as BlueprintAnalysis,
      currentLuck: currentLuck
        ? {
            stem: currentLuck.stem,
            branch: currentLuck.branch,
            startYear: currentLuck.startYear,
            endYear: currentLuck.endYear,
          }
        : null,
      currentConcern: currentConcern ?? undefined,
      excerpts: excerptList,
    };

    const userMessage = `Context:\n${JSON.stringify(context, null, 2)}\n\nRespond with only the JSON object.`;

    const systemInstruction = getSoulSystemPrompt() + CURATE_TASK;
    const { text: raw } = await callLLM("library/for-you/curate", systemInstruction, userMessage, {
      maxOutputTokens: 2048,
    });

    const jsonStr = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(jsonStr) as { items?: { id: string; whyThisSpeaksToYouNow: string }[] };
    const items = Array.isArray(parsed.items)
      ? parsed.items.map((x) => ({
          id: String(x.id),
          whyThisSpeaksToYouNow: String(x.whyThisSpeaksToYouNow ?? ""),
        }))
      : [];

    const validIds = new Set(LIBRARY_TEXTS.map((t) => t.id));
    const filtered = items.filter((x) => validIds.has(x.id));

    return NextResponse.json({ items: filtered });
  } catch (err: unknown) {
    console.error("Library curate error:", err);
    const msg =
      err instanceof Error ? err.message : "Unknown error calling AI API";
    return NextResponse.json(
      { error: `Failed to curate: ${msg}` },
      { status: 500 }
    );
  }
}
