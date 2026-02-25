# SoulMap — Master TODO List

> **Source of truth for all work. Update this file as tasks are completed or added.**
> Last updated: 2026-02-25 (Phase 0 + 0.5 + 1-B complete)

---

## How to use this file
- Mark completed items with `[x]`
- Add new tasks under the relevant phase/section as they emerge
- Keep the "Current focus" line at the top up to date

**Current focus:** Phase 2 — Engagement Layer

---

## Phase 0 — Static HTML MVP (baseline)
> Status: largely complete. Items below are what remains.

### BaZi Calculation Engine
- [x] Four pillars (year / month / day / hour stem + branch)
- [x] Day Master determination
- [x] Five Elements balance (counts + percentages)
- [x] 大运 Luck Pillars (8 decades, forward/backward by gender × year polarity)
- [x] Hidden Stems (藏干) — `HIDDEN_STEMS[]` lookup table in app.js
- [x] Ten Gods (十神) — `getTenGod()` in app.js
- [x] 12 Growth Stages (十二长生) — `getTwelveStage()` in app.js
- [x] Empty/Void (空亡) — `getKongWang()` in app.js
- [x] Nayin (纳音) — `NAYIN[]` + `getNayin()` in app.js
- [x] Spirit Killers (神煞) — `getShenSha()` in app.js (驿马, 桃花, 天乙贵人, 太极贵人, 月德合, 天医, 国印)
- [x] Day Master Strength (strong / weak / balanced) — computed in `calculateBaZi()`
- [x] Favorable/Unfavorable Elements (喜用神) — computed in `calculateBaZi()`
- [x] Current Annual Pillar (流年) — computed in `calculateBaZi()`, includes Ten God + Nayin
- [ ] True solar time correction (birth location → longitude offset) — Phase 2

### Soul Blueprint Display
- [x] 10 Soul Type personas (name, tagline, essence, work/love/growth)
- [x] Five Elements bar chart
- [x] Day Master / Season / Zodiac meta row
- [x] 大运 Life Seasons strip (scrollable cards)
- [x] Energy Aspect charts (love / wealth / career / health per decade)
- [x] Narrative section (static fallback + API path wired)
- [x] **Four Pillars table redesign** — row-based grid matching mockup screenshot
  - [x] Add `getTenGod(dayStem, targetStem)` to app.js
  - [x] Add `HIDDEN_STEMS[]` lookup table to app.js
  - [x] Add `getTwelveStage(stem, branch)` to app.js
  - [x] Add `getKongWang(pillarIndex)` to app.js
  - [x] Add `NAYIN[]` lookup table to app.js
  - [x] Add `getShenSha(chart)` to app.js
  - [x] Rewrite `renderFourPillars()` — row-based CSS grid (10 rows × 5 cols)
  - [x] Add `.bazi-grid` CSS to styles.css
  - [ ] Cross-validate output against a reference BaZi tool for a known date
- [ ] Persona card portrait (AI image generation) — Phase 2
- [ ] Share image generation (1080×1350 PNG) — Phase 2
- [ ] "This Year for You" section (流年 analysis) — Phase 2
- [ ] "Favorable Elements" practical guide (colors, directions, times) — Phase 2

### Onboarding
- [x] Birth date input
- [x] 时辰 selector (12 two-hour periods)
- [x] Gender selector
- [x] Life context (occupation, relationship status, current concern)
- [ ] Birth location input (optional, for true solar time) — Phase 2
- [x] **Skip generation animation after first onboarding**
  - [x] Write `soulmap_has_onboarded` flag to localStorage after first animation
  - [x] Check flag in `runGeneration()` — skip animation if already onboarded
  - [ ] Verify: first submit → animation; second submit → straight to app

### UX / Polish
- [x] Session persistence (localStorage restore skips onboarding)
- [x] Tab navigation (Blueprint / Oracle / Library / Spark / Still Point)
- [x] Dark mode design system (Neo-Risograph Eastern Mythology)
- [ ] Light mode option — Phase 2
- [ ] WCAG 2.1 AA accessibility audit — Phase 2

---

## Phase 0.5 — Multi-Profile / File Management

- [x] Add `name` field to onboarding form
- [x] New localStorage model: `soulmap_profiles` array + `soulmap_active_profile`
- [x] `migrateOldSession()` — one-time migration of `soulmap_session` → named profile "My Chart"
- [x] `loadProfiles()` / `saveProfiles()` helpers
- [x] `activateProfile(profileObj)` — replaces `restoreSession()`
- [x] `saveCurrentProfile()` — replaces `saveSession()`
- [x] Replace all `saveSession()` / `restoreSession()` call sites
- [x] Profile button in app header upper-right (shows active profile name)
- [x] Profile switcher bottom sheet (list + add + delete)
- [x] "+ Add new profile" → goes to blank onboarding form
- [x] Switch between profiles → instant re-render
- [x] Delete profile (disabled when only 1 exists)
- [x] CSS: header flex layout, profile-btn pill, bottom sheet styles
- [ ] Verify: create 2 profiles, switch between them, each shows correct chart

---

## Phase 1-B — AI Backend (Vercel Serverless)

- [x] `npm install @anthropic-ai/sdk`
- [x] Create `.env.local` with `ANTHROPIC_API_KEY=...` (gitignored)
- [x] Create `src/app/api/narrative/route.ts` (POST handler)
  - Accept: `{ dayMaster, pillarsStr, elementBalance, dayMasterStrength, favorableElements, soulType, occupation, relationship, currentConcern, dayMasterStemIdx }`
  - Use system prompt from `src/content/soul-system-prompt.md`
  - Call `claude-sonnet-4-5` via Anthropic SDK
  - Return: `{ coreEssence, classicalQuote, classicalSource, work, love, growth }`
