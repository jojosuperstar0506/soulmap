/**
 * BaZi (Four Pillars of Destiny) calculation engine
 * Uses lunar-javascript for calendar conversion + custom logic for Ten Gods, elements, etc.
 */

import type {
  HeavenlyStem,
  EarthlyBranch,
  Element,
  TenGod,
  Pillar,
  ElementBalance,
  SoulType,
  BaZiChart,
  LuckPillar,
} from "@/types/bazi";

// Heavenly Stem to Element + Polarity (exported for 藏干 / display)
export const STEM_MAP: Record<
  HeavenlyStem,
  { element: Element; polarity: "yin" | "yang" }
> = {
  甲: { element: "wood", polarity: "yang" },
  乙: { element: "wood", polarity: "yin" },
  丙: { element: "fire", polarity: "yang" },
  丁: { element: "fire", polarity: "yin" },
  戊: { element: "earth", polarity: "yang" },
  己: { element: "earth", polarity: "yin" },
  庚: { element: "metal", polarity: "yang" },
  辛: { element: "metal", polarity: "yin" },
  壬: { element: "water", polarity: "yang" },
  癸: { element: "water", polarity: "yin" },
};

// Hidden stems in each Earthly Branch (from PRD Appendix A)
const HIDDEN_STEMS: Record<EarthlyBranch, HeavenlyStem[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "庚", "戊"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"],
};

// 五鼠遁 - Day Stem to Hour Stem mapping (index = earthly branch index)
const HOUR_STEM_TABLE: Record<HeavenlyStem, HeavenlyStem[]> = {
  甲: ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙"],
  乙: ["丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁"],
  丙: ["戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己"],
  丁: ["庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛"],
  戊: ["壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"],
  己: ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙"],
  庚: ["丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁"],
  辛: ["戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己"],
  壬: ["庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛"],
  癸: ["壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"],
};

const EARTHLY_BRANCHES: EarthlyBranch[] = [
  "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
];

// Element names in Chinese (for 藏干 display: 壬水, 甲木, etc.)
export const ELEMENT_CHINESE: Record<Element, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

// Ten Gods derivation: (other element, other polarity) => TenGod
// Rows: relationship to Day Master (same, produces, produced by, controls, controlled by)
// Cols: same polarity, different polarity
export function getTenGod(
  dayMaster: HeavenlyStem,
  otherStem: HeavenlyStem
): TenGod {
  const dm = STEM_MAP[dayMaster];
  const other = STEM_MAP[otherStem];
  if (!dm || !other) return "比肩";

  const sameElement = dm.element === other.element;
  const samePolarity = dm.polarity === other.polarity;

  if (sameElement) {
    return samePolarity ? "比肩" : "劫财";
  }

  // Five Elements cycle: wood→fire→earth→metal→water→wood
  const generating: Record<Element, Element> = {
    wood: "fire",
    fire: "earth",
    earth: "metal",
    metal: "water",
    water: "wood",
  };
  const controlling: Record<Element, Element> = {
    wood: "earth",
    fire: "metal",
    earth: "water",
    metal: "wood",
    water: "fire",
  };

  if (generating[dm.element] === other.element) {
    return samePolarity ? "食神" : "伤官";
  }
  if (generating[other.element] === dm.element) {
    return samePolarity ? "偏印" : "正印";
  }
  if (controlling[dm.element] === other.element) {
    return samePolarity ? "偏财" : "正财";
  }
  if (controlling[other.element] === dm.element) {
    return samePolarity ? "七杀" : "正官";
  }

  return "比肩";
}

// Soul Type metadata (from PRD Section 4.1.2)
const SOUL_TYPES: Record<
  HeavenlyStem,
  {
    englishName: string;
    essence: string;
    tagline: string;
    visualArchetype: string;
  }
