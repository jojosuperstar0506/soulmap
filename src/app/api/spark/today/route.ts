import { NextRequest, NextResponse } from "next/server";
import { getCurrentLuckPillar } from "@/lib/current-luck";
import { callLLM } from "@/lib/llm";
import { getSoulSystemPrompt } from "@/lib/soul-prompt";
import { LIBRARY_TEXTS } from "@/content/library/texts";
import { SPARK_PROMPTS } from "@/content/spark-prompts";
import type { BlueprintAnalysis } from "@/types/bazi";

const SPARK_TASK = `
## Task: Daily Spark (JSON only)

Given the person's Blueprint and current 大运, choose:
1. One sacred text of the day: pick one excerpt id from the library list that best speaks to them today.
2. One reflection prompt: pick one prompt index (0 to N-1) from the spark prompts list that fits their theme/challenge/大运.
3. whyText: one sentence for why this sacred text speaks to them today.
4. whyPromptLine: one sentence for why today's spark fits them.

Respond with a single JSON object only: { "sacredTextId": "<id>", "whyText": "<sentence>", "promptIndex": <0..N-1>, "whyPromptLine": "<sentence>" }. Use exact library ids and valid promptIndex.`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { sacredTextId: null, whyText: null, promptIndex: null, whyPromptLine: null },
      { status: 200 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { blueprintAnalysis, chart, date: dateStr } = body ?? {};
    if (!blueprintAnalysis || !chart?.luckPillars) {
      return NextResponse.json(
        { sacredTextId: null, whyText: null, promptIndex: null, whyPromptLine: null },
        { status: 200 }
      );
    }

    const year = dateStr ? new Date(dateStr).getFullYear() : new Date().getFullYear();
    const currentLuck = getCurrentLuckPillar(chart.luckPillars, year);
    const libraryList = LIBRARY_TEXTS.map((t) => ({ id: t.id, title: t.title }));
    const sparkList = SPARK_PROMPTS.map((p, i) => ({ index: i, reflectionPrompt: p.reflectionPrompt }));

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
      libraryExcerpts: libraryList,
      sparkPrompts: sparkList,
    };

    const userMessage = `Context:\n${JSON.stringify(context, null, 2)}\n\nRespond with only the JSON object.`;

    const systemInstruction = getSoulSystemPrompt() + SPARK_TASK;
    const { text: raw } = await callLLM("spark/today", systemInstruction, userMessage, {
      maxOutputTokens: 512,
    });

    const jsonStr = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(jsonStr) as {
      sacredTextId?: string;
      whyText?: string;
      promptIndex?: number;
      whyPromptLine?: string;
    };

    const validIds = new Set(LIBRARY_TEXTS.map((t) => t.id));
    const sacredTextId = parsed.sacredTextId && validIds.has(parsed.sacredTextId) ? parsed.sacredTextId : null;
    const promptIndex =
      typeof parsed.promptIndex === "number" &&
      parsed.promptIndex >= 0 &&
      parsed.promptIndex < SPARK_PROMPTS.length
        ? parsed.promptIndex
        : null;

    return NextResponse.json({
      sacredTextId,
      whyText: sacredTextId ? String(parsed.whyText ?? "") : null,
      promptIndex,
      whyPromptLine: promptIndex !== null ? String(parsed.whyPromptLine ?? "") : null,
    });
  } catch (err: unknown) {
    console.error("Spark today error:", err);
    return NextResponse.json(
      { sacredTextId: null, whyText: null, promptIndex: null, whyPromptLine: null },
      { status: 200 }
    );
  }
}
