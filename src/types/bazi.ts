/**
 * SoulMap BaZi type definitions (from PRD)
 */

export type HeavenlyStem =
  | "甲"
  | "乙"
  | "丙"
  | "丁"
  | "戊"
  | "己"
  | "庚"
  | "辛"
  | "壬"
  | "癸";

export type EarthlyBranch =
  | "子"
  | "丑"
  | "寅"
  | "卯"
  | "辰"
  | "巳"
  | "午"
  | "未"
  | "申"
  | "酉"
  | "戌"
  | "亥";

export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export type TenGod =
  | "比肩"
  | "劫财"
  | "食神"
  | "伤官"
  | "偏财"
  | "正财"
  | "七杀"
  | "正官"
  | "偏印"
  | "正印";

export type Shichen =
  | "子时"
  | "丑时"
  | "寅时"
  | "卯时"
  | "辰时"
  | "巳时"
  | "午时"
  | "未时"
  | "申时"
  | "酉时"
  | "戌时"
  | "亥时";

export interface Pillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

export interface ElementBalance {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface LuckPillar {
  startAge: number;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  startYear: number;
  endYear: number;
}

export interface SoulType {
  primaryType: string;
  dayMasterChinese: string;
  dayMasterPinyin: string;
  element: Element;
  polarity: "yin" | "yang";
  essence: string;
  tagline: string;
  visualArchetype: string;
  seasonModifier: string;
  dominantTenGod: TenGod;
  strength: "strong" | "weak" | "balanced";
}

export interface BaZiChart {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar;

  dayMaster: HeavenlyStem;
  dayMasterElement: Element;
  dayMasterPolarity: "yin" | "yang";
  dayMasterStrength: "strong" | "weak" | "balanced";

  hiddenStems: {
    year: HeavenlyStem[];
    month: HeavenlyStem[];
    day: HeavenlyStem[];
    hour: HeavenlyStem[];
  };

  tenGods: {
    yearStem: TenGod;
    monthStem: TenGod;
    hourStem: TenGod;
  };

  elementBalance: ElementBalance;

  favorableElements: Element[];
  unfavorableElements: Element[];

  luckPillars: LuckPillar[];

  soulType: SoulType;
}

export interface UserProfile {
  birthDate: string;
  birthTime: string;
  shichen: Shichen;
  gender: "male" | "female";
  occupation?: string;
  relationshipStatus?: string;
  currentConcern?: string;
}

/** Life-aspect breakdown for current 大运 (紫微斗数–inspired categories). */
export interface CurrentLuckAspects {
  wealth: string;   // 财帛 — money, resources
  love: string;     // 夫妻 — partner, romance
  career: string;   // 官禄 — work, status
  friends: string;  // 奴仆/兄弟 — friends, peers
}

/** AI-generated narrative per profile; cached and reused for Library and Spark. 大运 is shown in the timeline only, not in this narrative. */
export interface BlueprintAnalysis {
  summary: string;
  theme: string;
  challenge: string;
  strength: string;
  /** Deprecated: 大运 is shown in the timeline; no longer in narrative. */
  currentLuckMeaning?: string;
  /** Optional per-aspect explanation for current 大运 (used in timeline). */
  currentLuckAspects?: CurrentLuckAspects | null;
  generatedAt: string;
}

/** One Oracle chat message (persisted per profile so history is saved). */
export interface OracleMessage {
  role: "user" | "assistant";
  content: string;
}

/** A saved profile (self or family/friend) with display name and stored chart. */
export interface Profile {
  id: string;
  name: string;
  birthDate: string;
  birthTime: string;
  shichen: Shichen;
  gender: "male" | "female";
  occupation?: string;
  relationshipStatus?: string;
  currentConcern?: string;
  baziChart: BaZiChart | null;
  blueprintAnalysis?: BlueprintAnalysis | null;
  /** Persisted Oracle chat history so user doesn't need to regenerate. */
  oracleMessages?: OracleMessage[] | null;
  createdAt: number;
}
