# SoulMap

BaZi (Eight Characters) life blueprint web app — static frontend served by Next.js, with AI narrative and Oracle API routes powered by Anthropic Claude.

---

## Quick reference

| Area | Edit this file | Notes |
|------|---------------|-------|
| App logic & UI | `public/app.js` | Then run sync command below |
| Styles | `public/styles.css` | Then run sync command below |
| HTML structure | `public/index.html` | Then run sync command below |
| Wisdom Vault quotes | `public/content/wisdom-vault.js` | 172 entries, each with `tradition` + `theme` fields |
| Classical BaZi texts | `public/content/classical-bazi-excerpts.js` | Loaded for narrative rendering context |
| Oracle AI system prompt | `src/content/soul-system-prompt.md` | Included in Vercel bundle via `next.config.ts` |
| Oracle loading phrases | `content/oracle-loading-phrases.md` | Copy bank — not yet wired to code |
| BaZi prompt reference | `content/ai-prompt-classical-bazi.md` | Prompt engineering notes for classical citations |
| Visual design decisions | `DESIGN.md` | Colors, typography, Five Elements palette, component specs |
| Claude session memory | `.claude/projects/.../MEMORY.md` | Auto-managed by Claude — do not edit manually |

---

## Directory rules

```
public/                  ← everything the browser downloads
  app.js                 ← main app logic (source of truth)
  styles.css             ← all styles (source of truth)
  index.html             ← app shell (source of truth)
  content/               ← JS data files loaded via <script> tags
    wisdom-vault.js      ← Wisdom Vault quotes database
    classical-bazi-excerpts.js

content/                 ← human & AI reference docs, NOT served to browser
  oracle-loading-phrases.md
  ai-prompt-classical-bazi.md

src/                     ← Next.js server-side code (API routes + Vercel functions)
  app/api/narrative/     ← BaZi narrative generation
  app/api/oracle/        ← Oracle chat
  content/               ← server-side content (included in Vercel bundle)
    soul-system-prompt.md
```

> **Rule:** Edit data files in `public/content/` directly — they are the single source of truth for browser-loaded scripts. The root `content/` folder holds reference docs only.

---

## Sync workflow

After editing `public/app.js`, `public/styles.css`, or `public/index.html`, run:

```bash
cp public/app.js app.js && cp public/styles.css styles.css && cp public/index.html index.html
```

This keeps the root copies in sync (used by git history and some tooling).

---

## Local development

```bash
npx next dev        # starts at http://localhost:3000  (matches production)
```

> The Claude Preview tool also uses `next dev` — so what you see in preview matches Vercel exactly.

---

## Deploy to Vercel

```bash
git add -A
git commit -m "your message"
git push
```

Vercel auto-deploys on push to `main`. Ensure `ANTHROPIC_API_KEY` is set in the Vercel dashboard under Settings → Environment Variables (Production + Preview).

---

## Feature status

| Feature | Status |
|---------|--------|
| Four Pillars grid + BaZi engine | ✅ Live |
| Multi-profile management | ✅ Live |
| AI narrative (BaZi blueprint) | ✅ Live |
| Oracle chat | ✅ Live |
| Wisdom Vault v2 (themes, modal, saves) | ✅ Live |
| Daily Spark | ✅ Live |
| StillPoint | ✅ Live |
| Oracle loading phrases (rotating) | 🔜 Phrase bank ready, wiring pending |