> = {
  甲: {
    englishName: "The Pioneer",
    essence: "Tall tree — growth, ambition, upward drive",
    tagline:
      "You rise like an ancient tree, reaching for the sky with steady purpose.",
    visualArchetype: "A towering ancient tree with spreading canopy",
  },
  乙: {
    englishName: "The Weaver",
    essence: "Vine/flower — flexible, graceful, adaptive",
    tagline:
      "You adapt like ivy, finding beauty in every twist and turn of life.",
    visualArchetype: "Flowing ivy with delicate blossoms",
  },
  丙: {
    englishName: "The Radiant",
    essence: "Sun — warmth, visibility, leadership",
    tagline:
      "You shine like the sun, warming everyone who enters your orbit.",
    visualArchetype: "A blazing sun over mountains",
  },
  丁: {
    englishName: "The Luminary",
    essence: "Candle/star — gentle light, insight, intimacy",
    tagline:
      "You illuminate like starlight — gentle, deep, and endlessly perceptive.",
    visualArchetype: "A constellation of stars / candlelight",
  },
  戊: {
    englishName: "The Mountain",
    essence: "Mountain — stability, reliability, immovable",
    tagline:
      "You stand like a mountain — steady, dependable, a refuge for those who need you.",
    visualArchetype: "A massive stone mountain with clouds",
  },
  己: {
    englishName: "The Garden",
    essence: "Fertile soil — nurturing, receptive, transformative",
    tagline:
      "You nourish like rich soil — everything grows better in your presence.",
    visualArchetype: "A lush garden with rich dark soil",
  },
  庚: {
    englishName: "The Blade",
    essence: "Sword/axe — decisive, reforming, sharp",
    tagline:
      "You cut through confusion like a blade — clear, direct, and purposeful.",
    visualArchetype: "A gleaming sword or crystalline metal",
  },
  辛: {
    englishName: "The Jewel",
    essence: "Gem/jewelry — refined, precious, sensitive",
    tagline:
      "You shine like a precious gem — refined, rare, and deeply valuable.",
    visualArchetype: "A faceted gemstone catching light",
  },
  壬: {
    englishName: "The Ocean",
    essence: "Ocean/river — powerful, flowing, unstoppable",
    tagline:
      "You flow like the ocean — powerful, adaptable, and impossible to contain.",
    visualArchetype: "A vast ocean with deep currents",
  },
  癸: {
    englishName: "The Mist",
    essence: "Rain/dew — perceptive, nourishing, mysterious",
    tagline:
      "Still water runs deep. You absorb everything, reflecting the world with quiet clarity.",
    visualArchetype: "Morning mist over a still lake",
  },
};

// Month branch from solar term (simplified: use lunar month for MVP)
const MONTH_BRANCHES: EarthlyBranch[] = [
  "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑",
];

// Season names for month branches
const SEASON_NAMES: Record<EarthlyBranch, string> = {
  子: "Winter Water",
  丑: "Transitional Earth",
  寅: "Spring Wood",
  卯: "Spring Wood",
  辰: "Transitional Earth",
  巳: "Summer Fire",
  午: "Summer Fire",
  未: "Transitional Earth",
  申: "Autumn Metal",
  酉: "Autumn Metal",
  戌: "Transitional Earth",
  亥: "Winter Water",
};

/**
 * Calculate BaZi chart from birth data
 * Uses lunar-javascript for 干支 conversion
 */
