import { NextRequest, NextResponse } from "next/server";
import { callLLMChat } from "@/lib/llm";
import { getSoulSystemPrompt } from "@/lib/soul-prompt";

const ORACLE_TASK = `
## Task: Oracle chat

You are in conversation with the user. Use their BaZi chart context (if provided) for personalized guidance. Follow the SoulMap lexicon and tone. When discussing timing, reference current 大运 and 流年. Ground readings in classical BaZi; use pattern language, not absolute predictions. Always end with an actionable takeaway. Complete every sentence. Do not provide medical advice; acknowledge free will. If out of scope, redirect kindly.`;

export async function POST(req: NextRequest) {
  const hasKey = process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY;
  if (!hasKey) {
    return NextResponse.json(
      { error: "Oracle is not configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { message, chartContext, conversationHistory = [] } = body;
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentDateStr = now.toISOString().slice(0, 10);

    const chartBlock = chartContext
      ? `\n\nUser's BaZi chart (use for personalized guidance):\n${JSON.stringify(chartContext, null, 2)}`
      : "\n\n(No chart context — respond generally about BaZi and life guidance.)";

    const timeContext = `\n\n**Current date (use for 流年 and "this year"):** ${currentDateStr}. **Current calendar year:** ${currentYear}. When the user asks about "this year", "now", or 流年, always use ${currentYear}, not any other year.`;

    const systemContent = getSoulSystemPrompt() + ORACLE_TASK + timeContext + chartBlock;

    const history = conversationHistory.slice(-10).map((m: { role: string; content: string }) => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      content: m.content,
    }));

    const { text: reply } = await callLLMChat(
      "oracle/chat",
      systemContent,
      history,
      message,
      { maxOutputTokens: 8192 }
    );

    return NextResponse.json({ reply: reply || "I couldn't generate a response." });
  } catch (err: unknown) {
    console.error("Oracle error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    const isAuthError =
      msg.includes("401") ||
      msg.includes("authentication_error") ||
      msg.includes("invalid x-api-key");
    if (isAuthError) {
      return NextResponse.json(
        {
          error:
            "Anthropic API key invalid or account has no credits. Check ANTHROPIC_API_KEY in .env.local and your billing at console.anthropic.com, or remove it to use Gemini instead.",
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: `Failed to get Oracle response: ${msg}` },
      { status: 500 }
    );
  }
}
