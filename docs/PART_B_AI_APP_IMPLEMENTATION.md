# Part B: Implement New Narrative Structure in the AI App (soulmap.app)

**Goal:** Customers see the same narrative structure in the **screenshot / live app** (soulmap.app) as in the static MVP: **core essence** → **"From the classics"** (blockquote) → **"What this means for you"** with **Work**, **Love**, **Growth**. No **Theme** / **Challenge** / **Strength**.

This doc is the implementation checklist for the **AI app** backend and front-end (the app that generates narrative via API/LLM and shows it in the “Your narrative” / blueprint area).

---

## How do I implement this?

- **If you only use this repo (the static HTML MVP):** Part B is **already implemented** here. The narrative section shows core essence → "From the classics" → Work / Love / Growth, and the data in `app.js` uses only that schema (no theme/challenge/strength). Open `index.html` in a browser to see it.
- **If the screenshot / live app (soulmap.app) is a different codebase:** That app is not in this folder. To implement Part B there:
  1. Open **that project** (the one that runs soulmap.app and has the AI/API narrative) in Cursor.
  2. In that project, say: *"Implement Part B using the guide in docs/PART_B_AI_APP_IMPLEMENTATION.md: update the narrative API schema and prompt, and change the blueprint/narrative UI to show core essence, From the classics, and Work/Love/Growth only."*
  3. Follow the checklist below (Backend §1–2, Front-end §2) in that codebase.

---

## 1. Backend (API / LLM)

### 1.1 Response schema

**Return these fields** (and stop surfacing `theme`, `challenge`, `strength` to the front-end):

| Field | Type | Description |
|-------|------|-------------|
| `coreEssence` | string | One paragraph: who they are (day master / soul type), essence, season, and that the chart is supported by work, love, and growth. |
| `classicalQuote` | string | One short excerpt or paraphrase from classical 八字 texts (English). |
| `classicalSource` | string (optional) | Attribution, e.g. "《滴天髓》 (Ditian Sui)". |
| `work` | string | 1–2 sentences on work/career. |
| `love` | string | 1–2 sentences on relationships. |
| `growth` | string | 1–2 sentences on personal growth. |

**Remove or stop returning:** `theme`, `challenge`, `strength` in the narrative payload used by the customer-facing UI.

### 1.2 Prompt

- Instruct the model to output **only** the new structure: core essence, one classical quote (with optional source), and work / love / growth.
- Use the prompt text in this repo: `content/ai-prompt-classical-bazi.md` (updated for core essence + classical quote + work/love/growth).
- Optional: inject excerpts from `content/classical-bazi-excerpts.js` (or equivalent) keyed by day master so the model selects/adapts instead of inventing quotes.

### 1.3 Endpoints

- Ensure the **analyze** or **narrative** (or equivalent) endpoint returns the new schema.
- If there is a “Refresh narrative” or regeneration flow, have it call the same updated endpoint so new copy uses the new structure.

---

## 2. Front-end (screenshot / “Your narrative” view)

### 2.1 Structure to render

Match the static MVP layout (see `index.html` and `app.js` in this repo):

1. **Heading:** “Your narrative”
2. **Core essence:** One paragraph (`coreEssence`)
3. **Section:** “From the classics”
   - **Blockquote:** `classicalQuote`
   - **Footer (optional):** `classicalSource`
4. **Section:** “What this means for you”
   - **Work:** label + `work`
   - **Love:** label + `love`
   - **Growth:** label + `growth`

Do **not** render Theme, Challenge, or Strength in this view.

### 2.2 Reference markup (from this repo’s `index.html`)

```html
<section class="your-narrative">
  <h2 class="narrative-main-title">Your narrative</h2>
  <p id="detail-core-essence" class="narrative-core-essence">—</p>
  <h3 class="narrative-section-label">From the classics</h3>
  <blockquote class="narrative-classical" id="blockquote-classical" cite="">
    <p id="detail-classical-text">—</p>
    <footer id="detail-classical-source">—</footer>
  </blockquote>
  <h3 class="narrative-section-label">What this means for you</h3>
  <div class="narrative-work-love-growth">
    <p><strong>Work:</strong> <span id="detail-work">—</span></p>
    <p><strong>Love:</strong> <span id="detail-love">—</span></p>
    <p><strong>Growth:</strong> <span id="detail-growth">—</span></p>
  </div>
</section>
```

### 2.3 Data binding

- Map API response to the UI:
  - `coreEssence` → core essence paragraph
  - `classicalQuote` → blockquote text
  - `classicalSource` → blockquote footer (hide if empty)
  - `work`, `love`, `growth` → the three “What this means for you” lines
- If the API still returns theme/challenge/strength, do **not** display them in the main narrative section.

### 2.4 Refresh / cache

- “Refresh narrative” (or equivalent) should request narrative again from the backend and re-render with the **new** schema so customers see updated core essence, classical quote, work, love, and growth.

---

## 3. How to find the right files in the AI app

- **Backend:** Search for routes or handlers for “analyze”, “narrative”, “blueprint”, or “chart” that call an LLM and return narrative text.
- **Front-end:** Search for “Theme”, “Challenge”, “Strength” or “Your narrative”, “blueprint” in the component that renders the blueprint/narrative reveal. Replace that block with the structure above and the new schema fields.

---

## 4. Reference in this repo (static MVP)

| Item | Location |
|------|----------|
| Narrative structure (HTML) | `index.html` — section `.your-narrative` |
| Rendering logic | `app.js` — `renderAppBlueprint()`, uses `BLUEPRINT_NARRATIVE`, `FALLBACK_CLASSICAL_BAZI` / `CLASSICAL_BAZI_EXCERPTS`; supports optional `state.narrativeFromAPI` (Part B schema) |
| Narrative API schema (Part B) | `docs/narrative-api-schema.json` |
| Classical excerpts (for prompt or fallback) | `content/classical-bazi-excerpts.js` |
| AI prompt text | `content/ai-prompt-classical-bazi.md` |

Once Part B is done in the AI app, the screenshot area will show the same structure customers see in the static MVP: core essence → From the classics → What this means for you (Work, Love, Growth).
