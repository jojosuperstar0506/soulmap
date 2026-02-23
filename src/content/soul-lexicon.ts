/**
 * SoulMap Elemental Translation Lexicon (from soul-system-prompt v1).
 * Use these English names across the app so verbiage matches the AI and feels consistent.
 */

import type { HeavenlyStem, TenGod, Element } from "@/types/bazi";

/** Ten Essences (天干 / Day Master): Chinese stem → English name + emoji */
export const DAY_MASTER_NAMES: Record<HeavenlyStem, { en: string; symbol: string }> = {
  甲: { en: "Ancient Oak", symbol: "🌳" },
  乙: { en: "Willow", symbol: "🌿" },
  丙: { en: "Sun", symbol: "☀️" },
  丁: { en: "Candlelight", symbol: "🕯️" },
  戊: { en: "Mountain", symbol: "⛰️" },
  己: { en: "Garden Soil", symbol: "🌾" },
  庚: { en: "Sword", symbol: "⚔️" },
  辛: { en: "Gemstone", symbol: "💎" },
  壬: { en: "Ocean", symbol: "🌊" },
  癸: { en: "Mist", symbol: "🌫️" },
};

/** Ten Relationships (十神): Chinese → English name */
export const TEN_GOD_NAMES: Record<TenGod, string> = {
  比肩: "Mirror",
  劫财: "Shadow",
  食神: "Muse",
  伤官: "Maverick",
  正财: "Harvest",
  偏财: "Windfall",
  正官: "Architect",
  七杀: "Challenger",
  正印: "Guardian",
  偏印: "Mystic",
};

/** Twelve Life Stages (十二长生): Chinese → English */
export const LIFE_STAGE_NAMES: Record<string, string> = {
  长生: "Awakening",
  沐浴: "Initiation",
  冠带: "Rising",
  临官: "Ascension",
  帝旺: "Zenith",
  衰: "Waning",
  病: "Retreat",
  死: "Stillness",
  墓: "Vault",
  绝: "Void",
  胎: "Conception",
  养: "Nurture",
};

/** Five Elements: short theme for UI/tooltips */
export const ELEMENT_THEMES: Record<Element, string> = {
  wood: "Growth, ambition, expansion, beginnings",
  fire: "Expression, visibility, passion, transformation",
  earth: "Stability, nourishment, foundation, trust",
  metal: "Precision, justice, refinement, discipline",
  water: "Wisdom, flow, adaptability, depth",
};

/** Life season / 大运: element-based short description (for luck pillar row) */
export const LUCK_ELEMENT_PHRASES: Record<Element, string> = {
  wood: "Growth, new beginnings, building foundations",
  fire: "Visibility, warmth, leadership and creative expression",
  earth: "Stability, responsibility, grounding and harvest",
  metal: "Clarity, reform, discipline and letting go",
  water: "Flow, adaptability, depth and renewal",
};
