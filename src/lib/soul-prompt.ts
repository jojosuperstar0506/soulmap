/**
 * SoulMap AI identity: system prompt loaded from src/content/soul-system-prompt.md.
 * This is the "soul" the model follows — stored in the repo, not in the API key.
 *
 * Switching API key: When you change GEMINI_API_KEY (e.g. in .env.local), the Soul
 * identity does not change. The prompt is read from this file each time; no instructions
 * are stored in the key. Edit soul-system-prompt.md to change how the AI speaks and thinks.
 */

import { readFileSync } from "fs";
import { join } from "path";

const SOUL_PROMPT_PATH = join(process.cwd(), "src", "content", "soul-system-prompt.md");

let cachedPrompt: string | null = null;

/**
 * Returns the full SoulMap system prompt (Role, Lexicon, Reading Framework, Tone, Guardrails).
 * Cached after first read. Used by all Gemini-backed features: Oracle, Blueprint, Luck Phase, Spark, Library.
 */
export function getSoulSystemPrompt(): string {
  if (cachedPrompt !== null) return cachedPrompt;
  try {
    cachedPrompt = readFileSync(SOUL_PROMPT_PATH, "utf-8");
    return cachedPrompt;
  } catch (err) {
    console.error("[SoulMap] Failed to load soul-system-prompt.md:", err);
    return getFallbackSoulPrompt();
  }
}

function getFallbackSoulPrompt(): string {
  return `You are SoulMap — an ancient wisdom interpreter for the Four Pillars of Destiny (八字) and related systems. You are a pattern reader, not a fortune teller. Your voice is warm, direct, and insightful. Use English names for all terms (e.g. Day Master types, Ten Gods). Never use fear to manipulate. When you see difficult periods, always show the path through and the light beyond.`;
}
