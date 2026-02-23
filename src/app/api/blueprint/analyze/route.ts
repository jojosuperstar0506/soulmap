import { NextRequest, NextResponse } from "next/server";
import { getCurrentLuckPillar } from "@/lib/current-luck";
import { callLLM } from "@/lib/llm";
import { getSoulSystemPrompt } from "@/lib/soul-prompt";
import type { BlueprintAnalysis, CurrentLuckAspects } from "@/types/bazi";

const ANALYSIS_TASK = `
## Task: Blueprint summary (JSON only)

Given the BaZi chart and current 大运 context below, produce a short structured narrative. Use the SoulMap lexicon (Day Master names, Ten Gods, life seasons). Do not describe the current 大运 in the narrative — that is shown separately. Respond with a single JSON object only; no other text. Use double quotes for keys and strings. Escape any double quotes inside string values with backslash.

Top-level keys (each value a string):
- "summary": 2-3 sentences summarizing this person's chart and life season (no 大运 description).
- "theme": One sentence for their overarching life theme.
- "challenge": One sentence for their main challenge or tension.
- "strength": One sentence for their key strength.

Additionally "currentLuckAspects": object with four keys (each 1-2 sentences): "wealth", "love", "career", "friends". In the spirit of 紫微斗数 life palaces. Use BaZi logic; keep each aspect to 1-2 clear sentences.`;

export async function POST(req: NextRequest) {
  const hasKey = process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY;
  if (!hasKey) {
    return NextResponse.json(
      { error: "Blueprint analysis is not configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { chart, currentConcern } = body ?? {};
    if (!chart || !chart.luckPillars) {
      return NextResponse.json(
        { error: "Chart with luckPillars is required" },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    const currentLuck = getCurrentLuckPillar(chart.luckPillars, currentYear);
    const context = {
      chart,
      currentLuck: currentLuck
        ? {
            stem: currentLuck.stem,
            branch: currentLuck.branch,
            startYear: currentLuck.startYear,
            endYear: currentLuck.endYear,
            startAge: currentLuck.startAge,
          }
        : null,
      currentYear,
      currentConcern: currentConcern ?? undefined,
    };

    const userMessage = `BaZi chart and current 大运 context:\n${JSON.stringify(context, null, 2)}\n\nRespond with only the JSON object.`;

    const systemInstruction = getSoulSystemPrompt() + ANALYSIS_TASK;
    const { text: raw } = await callLLM("blueprint/analyze", systemInstruction, userMessage, {
      maxOutputTokens: 4096,
    });

    const jsonStr = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch (parseErr) {
      console.error("Blueprint analyze: invalid JSON from model", {
        rawLength: raw.length,
        jsonStrLength: jsonStr.length,
        snippet: jsonStr.slice(0, 400),
      });
      const msg =
        parseErr instanceof Error ? parseErr.message : "Invalid JSON from model";
      return NextResponse.json(
        {
          error: `Failed to generate analysis: the response was truncated or invalid (${msg}). Please try again.`,
        },
        { status: 500 }
      );
    }

    const aspectsRaw = parsed.currentLuckAspects;
    let currentLuckAspects: CurrentLuckAspects | undefined;
    if (
      aspectsRaw &&
      typeof aspectsRaw === "object" &&
      "wealth" in aspectsRaw &&
      "love" in aspectsRaw &&
      "career" in aspectsRaw &&
      "friends" in aspectsRaw
    ) {
      const a = aspectsRaw as Record<string, unknown>;
      currentLuckAspects = {
        wealth: String(a.wealth ?? ""),
        love: String(a.love ?? ""),
        career: String(a.career ?? ""),
        friends: String(a.friends ?? ""),
      };
    }

    const analysis: BlueprintAnalysis = {
      summary: String(parsed.summary ?? ""),
      theme: String(parsed.theme ?? ""),
      challenge: String(parsed.challenge ?? ""),
      strength: String(parsed.strength ?? ""),
      ...(currentLuckAspects && { currentLuckAspects }),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ analysis });
  } catch (err: unknown) {
    console.error("Blueprint analyze error:", err);
    const msg =
      err instanceof Error ? err.message : "Unknown error calling AI API";
    return NextResponse.json(
      { error: `Failed to generate analysis: ${msg}` },
      { status: 500 }
    );
  }
}
