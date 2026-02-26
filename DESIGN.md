# SoulMap — Design System Reference

> **Purpose:** Single source of truth for all visual decisions. Reference this in every design-related conversation so decisions stay consistent across sessions.

---

## Aesthetic Brief

**Style:** Neo-Risograph Eastern Mythology UI — "ancient wisdom transmitted through an analog signal."
**Mood:** Warm, grounded, slightly analog/print-like. Not digital-glassy. Not harsh dark-mode.
**Background:** Warm parchment (`#F4EFE4`), not white.
**Borders/corners:** Almost no rounding — `border-radius: 2px` globally. Sharp, print-like.
**Grain texture:** SVG noise overlay at 12% opacity for the analog feel.
**Layout:** Portrait-first (portrait card max-width 360px), app container max-width ~640px.
**No dark mode** (currently; may add later).

---

## Color Palette

All values live as CSS custom properties in `:root` (`public/styles.css`).

### Background & Surface
| Token | Hex | Use |
|-------|-----|-----|
| `--color-void` | `#F4EFE4` | Primary background — warm parchment |
| `--color-ground` | `#EAE4D4` | Card / section background |
| `--color-surface-raised` | `#DED8C8` | Elevated panels |
| `--color-border` | `#C5BCA8` | Subtle borders, dividers |
| `--color-border-active` | `#E8372A` | Active/selected state — vermillion |

### Text
| Token | Hex | Use |
|-------|-----|-----|
| `--color-white-bone` | `#1A1510` | Primary text — dark warm ink |
| `--color-ash` | `#5C5448` | Secondary text |
| `--color-ghost` | `#9C8E7C` | Disabled / tertiary |

### Brand Accents
| Token | Hex | Name | Notes |
|-------|-----|------|-------|
| `--color-vermillion` | `#E8372A` | Vermillion | Fire element; primary action/accent |
| `--color-gold` | `#D4AF37` | Burnished gold | Metal element |
| `--color-cobalt` | `#3A7D44` | Forest green | Wood element (despite name "cobalt") |
| `--color-amber` | `#9B5523` | Terracotta/sienna | Earth element (despite name "amber") |
| `--color-cyan` | `#1A4DB5` | Deep sapphire | Water element (despite name "cyan") |
| `--color-magenta` | `#C8357A` | Magenta | General UI accent; not an element color |

---

## Five Elements Palette (五行)

The canonical element color mapping — used in Four Pillars chars, element balance bars, 大运 card accents, and element badge backgrounds.

| Element | Chinese | Color name | Hex | CSS var |
|---------|---------|-----------|-----|---------|
| Wood | 木 | Forest green | `#3A7D44` | `var(--color-cobalt)` / `var(--wood)` |
| Fire | 火 | Vermillion red | `#E8372A` | `var(--color-vermillion)` / `var(--fire)` |
| Earth | 土 | Terracotta/sienna | `#9B5523` | `var(--color-amber)` / `var(--earth)` |
| Metal | 金 | Burnished gold | `#D4AF37` | `var(--color-gold)` / `var(--metal)` |
| Water | 水 | Deep sapphire | `#1A4DB5` | `var(--color-cyan)` / `var(--water)` |

**Rationale:** Each is immediately legible — green (nature/growth), red (flame), brown (soil/clay), gold (precious metal), navy (ocean/depth). Fire/Earth/Metal are three distinct warm families: red → brown → gold.

**Where used:**
- `ELEMENT_HEX` object in `public/app.js` — inline SVG/style colors
- `ELEMENT_COLORS` object in `public/app.js` — references CSS vars
- `.bazi-elem-wood/fire/earth/metal/water` CSS classes — badge color + tinted background
- Element balance bars (`.fill` div, `background: ELEMENT_HEX[k]`)
- 大运 card `--card-accent` CSS var + stem/branch char colors

---

## Typography Scale

| Class / Context | Font | Size | Weight | Notes |
|----------------|------|------|--------|-------|
| `.bazi-char` (天干/地支 main char) | Chinese serif | `1.45rem` | normal | Color = element hex |
| `.bazi-romanization` (pīnyīn above char) | Body sans | `0.65rem` | normal | opacity 0.85 |
| `.bazi-col-en` (YEAR/MONTH/DAY/HOUR header) | Body sans | `0.62rem` | normal | letter-spacing 0.1em |
| `.bazi-label-en` (row label English) | Body sans | `0.48rem` | normal | letter-spacing 0.04em |
| `.bazi-tg-en` (Ten God English) | Body sans | `0.54rem` | normal | letter-spacing 0.04em |
| `.bazi-elem-tag` (element badge) | — | `0.58rem` | 700 | letter-spacing 0.05em |
| Narrative body | Body sans | `0.875rem` | normal | — |
| Section headers | Display serif | `clamp(...)` | — | Playfair Display |

**Font families:**
- `--font-display`: `'Playfair Display', Georgia, serif` — headings/display
- `--font-body`: `'DM Sans', system-ui, sans-serif` — UI labels, English text
- `--font-chinese`: `'Noto Serif SC', 'Source Han Serif SC', serif` — all Chinese characters

---

## Spacing & Layout Tokens

| Token / Selector | Value | Notes |
|-----------------|-------|-------|
| `--radius` | `2px` | Global border-radius (almost square) |
| `.bazi-grid` max-width | `520px` | Four Pillars grid cap |
| `.bazi-grid` columns | `3.2rem repeat(4, 1fr)` | Label col + 4 pillar cols |
| `.bazi-row-core .bazi-cell` min-height | `3rem` | Stem/Branch rows |
| Standard cell min-height | `2.4rem` | Reference rows |
| Portrait card max-width | `360px` | Soul type portrait |

---

## Component Inventory

### Four Pillars Grid (四柱)
- File: `public/app.js` → `renderFourPillars()`
- CSS: `public/styles.css` lines ~1814–2050
- Grid: 11 rows × 5 cols (label + Year/Month/Day/Hour)
- Row hierarchy: **core** (header, TenGod, Stems, Branches) vs **ref** (Hidden Stars and below)
- Core rows separated from ref rows by 2px border-top
- Spirits row (神煞) conditionally hidden when all pillars have no sha data

### 大运 Cards (Luck Cycles)
- File: `public/app.js` → `renderDaYun()`
- Each card: left accent border + stem/branch chars colored by element
- `--card-accent` CSS var set inline via `ELEMENT_COLORS[stemEl]`

### Element Balance Bars
- File: `public/app.js` → `renderAppBlueprint()`
- Horizontal fill bars using `ELEMENT_HEX[k]` for background color
- Percentage labels for Wood/Fire/Earth/Metal/Water distribution

### Narrative Section
- File: `src/app/api/narrative/route.ts` + `public/app.js`
- AI-generated reading via Anthropic API (`claude-sonnet-4-6`)
- Structured with symbol pillars (☽ ☀ ⬡ ✦) as section dividers

### Portrait
- SVG-based soul type portrait, max-width 360px
- Generated from 10 base stem soul types

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Feb 2025 | Light mode (warm parchment) | Dark background not reading-friendly |
| Feb 2025 | Metal color = gold `#D4AF37` (not silver/gray) | Gray looked weak; gold = precious metal ✓ |
| Feb 2025 | Element colors shifted to traditional associations | Cobalt blue for Wood was confusing (read as Water) |
| Feb 2025 | Four Pillars max-width 520px | Wide desktop columns looked sparse/unintentional |
| Feb 2025 | Core/ref row hierarchy in grid | Reduces visual noise; focuses attention on main pillars |
