import type { HeavenlyStem, Element } from "@/types/bazi";
import { STEM_MAP } from "@/lib/bazi-calculator";
import { LUCK_ELEMENT_PHRASES } from "@/content/soul-lexicon";

export function getLuckPillarInterpretation(stem: HeavenlyStem): string {
  const el = STEM_MAP[stem].element;
  return LUCK_ELEMENT_PHRASES[el] ?? "A shift in life energy and focus.";
}
