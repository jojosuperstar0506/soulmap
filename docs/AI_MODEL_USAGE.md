# How the AI model is used in Soulmap

All AI features use the **Soul system prompt** ([`src/content/soul-system-prompt.md`](../src/content/soul-system-prompt.md)) plus a task-specific block. The same identity and lexicon apply everywhere.

## Where the model is called

| Feature | API route | Function | Purpose | Max output |
|--------|-----------|----------|---------|------------|
| **Blueprint — Your narrative** | `POST /api/blueprint/analyze` | `callLLM("blueprint/analyze", …)` | One-time narrative: theme, challenge, strength, current 大运 meaning, and **currentLuckAspects** (wealth, love, career, friends). Cached per profile. **Sonnet** when `ANTHROPIC_API_KEY` set. | 4096 |
| **Blueprint — 大运 phase detail** | `POST /api/blueprint/luck-phase` | `callLLM("blueprint/luck-phase", …)` | Per 10-year phase: theme, challenges, solutions, aspects. Called when user opens a phase. **Sonnet** when `ANTHROPIC_API_KEY` set. | 2048 |
| **Life Oracle chat** | `POST /api/oracle/chat` | `callLLMChat("oracle/chat", …)` | Multi-turn chat with chart context. Each user message gets one reply. **Sonnet** when `ANTHROPIC_API_KEY` set. | 8192 |
| **Library — For You** | `POST /api/library/for-you/curate` | `callLLM("library/for-you/curate", …)` | Pick 8 excerpts + "Why this speaks to you now" from Blueprint + chart. **Gemini Flash** only. | 2048 |
| **Daily Spark** | `POST /api/spark/today` | `callLLM("spark/today", …)` | Pick sacred text of the day + reflection prompt index + short "why" lines. **Gemini Flash** only. | 512 |

## Data flow

- **Blueprint analyze** is the only place that produces the full narrative (theme, challenge, strength, current 大运, aspects). That result is stored as `blueprintAnalysis` on the profile and is **reused** by Library curate and Spark today (they receive it in the request body). So the model is not re-asked for theme/challenge elsewhere; they only do selection + explanation.
- **Oracle** receives the full chart (and optionally analysis) and answers ad‑hoc questions; it does not write the stored Blueprint narrative.

## Model tier (Sonnet vs Gemini Flash)

You can use **Claude Sonnet** for high-value, differentiation-heavy work and **Gemini 2.5 Flash** for the rest:

| Use Sonnet (when `ANTHROPIC_API_KEY` is set) | Use Gemini Flash |
|---------------------------------------------|------------------|
| Blueprint analyze (narrative + aspects)      | Library curate   |
| Blueprint luck-phase (per-phase reading)    | Spark today     |
| Oracle chat (complex, conversational)       | —                |

Blueprint and Oracle are the most referenced and differentiate Soulmap (personalized chart narrative + 大运 + conversational guidance). Library and Spark are selection + short blurbs and stay on Flash to keep cost down.

**Implementation:** All five routes call `src/lib/llm.ts`: `callLLM(route, …)` or `callLLMChat("oracle/chat", …)`. Provider is chosen by `getProviderForRoute(route)`:
- `blueprint/*` and `oracle/chat` → **Anthropic (Sonnet)** when `ANTHROPIC_API_KEY` is set; otherwise **Gemini Flash**.
- `library/for-you/curate` and `spark/today` → **Gemini Flash** only (no Sonnet).  
Blueprint and Oracle accept either key (503 if neither is set). Library and Spark require `GEMINI_API_KEY` (Spark returns nulls when key is missing).