- [x] Add `fetchNarrativeFromAPI()` to app.js
- [x] Add `updateNarrativeSection()` to app.js
- [x] Call it after chart calculation in `buildChart()` (async, non-blocking)
- [x] Cache API response in profile object (narrativeFromAPI field) — persists across reloads
- [x] Restore cached narrative in `activateProfile()` — instant on subsequent loads
- [x] "AI reading coming soon" bar disappears when API responds
- [x] Move `index.html`, `app.js`, `styles.css` to `public/` for Vercel serving
- [x] Update `src/app/page.tsx` to redirect `/` → `/index.html`
- [x] Fix `getNayin()` bug — use `getPillarCycleIdx()` instead of wrong formula
- [ ] Add `ANTHROPIC_API_KEY` to Vercel environment variables
- [ ] Deploy and verify end-to-end on Vercel

---

## Phase 2 — Engagement Layer

### Sacred Library
- [x] Basic vault with 3 traditions (Daoism, Stoicism, Buddhism) — static JS
- [ ] Expand to 120-180 excerpts across 6 traditions (Daoism, Buddhism, Stoicism, Christianity, Islam, Judaism)
- [ ] Add original language text per excerpt where feasible
- [ ] Add sage interpretations (1-2 per key excerpt)
- [ ] "Why this speaks to you now" — AI-generated per user's current elemental state
- [ ] Bookmark / save excerpts to personal collection
- [ ] Browse by Theme (Uncertainty, Love, Purpose, Suffering, Stillness, etc.)
- [ ] "For You" AI-curated feed (default view, matched to chart + Oracle history)
- [ ] Verify content licensing (all translations must be public domain or licensed)

### Daily Spark
- [x] Basic streak counter
- [x] Daily text + reflection prompt + micro-practice (static rotation)
- [ ] Day-matched elemental energy (use current day's 天干地支)
- [ ] Element collector gamification (collect all 5 in a week → Harmony badge)
- [ ] Monthly review summary ("This month you reflected 22 times…")
- [ ] Push notifications (OneSignal free tier) — user-chosen time
- [ ] "Welcome back" message (no guilt) for missed days

### Still Point (Meditation)
- [x] 6 meditation cards (text only, no audio)
- [ ] Write scripts for 8-12 meditations (5 elemental + 3-5 situational)
- [ ] Record audio (AI voice via ElevenLabs or similar for MVP)
- [ ] Minimalist audio player UI (timer, pause, ±15s)
- [ ] Recommendation logic (weakest element + current day + Oracle themes)
- [ ] Session complete rating (1-5) to feed recommendation engine

### Life Oracle (AI Chat)
- [x] Placeholder chat UI + static demo responses
- [ ] Wire to Claude API (POST /api/oracle/chat)
- [ ] System prompt injection: full chart data + life context
- [ ] Conversation history persistence (localStorage for MVP, Supabase later)
- [ ] Context summarization for long conversations (stay within token window)
- [ ] Rate limiting: 10 free messages/day (Phase 2)
- [ ] Pre-built deep-dive prompt templates (Career, Relationships, Timing, etc.)

### Blueprint Enhancements
- [ ] Luck Pillar timeline visualization (interactive, not just cards)
- [ ] "This Year for You" 流年 analysis section
- [ ] Dominant Ten God personality modifier displayed on persona card
- [ ] Season modifier description shown on Blueprint

### Auth & Infrastructure
- [ ] Email authentication (Clerk or NextAuth)
- [ ] Google login
- [ ] Apple login
- [ ] Supabase: user table, BaZi chart table, Oracle conversation table
- [ ] Migrate chart storage from localStorage to Supabase (on login)
- [ ] Social login

---

## Phase 3 — Growth & Monetization

- [ ] Compatibility analysis (two charts compared)
- [ ] Premium tier ($9.99/mo): unlimited Oracle, full Library, all meditations
- [ ] Paywall + Stripe integration
- [ ] Annual forecast PDF report generation
- [ ] Referral system ("Share your type, invite a friend")
- [ ] Share image generation (1080×1350 Instagram, 1080×1920 Stories)
- [ ] Deep link in share image → recipient creates own Blueprint
- [ ] Multi-language: Mandarin Chinese (priority)
- [ ] Zi Wei Dou Shu (紫微斗数) secondary chart system
- [ ] True solar time (birth location → longitude correction)
- [ ] Light mode
- [ ] WCAG 2.1 AA compliance audit

---

## Open Questions (from PRD §11)

- [ ] **BaZi library:** Use `lunar-javascript` npm or pure custom logic? Test first.
- [ ] **True solar time:** Skip for MVP, add in Phase 2 as "refine your chart" feature? → **Decision: skip for MVP** ✓
- [ ] **Meditation audio:** AI voice (ElevenLabs) vs. human voice actor? → Start with AI, upgrade with revenue.
- [ ] **Share image generation:** Server-side (Puppeteer) vs. client-side (html2canvas)?
- [ ] **Content licensing:** Verify all sacred text translations are public domain before Phase 2 launch.
- [ ] **Localization:** English-only MVP, but data model supports i18n from day one ✓

---

## Risks to watch

| Risk | Status |
|------|--------|
| BaZi calculation errors — cross-validate against reference tools | ⚠️ Not yet validated |
| Cultural sensitivity in sacred texts | ⚠️ Review needed before Phase 2 |
| AI hallucination in Oracle | Mitigated by structured chart context in system prompt |
| "Just another astrology app" perception | Addressed in copy — lead with uniqueness |
| Meditation audio cost | Plan: AI voice for MVP |
