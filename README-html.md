# SoulMap — HTML MVP

A standalone **HTML/CSS/JS** version of [SoulMap](https://github.com/jojosuperstar0506/soulmap): a life decision-making tool that bridges Chinese BaZi (八字) with global sacred texts.

## How to run

Open `index.html` in a browser (double-click or run a local server):

```bash
cd soulmap
# Option 1: open directly
open index.html

# Option 2: simple HTTP server (avoids some CORS if you add more features later)
npx serve .
# or: python3 -m http.server 8000
```

Then go to **http://localhost:3000** (or the URL shown) if using a server, or use the file URL.

## What’s included

- **Landing** — Intro and “Discover Your Blueprint”
- **Onboarding**
  - Step 1: Birth date, time (12 时辰 / 2-hour windows), gender
  - Step 2: Life context (occupation, relationship, what’s on your mind) — optional
- **Generation** — Short “Calculating…” animation
- **Soul Blueprint** — Persona card with one of 10 Soul Types (Day Master), Five Elements bar chart, share
- **Main app (5 tabs)**
  - **Blueprint** — Full persona and “Who You Are” / “Favorable Elements”
  - **Oracle** — Chat UI with suggested questions (placeholder replies; no real AI)
  - **Library** — Sacred text excerpts (Daoism, Stoicism, Buddhism)
  - **Daily Spark** — One prompt + micro-practice per day, streak counter (localStorage)
  - **Still Point** — Meditation list by element (no audio in this build)

## BaZi in this build

- **Four Pillars** from birth date + 时辰: year (立春-adjusted), month (simplified 节气), day (JDN-based 六十甲子), hour (五鼠遁).
- **Day Master** = day pillar stem → one of 10 Soul Types (The Pioneer, The Weaver, …).
- **Five Elements** balance from stems + branches (simplified counts).

For production you’d want a full BaZi library (e.g. solar terms, hidden stems, Ten Gods). This MVP focuses on flow and UI; the real app uses the full [soulmap-mvp-prd](https://github.com/jojosuperstar0506/soulmap/blob/main/soulmap-mvp-prd.md).

## Files

- `index.html` — All views and structure
- `styles.css` — Dark theme, elemental colors, layout
- `app.js` — BaZi math, state, navigation, tabs, Library/Spark/Still Point content

No build step or backend required.
