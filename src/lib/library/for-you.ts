import type { Element, ElementBalance } from "@/types/bazi";
import type { SacredText } from "@/types/library";

export interface ForYouContext {
  elementBalance?: ElementBalance;
  favorableElements?: Element[];
  currentConcern?: string | undefined;
}

function elementNeedScore(elementBalance: ElementBalance | undefined, el: Element) {
  if (!elementBalance) return 0;
  // Treat lower % as higher "need" (cap so it doesn't dominate)
  const pct = elementBalance[el] ?? 0;
  return Math.max(0, Math.min(25, 25 - pct)); // 0..25
}

function favorableScore(favorable: Element[] | undefined, el: Element) {
  if (!favorable?.length) return 0;
  return favorable.includes(el) ? 10 : 0;
}

function concernScore(concern: string | undefined, text: SacredText) {
  if (!concern?.trim()) return 0;
  const c = concern.toLowerCase();
  // lightweight keyword match to themes
  const themeHints: Record<string, string[]> = {
    uncertainty_change: ["change", "transition", "move", "moving", "uncertain", "decision", "career", "job"],
    love_connection: ["love", "relationship", "dating", "partner", "marriage", "breakup", "friend"],
    purpose_calling: ["purpose", "calling", "meaning", "path", "direction", "mission"],
    suffering_growth: ["stress", "anxiety", "burnout", "hard", "pain", "grief", "sad"],
    stillness_peace: ["calm", "peace", "still", "meditation", "overwhelmed", "rest"],
    wealth_abundance: ["money", "wealth", "salary", "income", "abundance", "business"],
    death_impermanence: ["death", "impermanence", "loss", "end", "letting go"],
    courage_fear: ["fear", "courage", "brave", "risk", "confidence", "worry"],
  };
  let score = 0;
  for (const th of text.themes) {
    const hints = themeHints[th] ?? [];
    if (hints.some((h) => c.includes(h))) score += 8;
  }
  return score;
}

export function rankForYou(texts: SacredText[], ctx: ForYouContext) {
  return [...texts]
    .map((t) => {
      const elementScore = t.relatedElements.reduce((acc, el) => {
        return (
          acc +
          elementNeedScore(ctx.elementBalance, el) +
          favorableScore(ctx.favorableElements, el)
        );
      }, 0);
      const themeScore = concernScore(ctx.currentConcern, t);
      const base = 5; // keep all candidates viable
      return { t, score: base + elementScore + themeScore };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
}

