# SoulMap — Design System Reference

> **Purpose:** Single source of truth for all visual decisions. Reference this in every design-related conversation so decisions stay consistent across sessions.

---

## Aesthetic Brief

**Style:** Neo-Risograph Eastern Mythology UI — "ancient wisdom transmitted through an analog signal."
**Mood:** Cool, cosmic, slightly analog/print-like. Not digital-glassy. Like an independent artist's mystical zine.
**Background:** Deep space dark (`#0D0B14`) — cosmic void. Nav chrome (tab bar, header) stays dark. Content cards are **off-white lavender paper** (`#F0EEF8`) floating on the void. Elevated panels `#E4E1F5`. Neo-Risograph paper-on-void aesthetic.
**Text (on-void):** Near-white primary (`#EDEBF5`) + light lavender-grey secondary (`#C4C0D8`) + mid purple-grey tertiary (`#9490AA`). Used on landing, header, nav labels.
**Text (on-card):** Solid near-black (`#0A0814`) for all content text. Structural labels (row headers, column labels, section titles, meta labels) use electric purple (`#A020F0`). Applied via CSS custom property cascade on a comprehensive 20-selector list covering all card surfaces — single source of truth at bottom of `public/styles.css`.
**Brand token:** Electric psychic purple (`#A020F0`) for the SoulMap wordmark and active UI states.
**Borders/corners:** Almost no rounding — `border-radius: 2px` globally. Sharp, print-like.
**Grain texture:** SVG noise overlay at 12% opacity for the cosmic analog feel.
**Layout:** Portrait-first (portrait card max-width 360px), app container max-width ~640px.
**Dark mode** — deep space `#0D0B14` background (default and only mode).

---

## Color Palette

All values live as CSS custom properties in `:root` (`public/styles.css`).

### Background & Surface
| Token | Hex | Use |
|-------|-----|-----|
| `--color-void` | `#0D0B14` | Primary background — cosmic void (landing, header, nav) |
| `--color-ground` | `#F0EEF8` | Card / section background — off-white lavender paper |
| `--color-surface-raised` | `#E4E1F5` | Elevated panels (grid header row, label col, meta stat boxes) |
| `--color-border` | `#CCC8E4` | Subtle borders — light lavender (globally); overridden to `rgba(18,16,30,0.12)` inside cards |
| `--color-border-active` | `#A020F0` | Active/selected state — psychic purple |

### Text — on void (landing, header, nav)
| Token | Hex | Use |
|-------|-----|-----|
| `--color-white-bone` | `#EDEBF5` | Primary text — near-white, faint lavender |
| `--color-ash` | `#C4C0D8` | Secondary text — light lavender-grey |
| `--color-ghost` | `#9490AA` | Disabled / tertiary — mid purple-grey |

### Text — on card (auto-overridden via CSS custom property cascade)
| Token | On-card value | Use |
|-------|--------------|-----|
| `--color-white-bone` | `#0A0814` | Solid near-black — all content text on light card |
| `--color-ash` | `#0A0814` | Solid near-black (no grey gradation) |
| `--color-ghost` | `#0A0814` | Solid near-black (no grey gradation) |

**Structural labels** override to `var(--color-psychic)` (`#A020F0`): `.bazi-label`, `.bazi-label-en`, `.bazi-col-head`, `.bazi-col-en`, `.blueprint-meta-label`, `.detail-sections h3`, `.narrative-section-label`.

**Comprehensive card context selectors** (dark-text block at bottom of `public/styles.css`): `.card-base`, `.card-active`, `.blueprint-detail-card`, `.blueprint-reveal-card`, `.blueprint-detail-visual`, `.blueprint-meta-item`, `.profile-btn`, `.profile-sheet-panel`, `.oracle-template-card`, `.oracle-chat`, `.oracle-messages .msg.assistant`, `.oracle-input-form textarea`, `.wisdom-vault-item`, `.spark-card`, `.meditation-item`, `.dayun-card`, `.bazi-grid`, and all `.onboard-form` inputs.