export async function calculateBaZi(
  birthDate: string,
  birthTime: string,
  gender: "male" | "female"
): Promise<BaZiChart> {
  // Dynamic import to avoid SSR issues with lunar-javascript
  const { Solar } = await import("lunar-javascript");

  const [year, month, day] = birthDate.split("-").map(Number);
  const [hours = 12, minutes = 0] = birthTime.split(":").map(Number);
  const seconds = 0;

  // Use birth time so 起运 (qi yun) is calculated correctly from 节气
  const SolarTyped = Solar as {
    fromYmdHms: (y: number, m: number, d: number, h: number, mi: number, s: number) => {
      getLunar: () => {
        getYearInGanZhi: () => string;
        getMonthInGanZhi: () => string;
        getDayInGanZhi: () => string;
        getEightChar: () => {
          getYun: (gender: number, sect?: number) => {
            getDaYun: (n: number) => Array<{
              getStartYear: () => number;
              getEndYear: () => number;
              getStartAge: () => number;
              getGanZhi: () => string;
            }>;
          };
        };
      };
    };
  };
  const solar = SolarTyped.fromYmdHms(year, month, day, hours, minutes, seconds);
  const lunar = solar.getLunar();

  const yearGanZhi = lunar.getYearInGanZhi();
  const monthGanZhi = lunar.getMonthInGanZhi();
  const dayGanZhi = lunar.getDayInGanZhi();

  const hourIndex = Math.floor(((hours + minutes / 60) % 24) / 2);
  const hourBranch = EARTHLY_BRANCHES[hourIndex];
  const dayStem = dayGanZhi.substring(0, 1) as HeavenlyStem;
  const hourStem = HOUR_STEM_TABLE[dayStem][hourIndex];

  const yearPillar: Pillar = {
    stem: yearGanZhi.substring(0, 1) as HeavenlyStem,
    branch: yearGanZhi.substring(1, 2) as EarthlyBranch,
  };
  const monthPillar: Pillar = {
    stem: monthGanZhi.substring(0, 1) as HeavenlyStem,
    branch: monthGanZhi.substring(1, 2) as EarthlyBranch,
  };
  const dayPillar: Pillar = {
    stem: dayStem,
    branch: dayGanZhi.substring(1, 2) as EarthlyBranch,
  };
  const hourPillar: Pillar = {
    stem: hourStem,
    branch: hourBranch,
  };

  // Collect all stems for element balance
  const allStems: HeavenlyStem[] = [
    yearPillar.stem,
    monthPillar.stem,
    dayPillar.stem,
    hourPillar.stem,
    ...HIDDEN_STEMS[yearPillar.branch],
    ...HIDDEN_STEMS[monthPillar.branch],
    ...HIDDEN_STEMS[dayPillar.branch],
    ...HIDDEN_STEMS[hourPillar.branch],
  ];

  const elementCounts: ElementBalance = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };

  for (const stem of allStems) {
    elementCounts[STEM_MAP[stem].element]++;
  }

  const total = Object.values(elementCounts).reduce((a, b) => a + b, 0);
  const elementBalance: ElementBalance = {
    wood: total > 0 ? Math.round((elementCounts.wood / total) * 100) : 0,
    fire: total > 0 ? Math.round((elementCounts.fire / total) * 100) : 0,
    earth: total > 0 ? Math.round((elementCounts.earth / total) * 100) : 0,
    metal: total > 0 ? Math.round((elementCounts.metal / total) * 100) : 0,
    water: total > 0 ? Math.round((elementCounts.water / total) * 100) : 0,
  };

  // Normalize to sum to 100
  const sum = Object.values(elementBalance).reduce((a, b) => a + b, 0);
  if (sum !== 100 && total > 0) {
    elementBalance.water += 100 - sum; // Add remainder to water
  }

  // Ten Gods
  const tenGods = {
    yearStem: getTenGod(dayPillar.stem, yearPillar.stem),
    monthStem: getTenGod(dayPillar.stem, monthPillar.stem),
    hourStem: getTenGod(dayPillar.stem, hourPillar.stem),
  };

  // Dominant Ten God (simplified: use month as primary influence)
  const dominantTenGod = tenGods.monthStem;

  // Day Master strength (simplified heuristic)
  const dmElement = STEM_MAP[dayPillar.stem].element;
  const dmInSeason =
    SEASON_NAMES[monthPillar.branch].toLowerCase().includes(dmElement) ||
    (dmElement === "earth" &&
      SEASON_NAMES[monthPillar.branch].includes("Transitional"));
  const supportCount = allStems.filter(
    (s) =>
      STEM_MAP[s].element === dmElement ||
      (dmElement === "water" && STEM_MAP[s].element === "metal") ||
      (dmElement === "wood" && STEM_MAP[s].element === "water") ||
      (dmElement === "fire" && STEM_MAP[s].element === "wood") ||
      (dmElement === "earth" && STEM_MAP[s].element === "fire") ||
      (dmElement === "metal" && STEM_MAP[s].element === "earth")
  ).length;
  const controlCount = allStems.filter((s) => {
    const el = STEM_MAP[s].element;
    const controls: Record<Element, Element> = {
      wood: "metal",
      fire: "water",
      earth: "wood",
      metal: "fire",
      water: "earth",
    };
    return el === controls[dmElement];
  }).length;

  let dayMasterStrength: "strong" | "weak" | "balanced" = "balanced";
  if (dmInSeason && supportCount >= 3) dayMasterStrength = "strong";
  else if (!dmInSeason && controlCount >= 2) dayMasterStrength = "weak";

  // Favorable elements (simplified: elements that support or are controlled by day master)
  const favorableElements: Element[] = [];
  const unfavorableElements: Element[] = [];
  if (dayMasterStrength === "weak") {
    const supporting: Record<Element, Element> = {
      water: "metal",
      wood: "water",
      fire: "wood",
      earth: "fire",
      metal: "earth",
    };
    const fav = supporting[dmElement];
    if (fav) favorableElements.push(fav);
  }
  if (dayMasterStrength === "strong") {
    unfavorableElements.push(dmElement);
  }

  // Luck Pillars (大运) from lunar-javascript: proper 起运 (qi yun) from 节气, then 10-year pillars
  const eightChar = (lunar as { getEightChar: () => { getYun: (g: number, s?: number) => { getDaYun: (n: number) => Array<{ getStartYear: () => number; getEndYear: () => number; getStartAge: () => number; getGanZhi: () => string }> } } }).getEightChar();
  const yun = eightChar.getYun(gender === "male" ? 1 : 0, 1);
  const daYunList = yun.getDaYun(9);
  const luckPillars: LuckPillar[] = [];
  for (let i = 1; i <= 8; i++) {
    const d = daYunList[i];
    if (!d) continue;
    const ganZhi = d.getGanZhi();
    if (!ganZhi || ganZhi.length < 2) continue;
    luckPillars.push({
      startAge: d.getStartAge(),
      stem: ganZhi.substring(0, 1) as HeavenlyStem,
      branch: ganZhi.substring(1, 2) as EarthlyBranch,
      startYear: d.getStartYear(),
      endYear: d.getEndYear(),
    });
  }

  const STEM_PINYIN: Record<HeavenlyStem, string> = {
    甲: "Jiǎ", 乙: "Yǐ", 丙: "Bǐng", 丁: "Dīng", 戊: "Wù",
    己: "Jǐ", 庚: "Gēng", 辛: "Xīn", 壬: "Rén", 癸: "Guǐ",
  };
  const ELEMENT_CHINESE: Record<Element, string> = {
    wood: "木", fire: "火", earth: "土", metal: "金", water: "水",
  };

  const st = SOUL_TYPES[dayPillar.stem];
  const soulType: SoulType = {
    primaryType: st.englishName,
    dayMasterChinese: `${dayPillar.stem}${ELEMENT_CHINESE[dmElement]}`,
    dayMasterPinyin: STEM_PINYIN[dayPillar.stem],
    element: dmElement,
    polarity: STEM_MAP[dayPillar.stem].polarity,
    essence: st.essence,
    tagline: st.tagline,
    visualArchetype: st.visualArchetype,
    seasonModifier: SEASON_NAMES[monthPillar.branch],
    dominantTenGod,
    strength: dayMasterStrength,
  };

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster: dayPillar.stem,
    dayMasterElement: dmElement,
    dayMasterPolarity: STEM_MAP[dayPillar.stem].polarity,
    dayMasterStrength,
    hiddenStems: {
      year: HIDDEN_STEMS[yearPillar.branch],
      month: HIDDEN_STEMS[monthPillar.branch],
      day: HIDDEN_STEMS[dayPillar.branch],
      hour: HIDDEN_STEMS[hourPillar.branch],
    },
    tenGods,
    elementBalance,
    favorableElements: favorableElements.length ? favorableElements : [dmElement],
    unfavorableElements,
    luckPillars,
    soulType,
  };
}
