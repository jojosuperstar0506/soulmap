/**
 * BaZi advanced display: 12 Life Stages (星运/自坐), 空亡, 纳音, 神煞.
 * English labels from SoulMap lexicon (Awakening, Initiation, etc.).
 */

import type { HeavenlyStem, EarthlyBranch, Element } from "@/types/bazi";
import { STEM_MAP } from "@/lib/bazi-calculator";
import { LIFE_STAGE_NAMES } from "@/content/soul-lexicon";

const BRANCH_INDEX: Record<EarthlyBranch, number> = {
  子: 0, 丑: 1, 寅: 2, 卯: 3, 辰: 4, 巳: 5, 午: 6, 未: 7, 申: 8, 酉: 9, 戌: 10, 亥: 11,
};

// 12 Life Stages (长生十二神) — Chinese + Soul lexicon English
const LIFE_STAGE_CN = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"] as const;
const LIFE_STAGES: { cn: string; en: string }[] = LIFE_STAGE_CN.map((cn) => ({
  cn,
  en: LIFE_STAGE_NAMES[cn] ?? cn,
}));

// Branch index where 长生 (Birth) starts, per element
const CHANGSHENG_BRANCH_INDEX: Record<Element, number> = {
  wood: 10,   // 亥
  fire: 2,    // 寅
  earth: 2,   // 寅
  metal: 5,   // 巳
  water: 8,   // 申
};

export function getLifeStage(element: Element, branch: EarthlyBranch): { cn: string; en: string } {
  const idx = BRANCH_INDEX[branch];
  const start = CHANGSHENG_BRANCH_INDEX[element];
  const stageIdx = (idx - start + 12) % 12;
  return LIFE_STAGES[stageIdx];
}

// 空亡 (Kong Wang): 日柱地支 → two branches that are "empty" for that 旬
// 甲子旬 空 戌亥, 甲戌旬 空 申酉, 甲申旬 空 午未, 甲午旬 空 辰巳, 甲辰旬 空 寅卯, 甲寅旬 空 子丑
const KONG_WANG_MAP: Record<EarthlyBranch, [EarthlyBranch, EarthlyBranch]> = {
  子: ["戌", "亥"], 酉: ["戌", "亥"],
  戌: ["申", "酉"], 未: ["申", "酉"],
  申: ["午", "未"], 巳: ["午", "未"],
  午: ["辰", "巳"], 卯: ["辰", "巳"],
  辰: ["寅", "卯"], 丑: ["寅", "卯"],
  寅: ["子", "丑"], 亥: ["子", "丑"],
};

export function getKongWang(dayBranch: EarthlyBranch): { branches: [EarthlyBranch, EarthlyBranch]; en: string } {
  const branches = KONG_WANG_MAP[dayBranch];
  return {
    branches,
    en: "Empty (same for all pillars from day pillar)",
  };
}

// 纳音 (Na Yin): 60 干支 → 纳音 name (Chinese + English)
type GanZhiKey = `${HeavenlyStem}${EarthlyBranch}`;
const NAYIN_TABLE: Record<string, { cn: string; en: string }> = {
  甲子: { cn: "海中金", en: "Sea Gold" }, 乙丑: { cn: "海中金", en: "Sea Gold" },
  丙寅: { cn: "炉中火", en: "Stove Fire" }, 丁卯: { cn: "炉中火", en: "Stove Fire" },
  戊辰: { cn: "大林木", en: "Great Forest Wood" }, 己巳: { cn: "大林木", en: "Great Forest Wood" },
  庚午: { cn: "路旁土", en: "Roadside Earth" }, 辛未: { cn: "路旁土", en: "Roadside Earth" },
  壬申: { cn: "剑锋金", en: "Sword Blade Metal" }, 癸酉: { cn: "剑锋金", en: "Sword Blade Metal" },
  甲戌: { cn: "山头火", en: "Mountain Top Fire" }, 乙亥: { cn: "山头火", en: "Mountain Top Fire" },
  丙子: { cn: "涧下水", en: "Ravine Water" }, 丁丑: { cn: "涧下水", en: "Ravine Water" },
  戊寅: { cn: "城头土", en: "Wall Earth" }, 己卯: { cn: "城头土", en: "Wall Earth" },
  庚辰: { cn: "白蜡金", en: "White Wax Metal" }, 辛巳: { cn: "白蜡金", en: "White Wax Metal" },
  壬午: { cn: "杨柳木", en: "Willow Wood" }, 癸未: { cn: "杨柳木", en: "Willow Wood" },
  甲申: { cn: "泉中水", en: "Spring Water" }, 乙酉: { cn: "泉中水", en: "Spring Water" },
  丙戌: { cn: "屋上土", en: "Roof Earth" }, 丁亥: { cn: "屋上土", en: "Roof Earth" },
  戊子: { cn: "霹雳火", en: "Thunderbolt Fire" }, 己丑: { cn: "霹雳火", en: "Thunderbolt Fire" },
  庚寅: { cn: "松柏木", en: "Pine Wood" }, 辛卯: { cn: "松柏木", en: "Pine Wood" },
  壬辰: { cn: "长流水", en: "Flowing Water" }, 癸巳: { cn: "长流水", en: "Flowing Water" },
  甲午: { cn: "砂中金", en: "Sand Gold" }, 乙未: { cn: "砂中金", en: "Sand Gold" },
  丙申: { cn: "山下火", en: "Below Mountain Fire" }, 丁酉: { cn: "山下火", en: "Below Mountain Fire" },
  戊戌: { cn: "平地木", en: "Flatland Wood" }, 己亥: { cn: "平地木", en: "Flatland Wood" },
  庚子: { cn: "壁上土", en: "Wall Earth" }, 辛丑: { cn: "壁上土", en: "Wall Earth" },
  壬寅: { cn: "金箔金", en: "Foil Gold" }, 癸卯: { cn: "金箔金", en: "Foil Gold" },
  甲辰: { cn: "覆灯火", en: "Lamp Fire" }, 乙巳: { cn: "覆灯火", en: "Lamp Fire" },
  丙午: { cn: "天河水", en: "Heaven River Water" }, 丁未: { cn: "天河水", en: "Heaven River Water" },
  戊申: { cn: "大驿土", en: "Great Station Earth" }, 己酉: { cn: "大驿土", en: "Great Station Earth" },
  庚戌: { cn: "钗钏金", en: "Hairpin Metal" }, 辛亥: { cn: "钗钏金", en: "Hairpin Metal" },
  壬子: { cn: "桑柘木", en: "Mulberry Wood" }, 癸丑: { cn: "桑柘木", en: "Mulberry Wood" },
  甲寅: { cn: "大溪水", en: "Great Stream Water" }, 乙卯: { cn: "大溪水", en: "Great Stream Water" },
  丙辰: { cn: "沙中土", en: "Sand Earth" }, 丁巳: { cn: "沙中土", en: "Sand Earth" },
  戊午: { cn: "天上火", en: "Heaven Fire" }, 己未: { cn: "天上火", en: "Heaven Fire" },
  庚申: { cn: "石榴木", en: "Pomegranate Wood" }, 辛酉: { cn: "石榴木", en: "Pomegranate Wood" },
  壬戌: { cn: "大海水", en: "Sea Water" }, 癸亥: { cn: "大海水", en: "Sea Water" },
};

