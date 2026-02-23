/**
 * Persona images for each Day Master (Heavenly Stem) — astrological style.
 * Images live in public/personas/ as persona-{pinyin}.png
 */
import type { HeavenlyStem } from "@/types/bazi";

export const PERSONA_PINYIN: Record<HeavenlyStem, string> = {
  甲: "jia",
  乙: "yi",
  丙: "bing",
  丁: "ding",
  戊: "wu",
  己: "ji",
  庚: "geng",
  辛: "xin",
  壬: "ren",
  癸: "gui",
};

/** Base path for persona images (in public/). */
export const PERSONAS_BASE = "/personas";

export function getPersonaImagePath(dayMaster: HeavenlyStem): string {
  const pinyin = PERSONA_PINYIN[dayMaster];
  return `${PERSONAS_BASE}/persona-${pinyin}.png`;
}