### Brand Accents
| Token | Hex | Name | Notes |
|-------|-----|------|-------|
| `--color-psychic` | `#A020F0` | Psychic purple | **Brand token** — SoulMap wordmark + active states |
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
| Feb 2025 | Light mode (warm parchment → now cosmic lavender) | Dark background not reading-friendly |
| Feb 2025 | Metal color = gold `#D4AF37` (not silver/gray) | Gray looked weak; gold = precious metal ✓ |
| Feb 2025 | Element colors shifted to traditional associations | Cobalt blue for Wood was confusing (read as Water) |
| Feb 2025 | Four Pillars max-width 520px | Wide desktop columns looked sparse/unintentional |
| Feb 2025 | Core/ref row hierarchy in grid | Reduces visual noise; focuses attention on main pillars |
| Feb 2026 | **Dark mode** — deep space `#0D0B14` background | Near-black with cosmic purple undertone. Element blobs glow as colored auras. Five element colors and electric purple accent pop maximally on dark. |
| Feb 2026 | 色块 blobs made **dynamic from BaZi elements** | Background blobs now reflect user's top 3 dominant elements. `renderAppBlueprint()` in `app.js` sets `--blob-elem-1/2/3` via `setProperty()`. CSS fallbacks: psychic/gold/vermillion pre-load. |
| Feb 2026 | Section label `::before` color bars added | 3px psychic purple bar above each `.detail-sections h3` — editorial section marker. Soul type sub-label gets tinted chip background `rgba(160,32,240,0.07)`. |
| Feb 2026 | **NEO pop** text hierarchy — near-white body + accent-only purple | Body text `#EDEBF5` (near-white, faint lavender); secondary `#A8A4BE` (mid lavender-grey); `#A020F0` accent-only. Electric purple pops because it's not competing with body text. |
| Feb 2026 | `--color-psychic: #A020F0` — electric psychic purple | Upgraded from #7B3FF2; #A020F0 is a true saturated psychic purple, reserved for SoulMap wordmark + active UI states |
| Feb 2026 | Row striping changed from `rgba(0,0,0,X)` → `rgba(30,21,53,X)` | Black overlay cast cold grey on lavender; indigo-tint overlay reads naturally with new background |
| Feb 2026 | **Background 色块 blobs disabled** | `body::before`, `.landing-bg::before`, `.landing-bg::after` set to `display: none`. Code preserved for easy re-enable. Dynamic blob JS (`--blob-elem-1/2/3`) remains in `renderAppBlueprint()`. Clean deep-space dark background is more focused and editorial. |
| Feb 2026 | **Text tokens brightened for dark bg readability** | `--color-ash: #A8A4BE → #C4C0D8` (~20% brighter); `--color-ghost: #625E78 → #9490AA` (~45% brighter). Secondary and tertiary labels now clearly legible on `#0D0B14`. `--color-white-bone: #EDEBF5` unchanged. |
| Feb 2026 | **Light card surfaces — Neo-Risograph paper-on-void** | `--color-ground: #14121E → #F0EEF8` (off-white lavender paper); `--color-surface-raised: #1C1A28 → #E4E1F5`. Tab bar + header chrome stay dark (`--color-void`). Card text overridden dark via CSS custom property cascade. Element chars (vivid HEX) on white = printed almanac. Row stripe flipped to dark-on-light tint. Badge opacity reduced to 0.13/0.11 for white bg. Portrait fade to `rgba(240,238,248,0.97)`. |
| Feb 2026 | **Full chart light background** | Added `background: var(--color-ground)` to `.bazi-grid` so the Four Pillars grid surface is `#F0EEF8` (off-white paper). Previously the grid had no background and showed the dark void through cell gaps. |
| Feb 2026 | **2-plate risograph text system** | Black content ink (`#0A0814`) + electric purple structural ink (`#A020F0`) on off-white paper. No grey intermediates. Content text (Ten Gods, sub-stars, body text) = solid near-black. Structural labels (row/col headers, section titles, meta labels) = psychic purple via explicit override rule. |
| Feb 2026 | **Comprehensive dark-text context** | Replaced narrow 8-selector dark-text block with a comprehensive 20-selector list covering every light-background surface in the app. Single block to edit for any new card component going forward. |
| Feb 2026 | **On-card text flattened to solid near-black** | All three on-card vars (`--color-white-bone`, `--color-ash`, `--color-ghost`) set to `#0A0814`. User requirement: "no grey, solid black or solid psychic purple." Hierarchy achieved through color (black vs. purple) not lightness gradation. |
