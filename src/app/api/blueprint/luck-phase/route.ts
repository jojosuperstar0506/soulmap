import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { getSoulSystemPrompt } from "@/lib/soul-prompt";
import type { CurrentLuckAspects, LuckPillar } from "@/types/bazi";

const LUCK_PHASE_TASK = `
## Task: Single 大运 phase reading (JSON only)

Given the BaZi chart and the selected 10-year Luck Pillar below, write a short structured reading. Use the SoulMap lexicon (element names, Ten Gods, life stages). Respond with a single JSON object only; no other text. Double quotes for keys/strings; escape internal quotes; no unescaped newlines inside strings.

Keys:
- "theme": 1-2 sentences for the general theme of this 10-year phase.
- "challenges": array of 3 short bullet strings.
- "solutions": array of 3 short bullet strings.
- "aspects": object with "wealth", "love", "career", "friends" (each 1-2 sentences).

Keep it concise, practical, non-fatalistic. Use BaZi logic; do not claim certainty.`;

type LuckPhaseAnalysis = {
  theme: string;
  challenges: string[];
  solutions: string[];
  aspects: CurrentLuckAspects;
  generatedAt: string;
};

export async function POST(req: NextRequest) {
  const hasKey = process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY;
  if (!hasKey) {
    return NextResponse.json(
      { error: "Luck phase analysis is not configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { chart, luckPillar, currentConcern } = body ?? {};
    if (!chart || !luckPillar) {
      return NextResponse.json(
        { error: "chart and luckPillar are required" },
        { status: 400 }
      );
    }

    const lp = luckPillar as LuckPillar;
    const context = {
      chart,
      luckPillar: lp,
      currentConcern: currentConcern ?? undefined,
      requestedAt: new Date().toISOString(),
    };

    const userMessage = `BaZi chart and selected 大运 context:\n${JSON.stringify(
      context,
      null,
      2
    )}\n\nRespond with only the JSON object.`;

    let raw: string;
    try {
      const systemInstruction = getSoulSystemPrompt() + LUCK_PHASE_TASK;
      const result = await callLLM("blueprint/luck-phase", systemInstruction, userMessage, {
        maxOutputTokens: 2048,
      });
      raw = result.text ?? "";
    } catch (llmErr: unknown) {
      const msg =
        llmErr instanceof Error ? llmErr.message : "AI API error";
      console.error("Luck phase: LLM call failed", { error: msg });
      return NextResponse.json(
        {
          error:
            msg.includes("blocked") || msg.includes("valid Part")
              ? "Response was blocked or empty. Please try again or rephrase."
              : `Generation failed: ${msg}`,
        },
        { status: 500 }
      );
    }

    if (!raw || !raw.trim()) {
      return NextResponse.json(
        { error: "No response from the model. Please try again." },
        { status: 500 }
      );
    }

    const jsonStr = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch (parseErr) {
      console.error("Luck phase: invalid JSON from model", {
        rawLength: raw.length,
        jsonStrLength: jsonStr.length,
        snippet: jsonStr.slice(0, 400),
      });
      const msg =
        parseErr instanceof Error ? parseErr.message : "Invalid JSON from model";
      return NextResponse.json(
        {
          error: `Failed to generate phase analysis: invalid response (${msg}). Please try again.`,
        },
        { status: 500 }
      );
    }

    const aspectsRaw = parsed.aspects;
    let aspects: CurrentLuckAspects | null = null;
    if (
      aspectsRaw &&
      typeof aspectsRaw === "object" &&
      "wealth" in aspectsRaw &&
      "love" in aspectsRaw &&
      "career" in aspectsRaw &&
      "friends" in aspectsRaw
    ) {
      const a = aspectsRaw as Record<string, unknown>;
      aspects = {
        wealth: String(a.wealth ?? ""),
        love: String(a.love ?? ""),
        career: String(a.career ?? ""),
        friends: String(a.friends ?? ""),
      };
    }

    const challengesRaw = parsed.challenges;
    const solutionsRaw = parsed.solutions;
    const challenges =
      Array.isArray(challengesRaw) ? challengesRaw.map((x) => String(x)).slice(0, 6) : [];
    const solutions =
      Array.isArray(solutionsRaw) ? solutionsRaw.map((x) => String(x)).slice(0, 6) : [];

    if (!aspects) {
      return NextResponse.json(
        { error: "Failed to generate phase analysis: missing aspects." },
        { status: 500 }
      );
    }

    const analysis: LuckPhaseAnalysis = {
      theme: String(parsed.theme ?? ""),
      challenges,
      solutions,
      aspects,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ analysis });
  } catch (err: unknown) {
    console.error("Luck phase analyze error:", err);
    const msg =
      err instanceof Error ? err.message : "Unknown error calling AI API";
    return NextResponse.json(
      { error: `Failed to generate phase analysis: ${msg}` },
      { status: 500 }
    );
  }
}