export function getNaYin(stem: HeavenlyStem, branch: EarthlyBranch): { cn: string; en: string } {
  const key: GanZhiKey = `${stem}${branch}`;
  return NAYIN_TABLE[key] ?? { cn: "—", en: "—" };
}

// 神煞 (Shen Sha): simplified rules — 驿马 (Traveling Horse), 桃花 (Peach Blossom)
// 驿马: 寅午戌 马 申, 申子辰 马 寅, 亥卯未 马 巳, 巳酉丑 马 亥
// 桃花: 寅午戌 桃花 卯, 申子辰 桃花 酉, 亥卯未 桃花 子, 巳酉丑 桃花 午
const YIMA_GROUP: Record<EarthlyBranch, EarthlyBranch> = {
  寅: "申", 午: "申", 戌: "申",
  申: "寅", 子: "寅", 辰: "寅",
  亥: "巳", 卯: "巳", 未: "巳",
  巳: "亥", 酉: "亥", 丑: "亥",
};
const TAOHUA_GROUP: Record<EarthlyBranch, EarthlyBranch> = {
  寅: "卯", 午: "卯", 戌: "卯",
  申: "酉", 子: "酉", 辰: "酉",
  亥: "子", 卯: "子", 未: "子",
  巳: "午", 酉: "午", 丑: "午",
};

export interface ShenShaItem {
  cn: string;
  en: string;
}

/** 神煞 for one pillar: 驿马 when pillar branch is the "horse" branch for year; 桃花 when pillar is "peach" branch for year. */
export function getShenShaForPillar(
  pillarBranch: EarthlyBranch,
  yearBranch: EarthlyBranch
): ShenShaItem[] {
  const list: ShenShaItem[] = [];
  const yimaBranch = YIMA_GROUP[yearBranch];
  if (yimaBranch && pillarBranch === yimaBranch) {
    list.push({ cn: "驿马", en: "Traveling Horse" });
  }
  const taohuaBranch = TAOHUA_GROUP[yearBranch];
  if (taohuaBranch && pillarBranch === taohuaBranch) {
    list.push({ cn: "桃花", en: "Peach Blossom" });
  }
  return list;
}

/** Row label with English for chart table */
export const CHART_ROW_LABELS: Record<string, { cn: string; en: string }> = {
  mainStar: { cn: "主星", en: "Main Star" },
  stem: { cn: "天干", en: "Heavenly Stem" },
  branch: { cn: "地支", en: "Earthly Branch" },
  hiddenStems: { cn: "藏干", en: "Hidden Stems" },
  secondaryStars: { cn: "副星", en: "Secondary Stars" },
  lifeStage: { cn: "星运", en: "Life Stage" },
  selfSitting: { cn: "自坐", en: "Self-Sitting" },
  kongWang: { cn: "空亡", en: "Empty/Death" },
  naYin: { cn: "纳音", en: "Na Yin" },
  shenSha: { cn: "神煞", en: "Symbolic Stars" },
};
