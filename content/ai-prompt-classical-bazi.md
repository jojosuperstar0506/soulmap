# AI prompt: Citing classical 八字 texts in the narrative

When generating the **blueprint narrative** (core essence, one classical quote, and work / love / growth) with an AI model, instruct it to support the narrative with excerpts from famous 八字 (BaZi) classical texts. Below is copy you can inject into your system or user prompt.

---

## Classical texts to cite

Instruct the model to cite from these authoritative sources when relevant:

- **《穷通宝鉴》** (Qiong Tong Bao Jian) — Treatise on prosperity and adversity
- **《滴天髓》** (Ditian Sui) — Essential drops of heaven
- **《三命通会》** (San Ming Tong Hui) — Compendium of the three fates
- **《八字提要》** (Ba Zi Ti Yao) — Essentials of the eight characters
- **《子平真诠》** (Zi Ping Zhen Quan) — True interpretation of Zi Ping
- **《渊海子平》** (Yuan Hai Zi Ping) — Ocean and abyss of Zi Ping
- **《天元咸巫》** (Tian Yuan Xian Wu)
- **《神峰通考》** (Shen Feng Tong Kao) — Comprehensive study of divine peaks
- **《千里命稿》** (Qian Li Ming Gao) — Life manuscript over a thousand miles
- **《五行精纪》** (Wu Xing Jing Ji) — Essential records of the five phases
- **《李虚中命书》** (Li Xuzhong Ming Shu) — Li Xuzhong’s treatise on fate

---

## Prompt instructions (paste into your AI narrative prompt)

```
When writing the blueprint narrative (core essence, one classical quote with optional source, and work / love / growth only — no theme, challenge, or strength), support your interpretation with one short excerpt or paraphrase from classical 八字 texts. Prefer these sources when they fit the day master (日主) or element: 《滴天髓》《穷通宝鉴》《子平真诠》《三命通会》《渊海子平》《神峰通考》《千里命稿》《五行精纪》《李虚中命书》《八字提要》《天元咸巫》.

- Cite in this form: "Quote or paraphrase in English." — 《source title》
- The excerpt should reinforce the narrative (e.g. 甲木 / Wood, 癸水 / Water) and feel grounded in classical theory, not generic.
- If the model has no access to the actual text, it may paraphrase well-known principles (e.g. from 滴天髓: 甲木参天 / Yang Wood reaches for heaven; 癸水至弱达于天津 / Yin Water is most yielding yet reaches the heavenly ford) and attribute to the correct book.
```

---

## Optional: inject excerpts into the prompt

For more accurate citations, you can **inject** the exact excerpts from `content/classical-bazi-excerpts.js` (or a JSON export) into the system prompt, keyed by stem index (0 = 甲, 9 = 癸). Example:

```
For this user's day master (stem index N), you may use one of these classical excerpts to support the narrative:

[paste CLASSICAL_BAZI_EXCERPTS[N] here]

Choose the one that best supports the core essence and work/love/growth you wrote, or cite it verbatim in the "From the classics" section.
```

This way the model does not hallucinate the quote; it selects or adapts from the provided excerpt and attributes the correct 《source》.

---

## Part B: Output structure (for API / structured output)

Return **only** these fields. Do **not** return `theme`, `challenge`, or `strength`.

| Field | Required | Description |
|-------|----------|-------------|
| `coreEssence` | Yes | One paragraph: who they are (day master/soul type), essence, season, and that the chart is supported by work, love, and growth. |
| `classicalQuote` | Yes | One short excerpt or paraphrase from classical 八字 texts (English). |
| `classicalSource` | No | Attribution, e.g. "《滴天髓》 (Ditian Sui)". |
| `work` | Yes | 1–2 sentences on work/career. |
| `love` | Yes | 1–2 sentences on relationships. |
| `growth` | Yes | 1–2 sentences on personal growth. |

JSON schema: see `docs/narrative-api-schema.json` in this repo.
