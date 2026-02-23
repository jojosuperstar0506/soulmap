import { GoogleGenerativeAI } from "@google/generative-ai";
import { recordUsage } from "@/lib/usage-store";

const GEMINI_MODEL = "gemini-2.5-flash";

/** Gemini 2.5 Flash paid tier: $0.30/1M input, $2.50/1M output (USD) */
const COST_PER_1M_INPUT = 0.3;
const COST_PER_1M_OUTPUT = 2.5;

export interface TokenUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface GeminiResult {
  text: string;
  usage?: TokenUsage;
}

function estimateCostUsd(usage: TokenUsage): number {
  const inputCost = (usage.promptTokenCount / 1_000_000) * COST_PER_1M_INPUT;
  const outputCost = (usage.candidatesTokenCount / 1_000_000) * COST_PER_1M_OUTPUT;
  return inputCost + outputCost;
}

export function logTokenUsage(route: string, usage: TokenUsage): void {
  const cost = estimateCostUsd(usage);
  console.info("[Gemini usage]", {
    route,
    inputTokens: usage.promptTokenCount,
    outputTokens: usage.candidatesTokenCount,
    totalTokens: usage.totalTokenCount,
    costUsd: cost.toFixed(6),
  });
  recordUsage(route, usage);
}

/**
 * Call Gemini with a system instruction and a single user message.
 * Returns the model's text and optional token usage.
 */
export async function getGeminiResponse(
  apiKey: string,
  systemInstruction: string,
  userMessage: string,
  options?: { maxOutputTokens?: number }
): Promise<GeminiResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
    generationConfig: {
      maxOutputTokens: options?.maxOutputTokens ?? 1024,
    },
  });
  const result = await model.generateContent(userMessage);
  const response = result.response;
  const text = response.text() ?? "";
  const usage = response.usageMetadata
    ? {
        promptTokenCount: response.usageMetadata.promptTokenCount ?? 0,
        candidatesTokenCount: response.usageMetadata.candidatesTokenCount ?? 0,
        totalTokenCount: response.usageMetadata.totalTokenCount ?? 0,
      }
    : undefined;
  return { text, usage };
}

/**
 * Call Gemini for multi-turn chat (e.g. Oracle) with history.
 */
export async function getGeminiChatResponse(
  apiKey: string,
  systemInstruction: string,
  history: { role: "user" | "model"; content: string }[],
  userMessage: string,
  options?: { maxOutputTokens?: number }
): Promise<GeminiResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
    generationConfig: {
      maxOutputTokens: options?.maxOutputTokens ?? 1024,
    },
  });
  const chatHistory = history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
  const chat = model.startChat({ history: chatHistory });
  const result = await chat.sendMessage(userMessage);
  const response = result.response;
  const text = response.text() ?? "";
  const usage = response.usageMetadata
    ? {
        promptTokenCount: response.usageMetadata.promptTokenCount ?? 0,
        candidatesTokenCount: response.usageMetadata.candidatesTokenCount ?? 0,
        totalTokenCount: response.usageMetadata.totalTokenCount ?? 0,
      }
    : undefined;
  return { text, usage };
}
