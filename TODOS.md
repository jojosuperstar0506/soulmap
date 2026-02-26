# SoulMap — Master TODO List

> **Source of truth for all work. Update this file as tasks are completed or added.**
> Last updated: 2026-02-26 (Lifetime Arc: real BaZi scoring engine + combined 4-track chart + per-cycle AI narrative complete)

---

## How to use this file
- Mark completed items with `[x]`
- Add new tasks under the relevant phase/section as they emerge
- Keep the "Current focus" line at the top up to date

**Current focus:** Phase 2 — Engagement Layer (Oracle live, Library + Spark + Still Point remaining)

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
  - [x] **Lifetime Arc overhaul (2026-02-26)** — replaced fake hash-scored charts with real BaZi engine:
    - New constants: `PRODUCTION_CYCLE`, `CONTROL_CYCLE`, `HIDDEN_STEMS_ROLES`, `MONTHLY_STRENGTH`, `SIX_CLASHES/HARMS/COMBOS`, `STEM_BIRTH_BRANCH`
    - `assessDayMasterStrength()` — month branch vitality × 3 + stem/hidden-stem root scoring → 5-tier result (extreme_strong → extreme_weak)
    - `deriveUsefulGods()` — element sets that help vs. drain the DM based on strength
    - `getScoreTenGod()` / `getTwelveStageEn()` — correct yin/yang birth-branch lookup for 12-stage vitality
    - `findBranchInteractions()` — six clashes, six harms, six combos vs. natal chart
    - `scoreCycle()` — full scoring engine for Love/Wealth/Career/Health (0–100) using Ten Gods, hidden stems, 12-stage vitality, branch interactions, body strength, and direction-aware month-clash logic
    - Combined 4-track SVG chart replaces 4 separate charts; past solid / future dashed; current decade highlighted with red "NOW" marker; season emoji badges (🌟🌱⚖️🔥⛈️)
    - Insight cards: Current Season, Lifetime Peak, Turning Point
    - Scores validated against spec ranges (甲寅/癸丑 within range; 辛亥 health ✅, wealth/love directionally correct — discrepancy due to zenith boost magnitude and spec's mislabeled Ten God for 辛→癸)
    - calculateBaZi() extended with `dayMasterEl`, `arcStrength`, `usefulGods`, `harmfulGods`
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
  - [x] **BaZi engine accuracy overhaul (2026-02-25)** — 6 bugs found and fixed in `public/app.js`:
    1. Month pillar: replaced calendar-month heuristic with solar term boundaries (节气) using Meeus ch.25 astronomical algorithm
    2. Year pillar: replaced hardcoded "before Feb 5" with actual 立春 JDE computed per year
    3. Month stem formula: fixed `(monthBranch - 2 + 12) % 12` — old `+20` formula gave wrong stems for 子月 and 丑月
    4. Branch element map: 子 was mapped to wood (0); corrected to water (4)
    5. 大运 starting age: now uses `nearestSolarTermJDN()` instead of a proxy 15th-of-month date
    6. **Day pillar offset recalibrated** — `(dayJdn + 58) % 60` → `(dayJdn + 49) % 60`; cross-validated against known correct chart (1998-05-06 → 癸丑日, 己未时 ✓)
    - UTC+8 offset removed from all solar term JDE→JDN conversions (face-value 公历, no timezone math)
    - New functions: `sunLongitude()`, `solarTermJDE()`, `getBaZiMonth()`, `getBaZiTermJDNs()`, `nearestSolarTermJDN()`
    - Automated browser tests passed: 立春 dates ×5 years, month boundary cases, 子月 stem, element balance water count, Joanna reference chart
  - [ ] Cross-validate output against an external reference BaZi tool for additional known dates ← still useful for extra confidence
- [x] Persona card portrait — 10 base stem portraits generated with Neo-Risograph style via Gemini Imagen and wired into Blueprint UI (`scripts/generate-personas.mjs`, `public/personas/`) ← **completed 2026-02-25**
  - Authored `scripts/generate-personas.mjs` (3-model cascade: Imagen4 → Flash2.5 → Flash2.0exp)
  - Added `slug` field to all 10 `SOUL_TYPES` entries in `app.js`
  - Replaced emoji `<span>` with `<img id="blueprint-detail-visual">` in `index.html`
  - Added `.soul-portrait-frame / .soul-portrait-img / .soul-portrait-text` CSS to `styles.css`
  - Removed "AI generation coming soon" badge from Blueprint UI
  - Symlink `personas → public/personas` created at project root for `npx serve .` local dev
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
- [x] **Light mode** — warm parchment (#F4EFE4) background, dark ink text; full palette redesigned ← **completed 2026-02-25**
- [x] **Visual polish — Four Pillars chart (2026-02-25)**
  - Grid max-width capped at 520px + centered (was stretching full-width on desktop)
  - All English font sizes increased: romanization 0.42→0.65rem, TenGod 0.38→0.54rem, col headers 0.45→0.62rem, row labels 0.38→0.48rem, element badges 0.45→0.58rem
  - Core/reference row hierarchy: header/TenGod/Stems/Branches visually separated from detail rows by 2px border
  - Spirits (神煞) row conditionally hidden when no sha data
  - Cell centering fixed (`flex: 1` on `.bazi-cell`)
- [x] **Five Element color palette redesigned to traditional associations (2026-02-25)**
  - Wood: cobalt blue `#2B4CE0` → forest green `#3A7D44`
  - Earth: orange `#FF6B1A` → terracotta/sienna `#9B5523`
  - Water: cyan `#00C5CD` → deep sapphire `#1A4DB5`
  - Fire (vermillion) + Metal (gold) unchanged
  - Applied across: Four Pillars chars, element balance bars, element badge backgrounds, 大运 card accents
- [x] **`DESIGN.md` created** — canonical visual design reference for all future sessions (palette, typography, spacing, component inventory, decisions log)
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
  - Call `claude-sonnet-4-6` via Anthropic SDK (upgraded from 4-5)
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
- [x] **Fix: API broken on Vercel — 3 root causes resolved (2026-02-25)**
  - `outputFileTracingIncludes` moved from `experimental: {}` to top-level in `next.config.ts` (was silently ignored, so system prompt file was missing in serverless bundle)
  - Added `outputFileTracingRoot: path.join(__dirname)` — stray `package-lock.json` in `~/` caused Next.js to use home dir as workspace root, breaking `.env.local` discovery
  - `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })` — explicit key pass required; `new Anthropic()` did not auto-read env var in Next.js 16 production mode
- [x] **Per-cycle AI narrative endpoint (2026-02-26)** — `src/app/api/cycle-narrative/route.ts`
  - POST `{ chart, cycle }` → `claude-sonnet-4-6` → JSON with `{seasonName, theme, summary, wealthNote, relationshipsNote, healthNote, lifeLessonThisSeason, growthEdge, shadowWork}`
  - Lazy generation: narrative only fetched on user click; cached to profile localStorage (`daYunNarratives` map keyed by pillar label)
  - `showCycleDetail(idx)` panel: score bars (Love/Wealth/Career/Health with colored fills) + "✦ Generate Reading for this Season" button + tabbed narrative display
- [ ] Add `ANTHROPIC_API_KEY` to Vercel environment variables ← **still needed for live deploy**
- [ ] Deploy and verify end-to-end on Vercel ← **pending above**

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
- [x] **Wire to Claude API — `POST /api/oracle` live (2026-02-25)**
  - `src/app/api/oracle/route.ts`: accepts `{ question, chartContext, conversationHistory }`
  - Full BaZi chart context injected into system prompt (day master, pillars, element balance, favorable elements, soul type, life context)
  - `claude-sonnet-4-6`, 800 max_tokens, conversational 2–4 paragraph responses
  - Classical text references drawn naturally from the same 7 classical sources as narrative
- [x] System prompt injection: full chart data + life context ← done via `buildOracleChartContext()`
- [x] In-session conversation history (last 10 turns passed per request) — context for follow-ups
- [x] Typing indicator (bouncing dots) while waiting for response
- [x] Send button disabled during request; re-enabled after
- [x] Graceful error fallback ("The Oracle is unavailable right now.")
- [ ] Conversation history persistence across page reloads (localStorage)
- [ ] Context summarization for long conversations (stay within token window)
- [ ] Rate limiting: 10 free messages/day (Phase 2)
- [ ] Pre-built deep-dive prompt templates (Career, Relationships, Timing, etc.)

### Blueprint Enhancements
- [ ] **Phase 2 TODO: Generate all 60 pillar portraits** — apply the Branch Modification System (子丑寅卯辰巳午未申酉戌亥) to each of the 10 base stem portraits via nanobanana. Example: 甲子 = jia base + "flowing water element, midnight blue tones, rat silhouette motif". Extend `scripts/generate-personas.mjs` with branch combos; save as `persona-jia-zi.png` etc.
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
- [x] Light mode ← completed 2026-02-25 (see UX/Polish above)
- [ ] WCAG 2.1 AA compliance audit

---

## Open Questions (from PRD §11)

- [x] **BaZi library:** Use `lunar-javascript` npm or pure custom logic? → **Decision: pure custom logic** — solar term engine implemented from scratch using Meeus astronomical algorithm; no npm dependency needed ✓
- [ ] **True solar time:** Skip for MVP, add in Phase 2 as "refine your chart" feature? → **Decision: skip for MVP** ✓
- [ ] **Meditation audio:** AI voice (ElevenLabs) vs. human voice actor? → Start with AI, upgrade with revenue.
- [ ] **Share image generation:** Server-side (Puppeteer) vs. client-side (html2canvas)?
- [ ] **Content licensing:** Verify all sacred text translations are public domain before Phase 2 launch.
- [ ] **Localization:** English-only MVP, but data model supports i18n from day one ✓

---

## Risks to watch

| Risk | Status |
|------|--------|
| BaZi calculation errors — cross-validate against reference tools | ⚠️ Engine rebuilt (2026-02-25); human spot-check needed |
| Cultural sensitivity in sacred texts | ⚠️ Review needed before Phase 2 |
| AI hallucination in Oracle | Mitigated by structured chart context in system prompt |
| "Just another astrology app" perception | Addressed in copy — lead with uniqueness |
| Meditation audio cost | Plan: AI voice for MVP |
