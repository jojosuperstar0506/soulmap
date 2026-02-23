# SoulMap MVP — Product Requirements Document

**Version:** 1.0
**Author:** Max
**Date:** February 2026
**Status:** Pre-Development / Vibe Coding Ready

---

## 1. Vision & Positioning

SoulMap is the world's first cross-traditional life-guidance platform. It bridges Chinese metaphysical wisdom (BaZi / 八字) with global sacred texts to help people understand themselves, navigate decisions, and cultivate daily awareness — all powered by AI.

**Core thesis:** In the post-AI productivity era, humans need tools for *meaning*, not just *optimization*. SoulMap makes thousand-year-old wisdom accessible, personal, and actionable.

**One-line pitch:** "MBTI meets ancient wisdom — your cosmic personality blueprint, powered by the most systematically rigorous fate-calculation system ever developed."

**Target user (MVP):** English-speaking "Conscious Seekers" — people who've tried Co-Star or MBTI and found them shallow; curious about Eastern wisdom but intimidated by its complexity. Ages 22-38, spiritually curious, in a life transition (career change, relationship decision, quarter-life recalibration).

---

## 2. Product Overview

### 2.1 What It Does (High Level)

Users enter their birth date, birth time, and basic life context. SoulMap calculates their BaZi (Four Pillars of Destiny) chart and generates a visually rich, shareable **Soul Blueprint** — a persona-style profile (like MBTI's 16 types, but derived from Five Elements theory with far more depth and personalization). From there, users can explore five core experiences:

1. **Soul Blueprint** — Your elemental persona with visual identity, type name, and detailed breakdown
2. **Life Oracle (AI Chat)** — Ask an AI agent grounded in classical texts about career, love, timing, and life decisions
3. **Sacred Library** — Curated excerpts from world sacred texts (Tao Te Ching, Bible, Quran, Dhammapada, Meditations, etc.) matched to the user's current elemental state
4. **Daily Spark** — Gamified daily spiritual prompts and awareness exercises for mental health
5. **Still Point (Meditation)** — Guided meditation audio matched to elemental balance needs

### 2.2 What Makes It Different

- **BaZi-powered personalization** — not 12 zodiac signs, but ~518,400 unique chart configurations anchored in astronomical data
- **Cross-traditional wisdom** — first app to bridge Eastern metaphysics with global sacred texts
- **Classical text grounding** — AI interpretations reference 1,000+ years of texts (《子平真诠》《滴天髓》《三命通会》《穷通宝鉴》《渊海子平》etc.)
- **Not prediction, but guidance** — "understand your patterns" rather than "know your future"

---

## 3. User Flow (MVP)

### 3.1 Onboarding Flow

```
[Landing / Splash Screen]
    │
    ▼
[Step 1: Birth Information]
    - Date of birth (date picker, required)
    - Time of birth (time picker with 2-hour BaZi windows, required)
      └─ Helper: "Don't know exact time? Choose the closest 2-hour window"
      └─ Display the 12 shichen (时辰) with clock ranges:
         子时 23:00-01:00, 丑时 01:00-03:00, 寅时 03:00-05:00,
         卯时 05:00-07:00, 辰时 07:00-09:00, 巳时 09:00-11:00,
         午时 11:00-13:00, 未时 13:00-15:00, 申时 15:00-17:00,
         酉时 17:00-19:00, 戌时 19:00-21:00, 亥时 21:00-23:00
    - Birth location (optional, for true solar time correction)
    - Gender (required — affects Luck Pillar direction in BaZi)
    │
    ▼
[Step 2: Life Context]
    - "What do you do?" (free text or category selector: Student, Professional, Creative, Entrepreneur, Between Things, Other)
    - "Relationship status" (Single, Dating, In a Relationship, Married, It's Complicated, Prefer Not to Say)
    - "What's on your mind right now?" (optional free text — seeds the AI context)
    │
    ▼
[Generation Animation]
    - 3-5 second animated sequence:
      "Calculating your Four Pillars..."
      "Analyzing your Five Elements balance..."
      "Assembling your Soul Blueprint..."
    - Visual: elemental particles coalescing into a form
    │
    ▼
[Soul Blueprint Reveal]
    - Full-screen persona card with type name, visual, and summary
    - Swipe/scroll for detailed breakdown
    - Share button (generates image card for social)
    │
    ▼
[Main App — Tab Navigation]
    Tab 1: Blueprint (home — persona details)
    Tab 2: Oracle (AI chat)
    Tab 3: Library (sacred texts)
    Tab 4: Spark (daily prompts)
    Tab 5: Still Point (meditation)
```

### 3.2 Return User Flow

```
[App Open]
    │
    ├─ If Daily Spark not yet viewed → Show daily prompt card overlay
    │
    ▼
[Main App — Last active tab]
    - Blueprint persists
    - Oracle retains chat history
    - Library bookmarks preserved
    - Spark streak counter visible
```

---

## 4. Feature Specifications

### 4.1 Tab 1: Soul Blueprint (Home)

This is the hero feature — the "MBTI result page" equivalent that users screenshot and share.

#### 4.1.1 BaZi Calculation Engine

The app must calculate a complete BaZi (Four Pillars) chart from birth data. This is the computational backbone.

**Inputs:**
- Gregorian birth date → convert to Chinese solar calendar (干支 / gānzhī)
- Birth time → map to one of 12 two-hour periods (时辰)
- Gender → determines Luck Pillar (大运) direction (male yang year / female yin year = forward; reverse otherwise)
- Birth location (optional) → true solar time longitude correction

**Outputs (must calculate all of these):**
- **Four Pillars (四柱):** Year Pillar, Month Pillar, Day Pillar, Hour Pillar
  - Each pillar = 1 Heavenly Stem (天干) + 1 Earthly Branch (地支)
  - Heavenly Stems: 甲乙丙丁戊己庚辛壬癸 (10 total, cycling)
  - Earthly Branches: 子丑寅卯辰巳午未申酉戌亥 (12 total, cycling)
- **Day Master (日主 / 日干):** The Heavenly Stem of the Day Pillar — represents the self
- **Hidden Stems (藏干):** Each Earthly Branch contains 1-3 hidden Heavenly Stems
  - 子: 癸 | 丑: 己癸辛 | 寅: 甲丙戊 | 卯: 乙 | 辰: 戊乙癸 | 巳: 丙庚戊
  - 午: 丁己 | 未: 己丁乙 | 申: 庚壬戊 | 酉: 辛 | 戌: 戊辛丁 | 亥: 壬甲
- **Five Elements Balance (五行):** Count of Wood (木), Fire (火), Earth (土), Metal (金), Water (水) across all stems and branches
- **Ten Gods (十神):** Relationship of each stem to the Day Master
  - Same element same polarity = 比肩 (Friend)
  - Same element different polarity = 劫财 (Rob Wealth)
  - Day Master generates same polarity = 食神 (Eating God)
  - Day Master generates different polarity = 伤官 (Hurting Officer)
  - Generated by Day Master same polarity = 偏财 (Indirect Wealth)
  - Generated by Day Master different polarity = 正财 (Direct Wealth)
  - Controls Day Master same polarity = 七杀 (Seven Killings)
  - Controls Day Master different polarity = 正官 (Direct Officer)
  - Day Master controlled by same polarity = 偏印 (Indirect Seal)
  - Day Master controlled by different polarity = 正印 (Direct Seal)
- **Day Master Strength:** Assess if the Day Master is strong (旺), weak (弱), or balanced based on seasonal energy, supporting elements, and overall chart structure
- **Luck Pillars (大运):** 10-year periods derived from month pillar, progressing forward or backward based on gender + year polarity
- **Current Annual Pillar (流年):** The stem-branch of the current year and its interaction with the natal chart
- **Favorable Elements (喜用神):** Elements that balance the chart

**Calculation methodology references:**
- Month Pillar determined by solar terms (节气), NOT lunar calendar months
- Year changeover is at 立春 (Start of Spring), NOT Chinese New Year
- Day Pillar follows the continuous sexagenary cycle
- Hour Pillar stem derived from Day Stem using the 五鼠遁 rule

**Key implementation note for vibe coding:** Consider using an existing open-source BaZi calculation library (npm: `bazi-calculator`, Python: `bazi`, or port the algorithm from classical rules). The calculation is deterministic and well-documented — the soul of the app is in the *interpretation and presentation layer*, not in reimplementing calendar math.

#### 4.1.2 Elemental Persona System ("Soul Types")

Transform the BaZi output into a visually compelling persona system. This is where BaZi becomes as shareable as MBTI.

**Primary Type = Day Master Element + Polarity (10 base types):**

| Day Master | Element | English Name | Essence | Visual Archetype |
|------------|---------|-------------|---------|------------------|
| 甲 (Jiǎ) | Yang Wood | The Pioneer | Tall tree — growth, ambition, upward drive | A towering ancient tree with spreading canopy |
| 乙 (Yǐ) | Yin Wood | The Weaver | Vine/flower — flexible, graceful, adaptive | Flowing ivy with delicate blossoms |
| 丙 (Bǐng) | Yang Fire | The Radiant | Sun — warmth, visibility, leadership | A blazing sun over mountains |
| 丁 (Dīng) | Yin Fire | The Luminary | Candle/star — gentle light, insight, intimacy | A constellation of stars / candlelight |
| 戊 (Wù) | Yang Earth | The Mountain | Mountain — stability, reliability, immovable | A massive stone mountain with clouds |
| 己 (Jǐ) | Yin Earth | The Garden | Fertile soil — nurturing, receptive, transformative | A lush garden with rich dark soil |
| 庚 (Gēng) | Yang Metal | The Blade | Sword/axe — decisive, reforming, sharp | A gleaming sword or crystalline metal |
| 辛 (Xīn) | Yin Metal | The Jewel | Gem/jewelry — refined, precious, sensitive | A faceted gemstone catching light |
| 壬 (Rén) | Yang Water | The Ocean | Ocean/river — powerful, flowing, unstoppable | A vast ocean with deep currents |
| 癸 (Guǐ) | Yin Water | The Mist | Rain/dew — perceptive, nourishing, mysterious | Morning mist over a still lake |

**Secondary Modifiers (displayed as subtypes):**
- **Season born (月令):** Spring Wood / Summer Fire / Autumn Metal / Winter Water / Transitional Earth — affects Day Master strength
- **Dominant Ten God:** The most prominent Ten God relationship shapes personality expression (e.g., 食神 dominant = creative/expressive, 七杀 dominant = driven/pressured, 正印 dominant = scholarly/protected)
- **Five Elements Balance:** Visualized as a radar/pentagon chart showing relative strength of each element

**Persona Card Display (the shareable asset):**

```
┌─────────────────────────────────────┐
│                                     │
│   [ELEMENTAL VISUAL / ILLUSTRATION] │
│                                     │
│   ─── THE MIST ───                  │
│   癸水 · Guǐ Water                  │
│                                     │
│   "Still water runs deep.           │
│    You absorb everything,           │
│    reflecting the world             │
│    with quiet clarity."             │
│                                     │
│   Season: Summer Fire 巳月           │
│   Dominant: Seven Killings 七杀      │
│   Strength: Moderate                │
│                                     │
│   ┌─ Five Elements ──────────┐      │
│   │  🪵 Wood  ██░░░ 22%      │      │
│   │  🔥 Fire  ████░ 35%      │      │
│   │  🗿 Earth ██░░░ 18%      │      │
│   │  🪙 Metal █░░░░ 10%      │      │
│   │  💧 Water █░░░░ 15%      │      │
│   └──────────────────────────┘      │
│                                     │
│   [Share Blueprint]  [View Details] │
└─────────────────────────────────────┘
```

**Detail View (scroll below persona card):**

1. **"Who You Are"** — 2-3 paragraph personality description based on Day Master + Ten God structure. Written in warm, second-person voice. References classical text principles without jargon.

2. **"Your Elemental Balance"** — Interactive pentagon/radar chart of Five Elements. Tap each element for explanation of what it means in your life (e.g., "Your Fire is strong — you naturally attract attention, lead with warmth, but may burn out if unchecked").

3. **"Your Life Seasons"** — Timeline visualization of 大运 (10-year Luck Pillars) showing elemental shifts across life. Highlight current period. Each period gets a short interpretation (e.g., "2020-2030: 甲寅 Wood Luck — a period of growth, new beginnings, and building foundations").

4. **"This Year for You"** — Current 流年 (annual pillar) analysis. What elemental energy is active, how it interacts with the natal chart, key themes to watch.

5. **"Your Favorable Elements"** — What colors, directions, activities, and seasons support your chart balance. Practical, actionable (e.g., "Wear more green/blue, face East when making decisions, best creative hours are 5-7am 卯时").

6. **"Classical Roots"** — Brief section showing which classical text principles inform the reading, with actual Chinese text snippets and translations (e.g., 《滴天髓》: "癸水至弱，达于天津" — "Guǐ Water is the most gentle, reaching to the Heavenly Ford").

#### 4.1.3 Share Functionality

- Generate a static image card (1080×1350 for Instagram, 1080×1920 for Stories)
- Include: visual, type name, Five Elements bar, one-line description
- Watermark: "SoulMap — soulmap.app"
- Deep link embedded so recipients can create their own Blueprint

---

### 4.2 Tab 2: Life Oracle (AI Chat)

An AI agent that answers life questions through the lens of the user's BaZi chart + classical text wisdom.

#### 4.2.1 Chat Interface

- Standard chat UI (user messages right, AI left)
- Suggested starter questions at top:
  - "What career paths suit my chart?"
  - "Is this a good year for big changes?"
  - "What should I know about my love life?"
  - "How do I handle my current stress?"
  - "What does my chart say about money?"
- User can type any life question freely

#### 4.2.2 AI System Prompt Architecture

The AI agent must be configured with a system prompt that includes:

```
Role: You are SoulMap Oracle — a wise, warm life advisor who combines 
traditional Chinese metaphysics (BaZi/八字) with cross-cultural wisdom 
traditions. You speak in accessible English, avoiding excessive jargon, 
but can reference classical texts when relevant.

Context injected per user:
- Full BaZi chart data (four pillars, hidden stems, ten gods, elements)
- Day Master analysis (strength, favorable elements)
- Current Luck Pillar (大运) and Annual Pillar (流年)
- User's life context (occupation, relationship status, what's on their mind)

Interpretation guidelines:
- Ground readings in classical BaZi principles from 《子平真诠》《滴天髓》
  《穷通宝鉴》《三命通会》《渊海子平》
- Never make absolute predictions ("you WILL get promoted")
- Use pattern language ("your chart suggests...", "this period favors...")
- Reference Five Elements dynamics in practical terms
- When discussing timing, reference the current 大运 and 流年 interactions
- Cross-reference with relevant wisdom from other traditions when natural
- Always end with an actionable takeaway
- Tone: warm sage, not fortune teller. Think "wise older friend" not "mystical oracle"

Boundaries:
- Do not provide medical advice
- Do not encourage dependency on the system
- Acknowledge free will explicitly when making any directional suggestion
- If asked about something outside scope, redirect kindly
```

#### 4.2.3 Conversation Starters / Prompt Templates

Pre-built deep-dive prompts (accessible via a "+" or "Explore" button in chat):

- **Career:** "Based on my chart's element balance and current luck cycle, what types of work environments and roles would I thrive in right now?"
- **Relationships:** "What does my chart reveal about my relationship patterns? What kind of partner energy complements mine?"
- **Timing:** "Is this year favorable for [starting a business / moving / changing jobs]? What does the elemental interaction suggest?"
- **Challenges:** "I'm dealing with [user input]. What does my chart suggest about why this is happening now, and how to navigate it?"
- **Growth:** "What are my greatest strengths and blind spots according to my chart? Where should I focus my development?"

#### 4.2.4 Technical Notes

- Use Claude API (claude-sonnet-4-5-20250929 for MVP — balance of quality and cost)
- System prompt includes full BaZi chart data as structured JSON
- Conversation history maintained per session, summarized for context window efficiency
- Rate limit: MVP can start with 10 messages/day free, unlimited for premium (post-MVP)

---

### 4.3 Tab 3: Sacred Library

Curated excerpts from world sacred and philosophical texts, organized by theme and matched to the user's current elemental state.

#### 4.3.1 Content Structure

**Traditions to include (MVP — start with 6):**
1. **Daoism** — Tao Te Ching (道德经), Zhuangzi (庄子)
2. **Buddhism** — Dhammapada, Heart Sutra, selected sutras
3. **Stoicism** — Meditations (Marcus Aurelius), Letters (Seneca), Discerta (Epictetus)
4. **Christianity** — Psalms, Proverbs, Ecclesiastes, Sermon on the Mount
5. **Islam** — Selected Quran verses (with sensitivity/respect), Rumi's Masnavi
6. **Judaism** — Proverbs, Ecclesiastes, Pirkei Avot

**Content per excerpt:**
- Original text (in original language where feasible — Chinese, Greek, Arabic, Hebrew, Pali)
- English translation
- 1-2 notable sage interpretations (e.g., Wang Bi's commentary on Tao Te Ching, Augustine on Psalms, Al-Ghazali on Quran, Thich Nhat Hanh on Heart Sutra)
- "Why this speaks to you now" — AI-generated connection between the text and the user's current BaZi elemental state

#### 4.3.2 Display & Navigation

- **Browse by Tradition:** Icon grid (6 traditions), tap to see curated excerpts
- **Browse by Theme:** Life themes that cut across traditions:
  - Uncertainty & Change
  - Love & Connection
  - Purpose & Calling
  - Suffering & Growth
  - Stillness & Peace
  - Wealth & Abundance
  - Death & Impermanence
  - Courage & Fear
- **"For You" Feed:** AI-curated excerpts matched to user's current elemental state and what they've been asking the Oracle. This is the default view.
- **Bookmarks:** Save excerpts to personal collection
- **Daily Text:** One excerpt surfaces in the Daily Spark (Tab 4)

#### 4.3.3 Content Sourcing (MVP)

For MVP, curate 20-30 excerpts per tradition (120-180 total). Each excerpt should be:
- Public domain or properly licensed
- 50-300 words (readable in under 2 minutes)
- Self-contained (no required context to understand)
- Thematically tagged for matching

Store as structured JSON/markdown files in the codebase (no CMS needed for MVP).

---

### 4.4 Tab 4: Daily Spark

Gamified daily spiritual prompts to build a habit of reflection and awareness.

#### 4.4.1 Daily Experience

Each day, the user receives ONE prompt consisting of:

1. **Sacred Text of the Day** — An excerpt from the Library, matched to the day's elemental energy (the current day's 天干地支)
2. **Reflection Prompt** — A question to sit with (e.g., "What are you holding onto that no longer serves you?", "Who made you feel seen today?", "What would you do if you weren't afraid?")
3. **Micro-Practice** — A 1-3 minute exercise:
   - Breathwork (e.g., "Take 5 breaths, counting to 4 on each inhale and exhale")
   - Gratitude (e.g., "Name 3 things you're grateful for, one for each: body, mind, spirit")
   - Awareness (e.g., "Notice 5 things you can see, 4 you can touch, 3 you can hear")
   - Elemental balancing (e.g., if user's chart is Fire-heavy: "Spend 2 minutes near water — a fountain, a bath, even a glass of water held with intention")
   - Journaling (e.g., "Write one sentence about what you want to release today")

#### 4.4.2 Gamification

- **Streak counter:** "🔥 7 days of awareness" — consecutive days engaging with Daily Spark
- **Element collector:** Each day's spark corresponds to one of the Five Elements; collect all 5 in a week for a "Harmony" badge
- **Monthly review:** At month's end, show a summary: "This month you reflected 22 times. Your most active element was Water 💧. Here's what that means for your growth..."
- **Gentle nudge, not guilt:** If user misses a day, no punishment. "Welcome back. Today's spark was waiting for you."

#### 4.4.3 Push Notifications

- Default: One notification per day at user-chosen time (set during onboarding or settings)
- Message format: Brief, poetic, intriguing. E.g., "Today's element is Metal 🪙 — a day for clarity and letting go. Your spark is ready."
- User can disable or change cadence

---

### 4.5 Tab 5: Still Point (Meditation)

Guided meditation audio matched to the user's elemental balance needs.

#### 4.5.1 Meditation Library (MVP)

Start with 8-12 guided meditations, ~5-15 minutes each:

**By Element (5 core meditations):**
- 🪵 **Wood Meditation** — Growth & vision. Visualization of roots and rising energy. For when you need clarity of direction.
- 🔥 **Fire Meditation** — Warmth & connection. Heart-centered, warmth visualization. For when you feel disconnected or cold.
- 🗿 **Earth Meditation** — Grounding & stability. Body scan, earth connection. For when you feel unmoored or anxious.
- 🪙 **Metal Meditation** — Release & clarity. Breath-focused, letting go. For when you feel cluttered or indecisive.
- 💧 **Water Meditation** — Flow & surrender. Fluid movement visualization. For when you feel stuck or rigid.

**By Need (3-5 situational meditations):**
- **Before a Big Decision** — 10 min, combines grounding (Earth) with clarity (Metal)
- **After a Hard Day** — 8 min, combines release (Metal) with warmth (Fire)
- **Morning Intention** — 5 min, combines growth (Wood) with grounding (Earth)
- **Sleep Wind-Down** — 15 min, combines flow (Water) with stillness (Earth)

#### 4.5.2 Recommendation Logic

The app recommends meditations based on:
1. User's weakest element (chart deficit) — "Your chart shows low Metal. This meditation helps cultivate clarity."
2. Current day/year energy — "Today is a Metal day. Lean into it with this practice."
3. Recent Oracle chat themes — If user's been asking about stress, suggest grounding meditations.

#### 4.5.3 Audio Production (MVP)

- For MVP, use AI-generated voice or commission 1 voice actor for a consistent, warm, gender-neutral tone
- Background: ambient nature sounds matched to element (rustling leaves for Wood, crackling fire for Fire, rain for Water, wind for Metal, deep hum for Earth)
- Format: MP3, streamed or bundled in app

#### 4.5.4 Player UI

- Minimalist full-screen player with elemental background animation (subtle, non-distracting)
- Timer display
- Pause / skip 15s / replay 15s controls
- Session complete screen: "How do you feel?" (optional 1-5 rating to feed recommendation engine)

---

## 5. Technical Architecture

### 5.1 Stack (Recommended for Vibe Coding)

```
Frontend:        Next.js 14+ (App Router) with TypeScript
Styling:         Tailwind CSS + Framer Motion (animations)
UI Components:   shadcn/ui as base
State:           React Context or Zustand (lightweight)
AI:              Claude API (claude-sonnet-4-5-20250929)
Auth:            Clerk or NextAuth (MVP: email + Google)
Database:        Supabase (Postgres + auth + real-time)
Storage:         Supabase Storage (meditation audio, images)
Hosting:         Vercel
Analytics:       PostHog or Mixpanel (free tier)
Push:            OneSignal (free tier for MVP)
```

### 5.2 Data Models

```typescript
// Core user profile
interface User {
  id: string;
  email: string;
  name?: string;
  birthDate: string;           // ISO date
  birthTime: string;           // HH:MM or shichen enum
  birthLocation?: {
    lat: number;
    lng: number;
    timezone: string;
  };
  gender: 'male' | 'female';
  occupation?: string;
  relationshipStatus?: string;
  currentConcern?: string;     // "What's on your mind?"
  createdAt: Date;
  updatedAt: Date;
}

// Calculated BaZi chart (stored after first calculation)
interface BaZiChart {
  userId: string;

  // Four Pillars
  yearPillar: { stem: HeavenlyStem; branch: EarthlyBranch; };
  monthPillar: { stem: HeavenlyStem; branch: EarthlyBranch; };
  dayPillar: { stem: HeavenlyStem; branch: EarthlyBranch; };
  hourPillar: { stem: HeavenlyStem; branch: EarthlyBranch; };

  // Day Master
  dayMaster: HeavenlyStem;
  dayMasterElement: Element;
  dayMasterPolarity: 'yin' | 'yang';
  dayMasterStrength: 'strong' | 'weak' | 'balanced';

  // Hidden Stems per branch
  hiddenStems: {
    year: HeavenlyStem[];
    month: HeavenlyStem[];
    day: HeavenlyStem[];
    hour: HeavenlyStem[];
  };

  // Ten Gods for each position
  tenGods: {
    yearStem: TenGod;
    monthStem: TenGod;
    hourStem: TenGod;
    // + hidden stem ten gods
  };

  // Five Elements count and percentages
  elementBalance: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };

  // Favorable elements
  favorableElements: Element[];
  unfavorableElements: Element[];

  // Luck Pillars
  luckPillars: {
    startAge: number;
    stem: HeavenlyStem;
    branch: EarthlyBranch;
    startYear: number;
    endYear: number;
  }[];

  // Soul Type (derived)
  soulType: {
    primaryType: string;       // e.g., "The Mist"
    dayMasterChinese: string;  // e.g., "癸水"
    seasonModifier: string;    // e.g., "Summer Fire"
    dominantTenGod: TenGod;
    tagline: string;           // e.g., "Still water runs deep..."
  };
}

// Enums
type HeavenlyStem = '甲'|'乙'|'丙'|'丁'|'戊'|'己'|'庚'|'辛'|'壬'|'癸';
type EarthlyBranch = '子'|'丑'|'寅'|'卯'|'辰'|'巳'|'午'|'未'|'申'|'酉'|'戌'|'亥';
type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
type TenGod = '比肩'|'劫财'|'食神'|'伤官'|'偏财'|'正财'|'七杀'|'正官'|'偏印'|'正印';

// Oracle chat
interface OracleConversation {
  id: string;
  userId: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
  createdAt: Date;
}

// Sacred text excerpt
interface SacredText {
  id: string;
  tradition: 'daoism'|'buddhism'|'stoicism'|'christianity'|'islam'|'judaism';
  title: string;                // e.g., "Tao Te Ching, Chapter 8"
  originalText?: string;        // Original language
  englishText: string;          // Translation
  sageInterpretations: {
    sageName: string;           // e.g., "Wang Bi", "Thich Nhat Hanh"
    interpretation: string;
  }[];
  themes: string[];             // Tags for matching
  relatedElements: Element[];   // Which elements this text speaks to
}

// Daily Spark
interface DailySpark {
  id: string;
  date: string;               // ISO date
  sacredTextId: string;        // Reference to day's text
  reflectionPrompt: string;
  microPractice: {
    type: 'breathwork'|'gratitude'|'awareness'|'elemental'|'journaling';
    instructions: string;
    durationMinutes: number;
  };
  element: Element;            // Day's element
}

// User engagement tracking
interface UserSparkHistory {
  userId: string;
  date: string;
  completed: boolean;
  streak: number;
  elementsCaptured: Element[];  // For gamification
}

// Meditation
interface Meditation {
  id: string;
  title: string;
  description: string;
  element: Element;
  category: 'elemental' | 'situational';
  durationMinutes: number;
  audioUrl: string;
  backgroundType: string;     // ambient sound type
}
```

### 5.3 API Routes (Next.js App Router)

```
POST   /api/bazi/calculate        — Calculate chart from birth data
GET    /api/bazi/chart/:userId    — Retrieve stored chart
POST   /api/oracle/chat           — Send message to AI Oracle
GET    /api/oracle/history        — Get chat history
GET    /api/library/texts         — List sacred texts (filterable)
GET    /api/library/texts/:id     — Get single text with interpretations
GET    /api/library/for-you       — AI-curated texts for user
GET    /api/spark/today           — Get today's daily spark
POST   /api/spark/complete        — Mark today's spark as done
GET    /api/spark/streak          — Get current streak data
GET    /api/meditations           — List available meditations
GET    /api/meditations/recommended — Personalized recommendations
POST   /api/share/blueprint       — Generate share image
```

### 5.4 Key Libraries & Dependencies

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "@anthropic-ai/sdk": "latest",
    "@supabase/supabase-js": "latest",
    "framer-motion": "latest",
    "recharts": "latest",
    "date-fns": "latest",
    "lunar-javascript": "latest",
    "html-to-image": "latest",
    "zustand": "latest"
  }
}
```

Note on BaZi calculation: The `lunar-javascript` npm package (or similar Chinese calendar library) handles Gregorian-to-干支 conversion. You may need to supplement it with custom logic for:
- True solar time correction
- Hidden stems mapping (static lookup table)
- Ten Gods calculation (comparison logic against Day Master)
- Luck Pillar generation (from Month Pillar, directional based on gender+year polarity)

---

## 6. Design Direction

### 6.1 Visual Identity

- **Color palette:** Dark mode primary (deep navy/charcoal #0F172A), with elemental accent colors:
  - Wood: Emerald green (#10B981)
  - Fire: Warm amber/orange (#F59E0B)
  - Earth: Rich ochre/brown (#92400E)
  - Metal: Silver/platinum (#94A3B8)
  - Water: Deep blue (#3B82F6)
- **Typography:** Clean, modern serif for headings (e.g., Playfair Display), sans-serif for body (Inter)
- **Illustrations:** Generative/particle-based elemental visuals — not cartoonish, not hyper-realistic. Think abstract natural forms rendered in the elemental color.
- **Overall feel:** Premium, contemplative, modern. Not "mystical crystal shop." Not "tech startup dashboard." Something in between — like a beautifully designed journal app meets an astronomy app.

### 6.2 Interaction Principles

- **Reveal, don't overwhelm:** Information unfolds as user scrolls/taps. Never dump the full chart at once.
- **Animate meaningfully:** Elemental transitions, particle effects that match the element. Fire crackles, water flows, wood grows.
- **Respectful of traditions:** No cultural appropriation vibes. Present sacred texts with author, tradition, and context. Show original languages alongside translations.
- **Accessibility:** Full WCAG 2.1 AA compliance. Dark mode by default with light mode option. Meditation audio has transcript option.

---

## 7. Content Requirements (Pre-Launch)

### 7.1 Must-Have Content Before MVP Launch

| Content Type | Quantity | Notes |
|---|---|---|
| Soul Type descriptions | 10 | One per Day Master. ~300-500 words each, second-person voice |
| Ten God personality modifiers | 10 | Short paragraphs modifying the base type |
| Season modifier descriptions | 5 | How birth season affects expression |
| Sacred text excerpts | 120-180 | ~20-30 per tradition, properly attributed |
| Sage interpretations | 60-100 | 1-2 per key excerpt |
| Daily reflection prompts | 90 | 3 months of unique prompts |
| Micro-practice scripts | 30 | Rotating set |
| Meditation scripts | 8-12 | Mix of elemental and situational |
| Meditation audio files | 8-12 | Recorded/generated from scripts |
| Classical text citations | 20-30 | Key BaZi principles in Chinese + English for the Blueprint "Classical Roots" section |

### 7.2 Content That Can Be AI-Generated at Runtime

- "Why this text speaks to you now" (Library personalization)
- Oracle chat responses
- "For You" feed curation logic
- Annual/current period interpretations (combining chart data with current 流年)
- Meditation recommendations

---

## 8. MVP Scope & Phasing

### Phase 1 — Core MVP (Build This First)

**Must ship:**
- [x] Onboarding flow (birth data input)
- [x] BaZi calculation engine (four pillars, hidden stems, ten gods, element balance)
- [x] Soul Blueprint page with persona card + Five Elements chart
- [x] Soul Type descriptions for all 10 Day Masters
- [x] Share image generation
- [x] Life Oracle AI chat (Claude API) with chart context
- [x] Basic tab navigation skeleton

**Can be simplified:**
- Oracle: 5 free messages total (no daily limit tracking needed)
- Library: Static list of 30 excerpts (no AI matching yet)
- Spark: Static list of 30 prompts (no gamification yet)
- Meditation: Link to 3-4 audio files (no recommendation engine)
- Auth: Email-only (no social login)
- No push notifications
- No Luck Pillar timeline visualization (just text)

### Phase 2 — Engagement Layer

- Full Sacred Library (120+ texts) with tradition/theme browsing
- Daily Spark gamification (streaks, element collector)
- Meditation recommendation engine
- Push notifications for Daily Spark
- Luck Pillar timeline visualization
- "For You" AI-curated Library feed
- Social login (Google, Apple)

### Phase 3 — Growth & Monetization

- Compatibility analysis (two charts compared)
- Premium tier ($9.99/mo): unlimited Oracle, full Library, all meditations
- Annual forecast report (PDF generation)
- Referral system ("Share your type, invite a friend")
- Multi-language (Mandarin Chinese first priority)
- Zi Wei Dou Shu (紫微斗数) integration as secondary chart system

---

## 9. Success Metrics (MVP)

| Metric | Target (Month 1) | Target (Month 3) |
|---|---|---|
| Signups | 500 | 3,000 |
| Blueprint completion rate | 80% of signups | 85% |
| Blueprint shared | 20% of completions | 30% |
| Oracle messages sent | 3+ per user | 5+ per user |
| Daily Spark engagement | 15% DAU | 25% DAU |
| 7-day retention | 25% | 35% |
| 30-day retention | 10% | 20% |

**North star metric:** Blueprint share rate — this is the viral loop. If people screenshot and share their Soul Type, organic growth follows.

---

## 10. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| BaZi calculation errors undermine trust | Cross-validate against 2+ existing calculators (八字算命 apps); include "report an issue" in Blueprint |
| Cultural sensitivity with sacred texts | Consult advisors from each tradition; present texts with full attribution and respect; never mix traditions carelessly |
| AI hallucination in Oracle | Ground system prompt heavily in structured chart data; add disclaimer "This is for reflection, not prediction" |
| "This is just another astrology app" perception | Lead with BaZi uniqueness (astronomical anchoring, 518K+ combinations, 1000-year textual tradition); never compare to horoscopes |
| Low retention after Blueprint generation | Daily Spark habit loop; Oracle as ongoing relationship; "This Year for You" updates with changing 流年 |
| Meditation audio production cost | Start with AI-generated voice (ElevenLabs/similar); upgrade to human voice actor with revenue |

---

## 11. Open Questions for Development

1. **BaZi library choice:** Build from scratch using calendar conversion + lookup tables, or integrate existing open-source library? Test `lunar-javascript` npm package capabilities first.
2. **True solar time:** How important for MVP? Adds complexity. Could launch without it and add in Phase 2 with a "refine your chart" feature.
3. **Meditation audio:** AI voice (fast, cheap) or human voice actor (warm, premium feel)? Could A/B test.
4. **Share image generation:** Server-side (html-to-image / Puppeteer) or client-side (html2canvas)? Server-side is more reliable for consistent output.
5. **Content licensing:** Are all sacred text translations in public domain? Need to verify per translation used.
6. **Localization strategy:** English-only MVP, but data model should support i18n from day one (Chinese characters already embedded in chart data).

---

## Appendix A: BaZi Quick Reference for Developers

### Heavenly Stems (天干) — Five Elements Mapping

| Stem | Pinyin | Element | Polarity |
|------|--------|---------|----------|
| 甲 | Jiǎ | Wood | Yang |
| 乙 | Yǐ | Wood | Yin |
| 丙 | Bǐng | Fire | Yang |
| 丁 | Dīng | Fire | Yin |
| 戊 | Wù | Earth | Yang |
| 己 | Jǐ | Earth | Yin |
| 庚 | Gēng | Metal | Yang |
| 辛 | Xīn | Metal | Yin |
| 壬 | Rén | Water | Yang |
| 癸 | Guǐ | Water | Yin |

### Earthly Branches (地支) — Elements & Hidden Stems

| Branch | Pinyin | Element | Hidden Stems |
|--------|--------|---------|-------------|
| 子 | Zǐ | Water | 癸 |
| 丑 | Chǒu | Earth | 己, 癸, 辛 |
| 寅 | Yín | Wood | 甲, 丙, 戊 |
| 卯 | Mǎo | Wood | 乙 |
| 辰 | Chén | Earth | 戊, 乙, 癸 |
| 巳 | Sì | Fire | 丙, 庚, 戊 |
| 午 | Wǔ | Fire | 丁, 己 |
| 未 | Wèi | Earth | 己, 丁, 乙 |
| 申 | Shēn | Metal | 庚, 壬, 戊 |
| 酉 | Yǒu | Metal | 辛 |
| 戌 | Xū | Earth | 戊, 辛, 丁 |
| 亥 | Hài | Water | 壬, 甲 |

### Ten Gods (十神) Derivation

Determined by comparing each stem's element to the Day Master's element + polarity:

| Relationship | Same Polarity | Different Polarity |
|---|---|---|
| Same element | 比肩 (Companion) | 劫财 (Rob Wealth) |
| Day Master produces | 食神 (Eating God) | 伤官 (Hurting Officer) |
| Produces Day Master | 偏印 (Indirect Seal) | 正印 (Direct Seal) |
| Day Master controls | 偏财 (Indirect Wealth) | 正财 (Direct Wealth) |
| Controls Day Master | 七杀 (Seven Killings) | 正官 (Direct Officer) |

### Five Elements Cycle

```
Generating (生): Wood → Fire → Earth → Metal → Water → Wood
Controlling (克): Wood → Earth → Water → Fire → Metal → Wood
```

---

## Appendix B: Example — Jo's Chart Mapped to Soul Type

**Birth data:** 1998-05-06, 14:45 (未时), Female

**Calculated chart:**
- Year: 戊寅 (Yang Earth / Tiger)
- Month: 丁巳 (Yin Fire / Snake)
- Day: 癸丑 (Yin Water / Ox) ← Day Master = 癸 Guǐ Water
- Hour: 己未 (Yin Earth / Goat)

**Soul Type: "The Mist" (癸水)**

> *"You are morning dew on a still lake — quiet on the surface, endlessly deep within. Yin Water doesn't rush; it seeps, absorbs, and reflects. You understand others before they understand themselves, often sensing moods and patterns that no one else notices.*
>
> *Born in the heart of summer (巳月, Snake month — peak Fire season), your gentle water nature faces an intense environment. Fire surrounds you: in your month (丁巳), in the hidden stems of your birth season, even in your year's branch (寅 carries hidden Fire). This isn't a weakness — it's your defining tension. Like a cool spring discovered in a scorching desert, you are valued precisely because you bring what others lack.*
>
> *Your chart's dominant presence of 七杀 (Seven Killings) — Earth and authority energy pressing on your Water — means you've likely felt external pressure or high expectations from a young age. Seven Killings demands performance, discipline, resilience. For a gentle 癸 Day Master, this creates a person who appears calm and accommodating but possesses remarkable inner steel."*

**Five Elements Balance:**
- Wood: 15% (乙 hidden in 丑 and 未)
- Fire: 32% (丁 stem + 巳 branch + hidden 丙)
- Earth: 30% (戊 + 己 stems + 丑/未 branches)
- Metal: 8% (hidden 庚/辛 in 巳/丑)
- Water: 15% (癸 Day Master + hidden 癸)

**Favorable elements:** Metal (生 Water), Water (support self)
**Unfavorable:** Earth (克 Water too heavily), Fire (excessive, draining)

---

*End of PRD — Version 1.0*
*Ready for vibe coding. Start with Phase 1. Ship the Blueprint.*
