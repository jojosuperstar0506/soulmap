/**
 * Unified LLM layer: route-level choice between Gemini Flash and Claude Sonnet.
 * High-value routes (Blueprint, Oracle) use Sonnet when ANTHROPIC_API_KEY is set;
 * Library and Spark use Gemini Flash only.
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { recordUsage } from "@/lib/usage-store";

const GEMINI_MODEL = "gemini-2.5-flash";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

/** Normalized usage for logging (input + output tokens). */
export interface TokenUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface LLMResult {
  text: string;
  usage?: TokenUsage;
}

export type LLMProvider = "gemini" | "anthropic";

/** Trimmed key — avoids 401 from invisible spaces/newlines in .env */
function getAnthropicKey(): string | null {
  const k = process.env.ANTHROPIC_API_KEY;
  if (k == null) return null;
  const trimmed = k.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Which provider to use for a given route.
 * Sonnet: Blueprint analyze, Blueprint luck-phase, Oracle (high-value, differentiation).
 * Gemini: Library curate, Spark today (selection + short blurbs).
 */
export function getProviderForRoute(route: string): LLMProvider {
  const useSonnet =
    getAnthropicKey() &&
    (route.startsWith("blueprint/") || route === "oracle/chat");
  return useSonnet ? "anthropic" : "gemini";
}

function toStoreUsage(usage: TokenUsage): { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number } {
  return {
    promptTokenCount: usage.promptTokenCount,
    candidatesTokenCount: usage.candidatesTokenCount,
    totalTokenCount: usage.totalTokenCount,
  };
}

/**
 * Single-turn LLM call. Uses Sonnet for blueprint/oracle when ANTHROPIC_API_KEY is set, else Gemini.
 */
export async function callLLM(
  route: string,
  systemInstruction: string,
  userMessage: string,
  options?: { maxOutputTokens?: number }
): Promise<LLMResult> {
  const provider = getProviderForRoute(route);
  const maxTokens = options?.maxOutputTokens ?? 1024;

  if (provider === "anthropic") {
    const apiKey = getAnthropicKey();
    if (!apiKey) return callGemini(route, systemInstruction, userMessage, maxTokens);
    try {
      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        system: systemInstruction,
        messages: [{ role: "user", content: userMessage }],
      });
      const text = response.content[0]?.type === "text" ? response.content[0].text : "";
      const usage = response.usage
        ? {
            promptTokenCount: response.usage.input_tokens,
            candidatesTokenCount: response.usage.output_tokens,
            totalTokenCount: response.usage.input_tokens + response.usage.output_tokens,
          }
        : undefined;
      if (usage) recordUsage(route, toStoreUsage(usage));
      console.info("[LLM]", { route, provider: "anthropic", model: ANTHROPIC_MODEL, ...usage });
      return { text, usage };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number }).status;
      const isAuthError =
        status === 401 ||
        msg.includes("401") ||
        msg.includes("authentication") ||
        msg.includes("invalid x-api-key");
      if (isAuthError) {
        console.warn("[LLM] Anthropic auth failed, falling back to Gemini:", msg.slice(0, 80));
        return callGemini(route, systemInstruction, userMessage, maxTokens);
      }
      throw err;
    }
  }

  return callGemini(route, systemInstruction, userMessage, maxTokens);
}

/**
 * Multi-turn chat (Oracle). Uses Sonnet when ANTHROPIC_API_KEY is set, else Gemini.
 */
export async function callLLMChat(
  route: string,
  systemInstruction: string,
  history: { role: "user" | "model"; content: string }[],
  userMessage: string,
  options?: { maxOutputTokens?: number }
): Promise<LLMResult> {
  const provider = getProviderForRoute(route);
  const maxTokens = options?.maxOutputTokens ?? 1024;

  if (provider === "anthropic") {
    const apiKey = getAnthropicKey();
    if (!apiKey) return callGeminiChat(route, systemInstruction, history, userMessage, maxTokens);
    try {
      const client = new Anthropic({ apiKey });
      const messages: { role: "user" | "assistant"; content: string }[] = history.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));
      messages.push({ role: "user", content: userMessage });
      const response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        system: systemInstruction,
        messages,
      });
      const text = response.content[0]?.type === "text" ? response.content[0].text : "";
      const usage = response.usage
        ? {
            promptTokenCount: response.usage.input_tokens,
            candidatesTokenCount: response.usage.output_tokens,
            totalTokenCount: response.usage.input_tokens + response.usage.output_tokens,
          }
        : undefined;
      if (usage) recordUsage(route, toStoreUsage(usage));
      console.info("[LLM]", { route, provider: "anthropic", model: ANTHROPIC_MODEL, ...usage });
      return { text, usage };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number }).status;
      const isAuthError =
        status === 401 ||
        msg.includes("401") ||
        msg.includes("authentication") ||
        msg.includes("invalid x-api-key");
      if (isAuthError) {
        console.warn("[LLM] Anthropic auth failed, falling back to Gemini:", msg.slice(0, 80));
        return callGeminiChat(route, systemInstruction, history, userMessage, maxTokens);
      }
      throw err;
    }
  }

  return callGeminiChat(route, systemInstruction, history, userMessage, maxTokens);
}

async function callGemini(
  route: string,
  systemInstruction: string,
  userMessage: string,
  maxOutputTokens: number
): Promise<LLMResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
    generationConfig: { maxOutputTokens },
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
  if (usage) recordUsage(route, toStoreUsage(usage));
  console.info("[LLM]", { route, provider: "gemini", model: GEMINI_MODEL, ...usage });
  return { text, usage };
}

async function callGeminiChat(
  route: string,
  systemInstruction: string,
  history: { role: "user" | "model"; content: string }[],
  userMessage: string,
  maxOutputTokens: number
): Promise<LLMResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
    generationConfig: { maxOutputTokens },
  });
  const chatHistory = history.map((m) => ({
    role: m.role === "user" ? "user" as const : "model" as const,
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
  if (usage) recordUsage(route, toStoreUsage(usage));
  console.info("[LLM]", { route, provider: "gemini", model: GEMINI_MODEL, ...usage });
  return { text, usage };
}
