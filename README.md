# SoulMap MVP

Your cosmic personality blueprint — powered by BaZi and ancient wisdom.

## Setup

1. **Fix npm cache** (if you see `EPERM` errors):
   ```bash
   sudo chown -R $(whoami) ~/.npm
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the dev server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## What's Built (Phase 1)

- **Onboarding** — Birth date, time (12 时辰), gender, life context
- **BaZi Engine** — Four Pillars, Hidden Stems, Ten Gods, Five Elements balance
- **Soul Blueprint** — Persona card with type name, Five Elements chart, share-ready layout
- **Tab Navigation** — Blueprint, Oracle, Library, Spark, Still Point (skeletons for Phase 2)

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + Framer Motion
- Zustand (state)
- lunar-javascript (BaZi calculation)
- PRD: `soulmap-mvp-prd.md`

## Google Gemini API key

Used for: **Life Oracle** chat, **Blueprint AI analysis**, **Library “For You” curation**, and **Daily Spark** personalization.

1. **Get a key:** [Google AI Studio → Get API key](https://aistudio.google.com/apikey) — sign in, create a key, copy it.
2. **Add it locally:** In the project root, create or edit `.env.local`:
   ```bash
   GEMINI_API_KEY=your_gemini_key_here
   ```
3. **Restart the dev server** so Next.js picks up the new env (`npm run dev`).

If the key is missing or invalid, Oracle returns 503, Blueprint keeps static content, Library uses rule-based ranking, and Spark uses the static daily prompt.

**Changing the API key:** The AI’s “Soul” identity (voice, lexicon, tone) lives in the repo, not in the key. When you switch `GEMINI_API_KEY`, the same system prompt is used. Edit `src/content/soul-system-prompt.md` to change how the AI speaks and interprets; no need to retrain or reconfigure the key.

### AI model cost comparison: Gemini vs Claude

Soulmap uses **Gemini 2.5 Flash** (`src/lib/gemini.ts`). Published pricing (per 1M tokens, USD):

| Model | Input | Output |
|-------|-------|--------|
| **Gemini 2.5 Flash** (current) | $0.30 | $2.50 |
| Claude Haiku (e.g. 4.5) | $1.00 | $5.00 |
| Claude Sonnet (e.g. 4.6) | $3.00 | $15.00 |

Relative to Gemini: **Claude Haiku** is about **3–4x** more expensive; **Claude Sonnet** is about **6–10x** more expensive. Each request sends the full Soul system prompt (~6k tokens) plus context, so input cost dominates. Example for 1,000 mixed requests (~8k input, ~1.5k output each): Gemini ~$6.15, Haiku ~$15.50, Sonnet ~$46.50. Check [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) and [Claude API pricing](https://docs.anthropic.com/en/docs/about-claude/pricing) for latest numbers.

## Sharing for testing

Share a live link with friends so they can try SoulMap on their phones or laptops. Testers do **not** need to install anything or add API keys — they just open the URL you share.

### Deploy to Vercel (recommended)

1. Push the repo to GitHub (if you haven’t already).
2. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
3. **New Project** → **Import** your SoulMap repository.
4. **Environment Variables**: Add these in the project settings (or during import):
   - **`GEMINI_API_KEY`** — required for Oracle, Blueprint analysis, Library “For You”, and Spark. Use the same key you use in `.env.local`.
   - **`ANTHROPIC_API_KEY`** — optional; if set, used for Blueprint/Oracle; if missing or invalid, the app falls back to Gemini.
5. Deploy. Vercel will build and give you a URL (e.g. `soulmap-xxx.vercel.app`).
6. Share that URL with testers. They can open it on mobile or desktop; no setup required on their side.

Keep your API keys secret: they live only in Vercel’s environment (and your local `.env.local`), not in the repo.

## Next Steps (Phase 2)

- Daily limit tracking for Oracle (currently 5 total)
- Add Sacred Library content (120+ excerpts)
- Daily Spark gamification
- Meditation audio + recommendation engine
- Share image generation (html-to-image)
