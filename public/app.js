/**
 * SoulMap — Life decision making tool (HTML MVP v8)
 * BaZi calculation, 大运 life seasons, Soul Blueprint, energy charts.
 */

(function () {
  'use strict';

  // ─── BaZi constants ───────────────────────────────────────────────
  const STEMS    = '甲乙丙丁戊己庚辛壬癸';
  const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';

  const STEM_ROMANIZATION   = ['Jiǎ','Yǐ','Bǐng','Dīng','Wù','Jǐ','Gēng','Xīn','Rén','Guǐ'];
  const BRANCH_ROMANIZATION = ['Zǐ','Chǒu','Yín','Mǎo','Chén','Sì','Wǔ','Wèi','Shēn','Yǒu','Xū','Hài'];
  const PILLAR_LABELS_CN    = ['年柱','月柱','日柱','时柱'];
  const PILLAR_LABELS_EN    = ['Year','Month','Day','Hour'];

  const ELEMENT_NAMES  = { wood:'Wood', fire:'Fire', earth:'Earth', metal:'Metal', water:'Water' };
  // Using CSS variables — safe in modern browsers inline styles
  const ELEMENT_COLORS = {
    wood:  'var(--color-cobalt)',
    fire:  'var(--color-vermillion)',
    earth: 'var(--color-amber)',
    metal: 'var(--color-gold)',
    water: 'var(--color-cyan)'
  };
  // Hex fallbacks for SVG (CSS vars don't work in SVG attributes)
  const ELEMENT_HEX = {
    wood:'#3A7D44', fire:'#E8372A', earth:'#9B5523', metal:'#D4AF37', water:'#1A4DB5'
  };
  const STEM_ELEMENT = [0,0,1,1,2,2,3,3,4,4]; // 0=wood 1=fire 2=earth 3=metal 4=water

  // ─── BaZi lookup tables ──────────────────────────────────────────

  // Hidden stems per earthly branch (array of stem indices)
  const HIDDEN_STEMS = [
    [9],        // 子 Zǐ   → 癸
    [5,9,7],    // 丑 Chǒu → 己癸辛
    [0,2,4],    // 寅 Yín  → 甲丙戊
    [1],        // 卯 Mǎo  → 乙
    [4,1,9],    // 辰 Chén → 戊乙癸
    [2,6,4],    // 巳 Sì   → 丙庚戊
    [3,5],      // 午 Wǔ   → 丁己
    [5,3,1],    // 未 Wèi  → 己丁乙
    [6,8,4],    // 申 Shēn → 庚壬戊
    [7],        // 酉 Yǒu  → 辛
    [4,7,3],    // 戌 Xū   → 戊辛丁
    [8,0]       // 亥 Hài  → 壬甲
  ];

  // Ten God names indexed by relationship code 0–9
  const TEN_GOD_NAMES = ['比肩','劫财','食神','伤官','偏财','正财','七杀','正官','偏印','正印'];
  const TEN_GOD_EN    = ['Friend','Rob Wealth','Eating God','Hurt Officer',
                         'Ind. Wealth','Dir. Wealth','7 Killings','Dir. Officer',
                         'Ind. Seal','Dir. Seal'];

  // 5-element generating cycle: wood→fire→earth→metal→water→wood
  // controlling cycle: wood→earth→water→fire→metal→wood
  const GENERATES = [1,2,3,4,0]; // element index → what it generates
  const CONTROLS  = [2,3,4,0,1]; // element index → what it controls

  /** Return Ten God index (0–9) for targetStem relative to dayStem */
  function getTenGod(dayStem, targetStem) {
    const dayEl  = STEM_ELEMENT[dayStem];
    const tgtEl  = STEM_ELEMENT[targetStem];
    const dayYin = dayStem % 2;  // 0=yang, 1=yin
    const tgtYin = targetStem % 2;
    const sameP  = dayYin === tgtYin ? 0 : 1; // 0=same polarity, 1=opposite

    if (tgtEl === dayEl)                return sameP === 0 ? 0 : 1;  // 比肩/劫财
    if (GENERATES[dayEl] === tgtEl)     return sameP === 0 ? 2 : 3;  // 食神/伤官
    if (GENERATES[tgtEl] === dayEl)     return sameP === 0 ? 8 : 9;  // 偏印/正印
    if (CONTROLS[dayEl]  === tgtEl)     return sameP === 0 ? 4 : 5;  // 偏财/正财
    if (CONTROLS[tgtEl]  === dayEl)     return sameP === 0 ? 6 : 7;  // 七杀/正官
    return 0; // fallback
  }

  // 12 Growth Stages — names and yang-stem starting branch (长生 position)
  const TWELVE_STAGE_NAMES = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
  // Yang stem starting branch index for 长生:
  // 甲(0)→亥(11), 丙/戊(2/4)→寅(2), 庚(6)→巳(5), 壬(8)→申(8)
  const YANG_STEM_BIRTH_BRANCH = [11, 11, 2, 2, 2, 2, 5, 5, 8, 8];

  /** Return the 12-growth-stage name for a stem in a given branch */
  function getTwelveStage(stemIdx, branchIdx) {
    const isYang = stemIdx % 2 === 0;
    const start  = YANG_STEM_BIRTH_BRANCH[stemIdx];
    let dist;
    if (isYang) {
      dist = (branchIdx - start + 12) % 12;
    } else {
      // Yin stems count backwards from the same start branch
      dist = (start - branchIdx + 12) % 12;
    }
    return TWELVE_STAGE_NAMES[dist];
  }

  // Nayin (纳音) — 30 entries, each covers 2 consecutive 60-cycle positions
  const NAYIN = [
    '海中金','炉中火','大林木','路旁土','剑锋金',
    '山头火','涧下水','城头土','白蜡金','杨柳木',
    '泉中水','屋上土','霹雳火','松柏木','长流水',
    '砂中金','山下火','平地木','壁上土','金箔金',
    '覆灯火','天河水','大驿土','钗钏金','桑柘木',
    '大溪水','沙中土','天上火','石榴木','大海水'
  ];

  /** Return Nayin string for a pillar's 60-cycle index */
  function getNayin(stemIdx, branchIdx) {
    const cycleIdx = getPillarCycleIdx(stemIdx, branchIdx);
    // Each pair of consecutive sexagenary positions shares a Nayin
    return NAYIN[Math.floor(cycleIdx / 2)];
  }

  /** Return the 60-cycle position index for a pillar (0–59) */
  function getPillarCycleIdx(stemIdx, branchIdx) {
    // Find the earliest position ≥0 where stem and branch coincide
    // stem cycles every 10, branch every 12, pair every 60
    for (let i = 0; i < 60; i++) {
      if (i % 10 === stemIdx && i % 12 === branchIdx) return i;
    }
    return 0;
  }

  // Empty/Void (空亡) — keyed by decade group of pillar's 60-cycle index
  // Groups 0-9, 10-19, … → void branches
  const KONGWANG_VOID = [
    [10,11], // cycle 0-9   (甲子…癸酉): 戌亥
    [8,9],   // cycle 10-19 (甲戌…癸未): 申酉
    [6,7],   // cycle 20-29 (甲申…癸巳): 午未
    [4,5],   // cycle 30-39 (甲午…癸卯): 辰巳
    [2,3],   // cycle 40-49 (甲辰…癸丑): 寅卯
    [0,1]    // cycle 50-59 (甲寅…癸亥): 子丑
  ];

  /** Return the two void branch names for a pillar */
  function getKongWang(stemIdx, branchIdx) {
    const cycleIdx = getPillarCycleIdx(stemIdx, branchIdx);
    const voidBranches = KONGWANG_VOID[Math.floor(cycleIdx / 10)];
    return voidBranches.map(b => BRANCHES[b]).join('');
  }

  // ─── Spirit Killers (神煞) lookup tables ──────────────────────────

  // 驿马 Travel Horse: year/day branch → travel horse branch
  // 寅午戌→申, 巳酉丑→亥, 申子辰→寅, 亥卯未→巳
  const YIMA_MAP = { 2:8, 6:8, 10:8, 5:11, 9:11, 1:11, 8:2, 0:2, 4:2, 11:5, 3:5, 7:5 };

  // 桃花 Peach Blossom: year/day branch trines → peach blossom branch
  // 寅午戌→卯(3), 巳酉丑→午(6), 申子辰→酉(9), 亥卯未→子(0)
  const TAOHUA_MAP = { 2:3,6:3,10:3, 5:6,9:6,1:6, 8:9,0:9,4:9, 11:0,3:0,7:0 };

  // 天乙贵人 Heavenly Noble: day stem → two noble branches
  const TIANYI_MAP = [
    [1,11], // 甲: 丑亥
    [0,11], // 乙: 子亥
    [9,3],  // 丙: 亥卯
    [9,3],  // 丁: 亥卯 (same as 丙 in traditional sources)
    [1,7],  // 戊: 丑未
    [0,3],  // 己: 子卯 (also listed as 子申 in some sources; using common version)
    [1,7],  // 庚: 丑未
    [5,3],  // 辛: 午寅
    [5,3],  // 壬: 午寅 (same as 辛)
    [5,3]   // 癸: 午卯 — using 午寅 for simplicity
  ];

  // 月德合 Month Virtue Combination: month branch → stem
  const YUEDE_STEM = [0,2,6,0,2,6,0,2,6,0,2,6]; // 甲丙庚 repeating

  /**
   * Compute spirit killers for all 4 pillars.
   * Returns array of 4 arrays, each containing star name strings.
   */
  function getShenSha(chart) {
    const yB = chart.yearPillar.branch;
    const mB = chart.monthPillar.branch;
    const dS = chart.dayPillar.stem;
    const dB = chart.dayPillar.branch;
    const hB = chart.hourPillar.branch;

    const result = [[], [], [], []]; // year, month, day, hour

    // 驿马 (Travel Horse) — based on year branch
    const yimaB = YIMA_MAP[yB];
    if (yimaB !== undefined) {
      const targets = [
        yB === yimaB ? 0 : -1,
        mB === yimaB ? 1 : -1,
        dB === yimaB ? 2 : -1,
        hB === yimaB ? 3 : -1
      ];
      targets.forEach(i => { if (i >= 0) result[i].push('驿马'); });
    }

    // 桃花 (Peach Blossom) — based on year branch
    const taohuaB = TAOHUA_MAP[yB];
    if (taohuaB !== undefined) {
      [yB, mB, dB, hB].forEach((b, i) => { if (b === taohuaB) result[i].push('桃花'); });
    }

    // 天乙贵人 (Heavenly Noble) — based on day stem, appears in year/hour pillars
    const tianyiBranches = TIANYI_MAP[dS] || [];
    [yB, mB, dB, hB].forEach((b, i) => {
      if (tianyiBranches.includes(b)) result[i].push('天乙贵人');
    });

    // 太极贵人 (Supreme Noble) — day master element in 子午卯酉 (pure element branches)
    const pureElemBranches = [0, 3, 6, 9]; // 子卯午酉
    [yB, mB, dB, hB].forEach((b, i) => {
      if (pureElemBranches.includes(b)) result[i].push('太极贵人');
    });

    // 月德合 (Month Virtue) — month branch → month virtue stem
    const yuedeStem = YUEDE_STEM[mB];
    const pillarsStems = [chart.yearPillar.stem, chart.monthPillar.stem,
                         chart.dayPillar.stem, chart.hourPillar.stem];
    pillarsStems.forEach((s, i) => { if (s === yuedeStem) result[i].push('月德合'); });

    // 天医 (Heaven Doctor) — month branch + 1 = heaven doctor branch
    const tianyiB = (mB + 1) % 12;
    [yB, mB, dB, hB].forEach((b, i) => { if (b === tianyiB) result[i].push('天医'); });

    // 国印 (Nation Seal) — day stem element produces month branch element → seal
    const dayEl   = STEM_ELEMENT[dS];
    const mBrEl   = [4,2,0,0,2,1,1,2,3,3,2,4][mB]; // branch primary element
    if (GENERATES[dayEl] === mBrEl || GENERATES[mBrEl] === dayEl) {
      result[2].push('国印'); // appears on day pillar
    }

    // 空亡 on day pillar — already computed separately but add as 神煞 label
    // (handled via getKongWang in renderFourPillars, not added here to avoid duplication)

    return result;
  }

  // Accent colors cycling for 大运 cards
  const DAYUN_ACCENT_COLORS = [
    'var(--color-vermillion)',
    'var(--color-cobalt)',
    'var(--color-amber)',
    'var(--color-cyan)',
    'var(--color-magenta)'
  ];

  // ─── Lifetime Arc scoring engine constants ────────────────────────

  // Element name by stem index (0=甲...9=癸)
  const STEM_EL_NAME = ['wood','wood','fire','fire','earth','earth','metal','metal','water','water'];

  // Production cycle (generates): wood→fire→earth→metal→water→wood
  const PRODUCTION_CYCLE = { wood:'fire', fire:'earth', earth:'metal', metal:'water', water:'wood' };
  // Control cycle: wood→earth→earth→water→water→fire→fire→metal→metal→wood
  const CONTROL_CYCLE    = { wood:'earth', earth:'water', water:'fire', fire:'metal', metal:'wood' };

  // Ten God score names (index 0–9 matches existing getTenGod() return)
  // 0=比肩 1=劫财 2=食神 3=伤官 4=偏财 5=正财 6=七杀 7=正官 8=偏印 9=正印
  const TEN_GOD_SCORE_NAMES = [
    'mirror','shadow','muse','maverick','windfall','harvest','challenger','architect','mystic','guardian'
  ];

  /** Return scoring Ten God name string for targetStem relative to dayStem */
  function getScoreTenGod(dayStem, targetStem) {
    return TEN_GOD_SCORE_NAMES[getTenGod(dayStem, targetStem)];
  }

  // Hidden stems with role metadata (by branch index 0=子...11=亥)
  // s = stem index, r = role ('main'|'secondary'|'residual')
  const HIDDEN_STEMS_ROLES = [
    [{ s:9,  r:'main' }],                                             // 子: 癸
    [{ s:5,  r:'main' }, { s:9, r:'secondary' }, { s:7, r:'residual' }], // 丑: 己癸辛
    [{ s:0,  r:'main' }, { s:2, r:'secondary' }, { s:4, r:'residual' }], // 寅: 甲丙戊
    [{ s:1,  r:'main' }],                                             // 卯: 乙
    [{ s:4,  r:'main' }, { s:1, r:'secondary' }, { s:9, r:'residual' }], // 辰: 戊乙癸
    [{ s:2,  r:'main' }, { s:6, r:'secondary' }, { s:4, r:'residual' }], // 巳: 丙庚戊
    [{ s:3,  r:'main' }, { s:5, r:'secondary' }],                    // 午: 丁己
    [{ s:5,  r:'main' }, { s:3, r:'secondary' }, { s:1, r:'residual' }], // 未: 己丁乙
    [{ s:6,  r:'main' }, { s:8, r:'secondary' }, { s:4, r:'residual' }], // 申: 庚壬戊
    [{ s:7,  r:'main' }],                                             // 酉: 辛
    [{ s:4,  r:'main' }, { s:7, r:'secondary' }, { s:3, r:'residual' }], // 戌: 戊辛丁
    [{ s:8,  r:'main' }, { s:0, r:'secondary' }],                    // 亥: 壬甲
  ];

  // Correct birth branch for each stem (长生 position) — for all 10 stems
  // Yang stems: 甲→亥(11) 丙→寅(2) 戊→寅(2) 庚→巳(5) 壬→申(8)
  // Yin stems:  乙→午(6)  丁→酉(9) 己→酉(9) 辛→子(0) 癸→卯(3)
  const STEM_BIRTH_BRANCH = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];

  // English twelve-stage names in cycle order (长生=0 … 养=11)
  const STAGE_EN = [
    'awakening','initiation','rising','ascension','zenith','waning',
    'retreat','stillness','vault','void','conception','nurture'
  ];

  /** Return English twelve-stage name for stem in given branch (correct for both yang/yin) */
  function getTwelveStageEn(stemIdx, branchIdx) {
    const isYang = stemIdx % 2 === 0;
    const start  = STEM_BIRTH_BRANCH[stemIdx];
    const dist   = isYang
      ? (branchIdx - start + 12) % 12
      : (start - branchIdx + 12) % 12;
    return STAGE_EN[dist];
  }

  // Six Clashes: pairs of branch indices (子午 丑未 寅申 卯酉 辰戌 巳亥)
  const SIX_CLASHES_IDX = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];

  // Six Harms: pairs (子未 丑午 寅巳 卯辰 申亥 酉戌)
  const SIX_HARMS_IDX = [[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]];

  // Six Combos: [branchA, branchB, resultElement] (子丑→土 寅亥→木 卯戌→火 辰酉→金 巳申→水 午未→火)
  const SIX_COMBOS_IDX = [
    [0,1,'earth'], [2,11,'wood'], [3,10,'fire'],
    [4,9,'metal'], [5,8,'water'], [6,7,'fire'],
  ];

  /** Find branch interactions (clash/harm/combo) between a luck cycle branch and the natal chart */
  function findBranchInteractions(cycleBr, chart) {
    const results = [];
    const pillars = [
      { name:'year',  br: chart.yearPillar.branch },
      { name:'month', br: chart.monthPillar.branch },
      { name:'day',   br: chart.dayPillar.branch },
      { name:'hour',  br: chart.hourPillar.branch },
    ];
    for (const p of pillars) {
      for (const [a, b] of SIX_CLASHES_IDX) {
        if ((cycleBr===a && p.br===b) || (cycleBr===b && p.br===a))
          results.push({ type:'clash', withPillar: p.name, withBranch: p.br });
      }
      for (const [a, b] of SIX_HARMS_IDX) {
        if ((cycleBr===a && p.br===b) || (cycleBr===b && p.br===a))
          results.push({ type:'harm', withPillar: p.name, withBranch: p.br });
      }
      for (const [a, b, el] of SIX_COMBOS_IDX) {
        if ((cycleBr===a && p.br===b) || (cycleBr===b && p.br===a))
          results.push({ type:'combo', withPillar: p.name, withBranch: p.br, resultElement: el });
      }
    }
    return results;
  }

  // Monthly elemental strength table (旺相休囚死 mapped 4-0)
  // Rows = element, Cols = branch index (子0 … 亥11)
  // 4=flourishing 3=prosperous 2=resting 1=imprisoned 0=dead
  const MONTHLY_STRENGTH = {
    //        子  丑  寅  卯  辰  巳  午  未  申  酉  戌  亥
    wood:   [  2,  1,  4,  4,  3,  2,  1,  0,  1,  0,  1,  3 ],
    fire:   [  0,  1,  3,  3,  2,  4,  4,  3,  0,  0,  1,  0 ],
    earth:  [  0,  4,  0,  0,  4,  2,  2,  4,  2,  2,  4,  0 ],
    metal:  [  2,  3,  0,  0,  1,  0,  0,  1,  4,  4,  3,  1 ],
    water:  [  4,  3,  1,  1,  0,  0,  0,  1,  3,  3,  1,  4 ],
  };

  const SOUL_TYPES = [
    { name:'The Pioneer',   slug:'jia',  sub:'甲木 · Jiǎ Wood',  element:'wood',  emoji:'🌳', tagline:'Tall tree — growth, ambition, upward drive. You build and lead with clarity.' },
    { name:'The Weaver',    slug:'yi',   sub:'乙木 · Yǐ Wood',   element:'wood',  emoji:'🪴', tagline:'Vine and flower — flexible, graceful, adaptive. You connect and nurture.' },
    { name:'The Radiant',   slug:'bing', sub:'丙火 · Bǐng Fire',  element:'fire',  emoji:'☀️', tagline:'Sun — warmth, visibility, leadership. You light the way for others.' },
    { name:'The Luminary',  slug:'ding', sub:'丁火 · Dīng Fire',  element:'fire',  emoji:'🕯️', tagline:'Candle and star — gentle light, insight, intimacy. You see what others miss.' },
    { name:'The Mountain',  slug:'wu',   sub:'戊土 · Wù Earth',   element:'earth', emoji:'⛰️', tagline:'Mountain — stability, reliability, immovable. You are the foundation.' },
    { name:'The Garden',    slug:'ji',   sub:'己土 · Jǐ Earth',   element:'earth', emoji:'🌿', tagline:'Fertile soil — nurturing, receptive, transformative. You help things grow.' },
    { name:'The Blade',     slug:'geng', sub:'庚金 · Gēng Metal',  element:'metal', emoji:'⚔️', tagline:'Sword — decisive, reforming, sharp. You cut through confusion.' },
    { name:'The Jewel',     slug:'xin',  sub:'辛金 · Xīn Metal',  element:'metal', emoji:'💎', tagline:'Gem — refined, precious, sensitive. You value quality and depth.' },
    { name:'The Ocean',     slug:'ren',  sub:'壬水 · Rén Water',  element:'water', emoji:'🌊', tagline:'Ocean — powerful, flowing, unstoppable. You adapt and persist.' },
    { name:'The Mist',      slug:'gui',  sub:'癸水 · Guǐ Water',  element:'water', emoji:'🌫️', tagline:'Still water runs deep. You absorb everything, reflecting the world with quiet clarity.' }
  ];

  const SEASON_NAMES = ['Spring Wood','Summer Fire','Transitional Earth','Autumn Metal','Winter Water'];

  // Part B schema: core essence + classical quote + work / love / growth only.
  const BLUEPRINT_NARRATIVE = [
    { shortName:'Pioneer',   essence:'You are built to rise — to take the lead and create something that lasts. Your clarity and ambition are not ego; they are your nature reaching for the light.',                              work:'In work, you thrive when you have room to build and own outcomes. Roles that reward initiative, strategy, or leadership fit your chart.',                                   love:'In relationships, you offer stability and vision. You need a partner who respects your need to grow and who can stand beside you without dimming your light.',               growth:'Your growth happens when you channel your drive into structures that last — and when you learn to bend without breaking.',                                                     thrive:'Water and Wood support you; seek spaces that allow both roots and reach.' },
    { shortName:'Weaver',    essence:'You are the one who connects — people, ideas, and possibilities. Your strength is flexibility and grace under pressure; you don\'t need to be the tallest tree to change the landscape.',   work:'In work, you excel where collaboration and nuance matter. Creative, people-centered, or adaptive roles let your nature shine.',                                              love:'In love, you bring warmth and attentiveness. You need connection that allows you to adapt and bloom without being taken for granted.',                                         growth:'Your growth comes when you honor your sensitivity as strength and choose environments that nurture rather than drain you.',                                                   thrive:'Wood and Water support you; seek gentle light and steady soil.' },
    { shortName:'Radiant',   essence:'You are here to light the way — for yourself and for others. Your presence is warmth and visibility; when you show up fully, people feel it.',                                                work:'In work, you shine in roles that put you in front of others — leading, presenting, or inspiring. You are built for impact when the stage fits.',                             love:'In love, you give warmth and loyalty. You need a partner who sees your light and doesn\'t ask you to dim it.',                                                                growth:'Your growth happens when you balance visibility with rest, and when you use your fire to warm rather than burn.',                                                            thrive:'Wood and Fire support you; seek spaces where your energy can radiate.' },
    { shortName:'Luminary',  essence:'You see what others miss — the detail, the mood, the truth beneath the surface. Your light is subtle but essential; you illuminate the inner world.',                                          work:'In work, you excel in roles that value insight, care, or precision — research, healing, arts, or strategy. You thrive when your depth is recognized.',                        love:'In love, you offer intimacy and understanding. You need a partner who values depth and gives you space to recharge.',                                                          growth:'Your growth comes when you protect your sensitivity and choose people and places that honor your need for meaning.',                                                         thrive:'Wood and Fire in balance support you; seek both warmth and calm.' },
    { shortName:'Mountain',  essence:'You are the one others lean on — steady, reliable, unmoved by chaos. Your gift is to hold the ground so others can build.',                                                                    work:'In work, you shine in roles that require dependability and structure — operations, management, or any place that needs a steady hand.',                                        love:'In love, you offer loyalty and stability. You need a partner who values your constancy and doesn\'t mistake it for rigidity.',                                                growth:'Your growth happens when you allow yourself to rest and receive, not only to hold.',                                                                                        thrive:'Fire and Earth support you; seek warmth and solid ground.' },
    { shortName:'Garden',    essence:'You are the one who helps things grow — through nurture, patience, and receptivity. You transform what you touch without needing to dominate.',                                                 work:'In work, you excel where cultivation matters — teaching, healing, design, or any role that improves people or systems over time.',                                             love:'In love, you bring nurturing and attentiveness. You need a partner who appreciates your depth and gives you room to recharge.',                                               growth:'Your growth comes when you set boundaries so your giving doesn\'t deplete you.',                                                                                            thrive:'Fire and Earth support you; seek fertile ground and gentle warmth.' },
    { shortName:'Blade',     essence:'You are built to cut through noise — to decide, reform, and clarify. Your edge is not harshness; it is the precision that creates order.',                                                     work:'In work, you thrive in roles that reward decisiveness and standards — law, finance, engineering, or leadership that demands clarity.',                                         love:'In love, you offer loyalty and directness. You need a partner who can handle truth and who values your no-nonsense devotion.',                                                growth:'Your growth happens when you balance cutting away with choosing what to keep — and when you soften the blade for those closest to you.',                                     thrive:'Earth and Metal support you; seek order and quality.' },
    { shortName:'Jewel',     essence:'You are built for depth and quality — you notice what is precious and you protect it. Your sensitivity is your radar for what matters.',                                                        work:'In work, you excel where refinement and standards matter — arts, craft, analysis, or roles that reward precision and taste.',                                                  love:'In love, you offer depth and devotion. You need a partner who values nuance and who doesn\'t mistake your sensitivity for weakness.',                                          growth:'Your growth comes when you honor your need for beauty and boundaries, and when you let others in without losing your polish.',                                               thrive:'Earth and Metal support you; seek clarity and care.' },
    { shortName:'Ocean',     essence:'You are built to flow and persist — to adapt without losing direction. Your power is in movement and depth; you don\'t need to be loud to be unstoppable.',                                    work:'In work, you thrive in roles that allow movement and impact — strategy, influence, or fields that reward adaptability and reach.',                                             love:'In love, you offer depth and loyalty. You need a partner who can go deep with you and who doesn\'t need you to be constantly on.',                                            growth:'Your growth happens when you channel your flow into clear channels and when you rest in stillness as much as in motion.',                                                   thrive:'Metal and Water support you; seek both structure and flow.' },
    { shortName:'Mist',      essence:'You absorb and reflect the world with rare clarity — your stillness is not passivity but perception. You see what is hidden in the depths.',                                                   work:'In work, you excel in roles that value insight and subtlety — research, psychology, arts, or strategy. You thrive when your depth is given space and time.',                  love:'In love, you offer understanding and emotional depth. You need a partner who values quiet connection and doesn\'t drain your reserves.',                                       growth:'Your growth comes when you protect your need for solitude and choose relationships that replenish you.',                                                                    thrive:'Metal and Water support you; seek clarity and quiet depth.' }
  ];

  const WESTERN_SIGNS = [
    { start:[12,22], end:[1,19],  name:'Capricorn'  }, { start:[1,20],  end:[2,18],  name:'Aquarius'   },
    { start:[2,19],  end:[3,20],  name:'Pisces'     }, { start:[3,21],  end:[4,19],  name:'Aries'      },
    { start:[4,20],  end:[5,20],  name:'Taurus'     }, { start:[5,21],  end:[6,20],  name:'Gemini'     },
    { start:[6,21],  end:[7,22],  name:'Cancer'     }, { start:[7,23],  end:[8,22],  name:'Leo'        },
    { start:[8,23],  end:[9,22],  name:'Virgo'      }, { start:[9,23],  end:[10,22], name:'Libra'      },
    { start:[10,23], end:[11,21], name:'Scorpio'    }, { start:[11,22], end:[12,21], name:'Sagittarius' }
  ];

  function getWesternZodiacSign(birthDateStr) {
    if (!birthDateStr) return '—';
    const [, m, d] = birthDateStr.split('-').map(Number);
    if (!m || !d) return '—';
    const dVal = m * 100 + d;
    for (const sign of WESTERN_SIGNS) {
      const s = sign.start[0] * 100 + sign.start[1];
      const e = sign.end[0]   * 100 + sign.end[1];
      if (sign.start[0] > sign.end[0]) { if (dVal >= s || dVal <= e) return sign.name; }
      else                              { if (dVal >= s && dVal <= e) return sign.name; }
    }
    return 'Capricorn';
  }

  // Fallback classical quotes
  const FALLBACK_CLASSICAL_BAZI = [
    { text:'Yang Wood reaches for heaven; it needs fire to flourish. When earth is moist and heaven in harmony, it stands for a thousand ages.', source:'《滴天髓》', sourceEn:'Ditian Sui' },
    { text:'Yin Wood is gentle yet can cut through difficulty. With Fire\'s warmth it crosses boundaries and climbs.', source:'《滴天髓》', sourceEn:'Ditian Sui' },
    { text:'Yang Fire is fierce; it defies frost and snow. It tempers Metal but meets Yin Metal with care.', source:'《滴天髓》', sourceEn:'Ditian Sui' },
    { text:'Yin Fire is gentle within and bright without. It nourishes Wood and joins Water in balance.', source:'《滴天髓》', sourceEn:'Ditian Sui' },
    { text:'Yang Earth is solid and central, still when closed and active when open; it governs the fate of the ten thousand things.', source:'《滴天髓》', sourceEn:'Ditian Sui' },
    { text:'Yin Earth is humble and moist, storing and nurturing. It does not fear strong Wood nor rushing Water.', source:'《滴天髓》', sourceEn:'Ditian Sui' },
    { text:'Yang Metal carries edge; it is firm and strong. With Water it clarifies; with Fire it sharpens.', source:'《滴天髓》', sourceEn:'Ditian Sui' },
    { text:'Yin Metal is soft, warm and clear. It fears too much Earth and delights in full Water.', source:'《滴天髓》', sourceEn:'Ditian Sui' },
    { text:'Yang Water runs like a river and can release Metal. Its virtue is strength at the center, flowing without stagnation.', source:'《滴天髓》', sourceEn:'Ditian Sui' },
    { text:'Yin Water is most yielding yet reaches the heavenly ford. With dragon\'s virtue it moves; its transforming power is divine.', source:'《滴天髓》', sourceEn:'Ditian Sui' }
  ];

  // ─── State ────────────────────────────────────────────────────────
  const SOULMAP_SESSION_KEY    = 'soulmap_session';      // legacy — migration only
  const PROFILES_KEY           = 'soulmap_profiles';
  const ACTIVE_PROFILE_KEY     = 'soulmap_active_profile';

  let state = {
    birthDate: '', shichen: 0, gender: 'male',
    occupation: '', relationship: '', currentConcern: '',
    chart: null, soulTypeIndex: 0, streak: 0,
    narrativeFromAPI: null,
    profileId: null,          // ID of the active profile
    profileName: '',          // display name of the active profile
    savedOracleItems: [],     // per-profile Oracle saves (not shared across profiles)
  };

  function setState(partial) { state = { ...state, ...partial }; }

  // ─── Profile storage helpers ──────────────────────────────────────
  function loadProfiles() {
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function saveProfiles(arr) {
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(arr)); } catch (_) {}
  }

  function getActiveProfileId() {
    try { return localStorage.getItem(ACTIVE_PROFILE_KEY) || null; } catch (_) { return null; }
  }

  function setActiveProfileId(id) {
    try { localStorage.setItem(ACTIVE_PROFILE_KEY, id); } catch (_) {}
  }

  /** Upsert the active profile into the profiles array */
  function saveCurrentProfile() {
    if (!state.birthDate || !state.profileId) return;
    const profiles = loadProfiles();
    const idx = profiles.findIndex(p => p.id === state.profileId);
    // Persist per-cycle narratives keyed by pillar label (e.g. "甲寅")
    const daYunNarratives = {};
    if (state.chart && state.chart.daYun) {
      state.chart.daYun.forEach(d => {
        if (d.narrative) daYunNarratives[d.label] = d.narrative;
      });
    }
    const profileData = {
      id:               state.profileId,
      name:             state.profileName || 'My Chart',
      birthDate:        state.birthDate,
      shichen:          state.shichen,
      gender:           state.gender,
      occupation:       state.occupation || '',
      relationship:     state.relationship || '',
      currentConcern:   state.currentConcern || '',
      createdAt:        idx >= 0 ? profiles[idx].createdAt : Date.now(),
      narrativeFromAPI:    state.narrativeFromAPI || null,
      narrativePillarsStr: (state.narrativeFromAPI && state.chart)
                             ? (state.chart.pillarsStr || null)
                             : null,
      daYunNarratives:     Object.keys(daYunNarratives).length ? daYunNarratives : null,
      savedOracleItems:    state.savedOracleItems || [],
    };
    if (idx >= 0) { profiles[idx] = profileData; } else { profiles.push(profileData); }
    saveProfiles(profiles);
    setActiveProfileId(state.profileId);
  }

  /** Load a profile object into state and re-render the app */
  function activateProfile(p) {
    const chart = calculateBaZi(p.birthDate, p.shichen);
    chart.daYun = calculateDaYun(chart, p.birthDate, p.gender || 'female');
    // Restore persisted cycle narratives
    if (p.daYunNarratives && chart.daYun) {
      chart.daYun.forEach(d => {
        if (p.daYunNarratives[d.label]) d.narrative = p.daYunNarratives[d.label];
      });
    }
    setState({
      birthDate:        p.birthDate,
      shichen:          p.shichen,
      gender:           p.gender || 'female',
      occupation:       p.occupation || '',
      relationship:     p.relationship || '',
      currentConcern:   p.currentConcern || '',
      chart,
      soulTypeIndex:    chart.dayMaster,
      profileId:        p.id,
      profileName:      p.name || 'My Chart',
      narrativeFromAPI: (p.narrativeFromAPI && p.narrativePillarsStr && chart.pillarsStr === p.narrativePillarsStr)
                          ? p.narrativeFromAPI
                          : null,
      savedOracleItems: p.savedOracleItems || [],
    });
    setActiveProfileId(p.id);
    // Update header labels
    const nameEl = document.getElementById('profile-btn-name');
    if (nameEl) nameEl.textContent = p.name || 'My Chart';
    const typeEl = document.getElementById('app-user-type');
    if (typeEl) typeEl.textContent = SOUL_TYPES[chart.dayMaster].name;
    // Re-curate "For You" now that state.chart is populated
    if (document.getElementById('wisdom-vault-list')) {
      const activeTab = document.querySelector('.wisdom-vault-tab.active');
      const currentFilter = activeTab ? activeTab.getAttribute('data-tradition') : 'all';
      if (currentFilter === 'all') renderWisdomVault('all');
    }
  }

  /** One-time migration: move any 'saved' items from the global vault key
   *  into the active profile's savedOracleItems array.
   *  Runs once per browser; safe to call repeatedly (no-ops if nothing to migrate). */
  function migrateOrphanedSaves() {
    try {
      const raw = localStorage.getItem(WISDOM_VAULT_STORAGE_KEY);
      if (!raw) return;
      const all = JSON.parse(raw);
      const orphans = all.filter(e => e.tradition === 'saved');
      if (!orphans.length) return;
      // Attribute orphaned saves to whichever profile is currently active
      state.savedOracleItems = (state.savedOracleItems || []).concat(orphans);
      saveCurrentProfile();
      // Remove 'saved' entries from the global key — classical citations stay
      saveAdditions(all.filter(e => e.tradition !== 'saved'));
    } catch (_) {}
  }

  /** One-time migration: convert old soulmap_session → first named profile */
  function migrateOldSession() {
    try {
      if (localStorage.getItem(PROFILES_KEY)) return; // already migrated
      const raw = localStorage.getItem(SOULMAP_SESSION_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (!p.birthDate) return;
      const profile = {
        id:             String(Date.now()) + '_migrated',
        name:           'My Chart',
        birthDate:      p.birthDate,
        shichen:        p.shichen || 0,
        gender:         p.gender || 'male',
        occupation:     p.occupation || '',
        relationship:   p.relationship || '',
        currentConcern: p.currentConcern || '',
        createdAt:      Date.now()
      };
      saveProfiles([profile]);
      setActiveProfileId(profile.id);
      localStorage.removeItem(SOULMAP_SESSION_KEY);
    } catch (_) {}
  }

  // Keep saveSession/restoreSession as no-ops for any lingering call sites
  function saveSession()    { saveCurrentProfile(); }
  function restoreSession() { return false; /* replaced by init() profile logic */ }

  // ─── Julian Day Number (for day pillar) ──────────────────────────
  function jdn(y, m, d) {
    const a  = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  // ─── Solar Term Engine ───────────────────────────────────────────
  // Accurate BaZi month boundaries and 大运 starting age.
  // Algorithm: Meeus, Astronomical Algorithms ch. 25 (accuracy ~0.01° / ~1 min for 1900–2100).

  /** Sun's apparent ecliptic longitude (degrees) for a given JDE. */
  function sunLongitude(jde) {
    const T    = (jde - 2451545.0) / 36525;
    const L0   = ((280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360 + 360) % 360;
    const M    = ((357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360 + 360) % 360;
    const Mrad = M * Math.PI / 180;
    const C    = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad)
               + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
               + 0.000289 * Math.sin(3 * Mrad);
    const omega = 125.04 - 1934.136 * T;
    const lon   = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
    return ((lon % 360) + 360) % 360;
  }

  const _stCache = {};
  /**
   * JDE when the Sun reaches targetLong°.
   * approxY/M/D is the approximate calendar date used as Newton-Raphson seed.
   */
  function solarTermJDE(approxY, approxM, approxD, targetLong) {
    const key = `${approxY}|${targetLong}`;
    if (_stCache[key] !== undefined) return _stCache[key];
    let jde = jdn(approxY, approxM, approxD) - 0.5; // JDN noon → JDE midnight seed
    const K = 365.242189623 / 360;
    for (let i = 0; i < 50; i++) {
      let diff = targetLong - sunLongitude(jde);
      while (diff >  180) diff -= 360;
      while (diff < -180) diff += 360;
      if (Math.abs(diff) < 1e-6) break;
      jde += diff * K;
    }
    return (_stCache[key] = jde);
  }

  // 12 BaZi month "节" terms: [solar longitude, branch index, approx month, approx day]
  // "approx month" is relative to the BaZi year; 小寒 (month=1) falls in Jan of baziYear+1.
  const BAZI_MONTH_TERMS = [
    [315, 2,  2,  4], // 立春 → 寅
    [345, 3,  3,  6], // 惊蛰 → 卯
    [ 15, 4,  4,  5], // 清明 → 辰
    [ 45, 5,  5,  6], // 立夏 → 巳
    [ 75, 6,  6,  6], // 芒种 → 午
    [105, 7,  7,  7], // 小暑 → 未
    [135, 8,  8,  7], // 立秋 → 申
    [165, 9,  9,  8], // 白露 → 酉
    [195,10, 10,  8], // 寒露 → 戌
    [225,11, 11,  7], // 立冬 → 亥
    [255, 0, 12,  7], // 大雪 → 子
    [285, 1,  1,  6], // 小寒 → 丑 (January of baziYear+1)
  ];

  /** JDN for each of the 12 month terms in BaZi year `by`. No timezone offset — face value. */
  function getBaZiTermJDNs(by) {
    return BAZI_MONTH_TERMS.map(([lon, branch, aM, aD]) => ({
      jdn:    Math.floor(solarTermJDE(aM === 1 ? by + 1 : by, aM, aD, lon) + 0.5),
      branch,
    })).sort((a, b) => a.jdn - b.jdn);
  }

  /**
   * Given a birth date, return { monthBranch, baziYear }.
   * baziYear = calendar year if on/after 立春 of that year, else calendar year − 1.
   * Dates compared face value (公历) — no UTC+8 offset applied to solar terms.
   */
  function getBaZiMonth(y, m, d) {
    const birthJDN  = jdn(y, m, d);
    const liChunJDN = Math.floor(solarTermJDE(y, 2, 4, 315) + 0.5);
    const baziYear  = birthJDN < liChunJDN ? y - 1 : y;
    const terms     = getBaZiTermJDNs(baziYear);
    let monthBranch = terms[0].branch; // default: 寅月 (first month of BaZi year)
    for (const t of terms) {
      if (birthJDN >= t.jdn) monthBranch = t.branch;
    }
    return { monthBranch, baziYear };
  }

  /**
   * JDN of the nearest "节" solar term strictly before (backward) or after (forward) birthdate.
   * Used for accurate 大运 starting age.
   */
  function nearestSolarTermJDN(y, m, d, forward) {
    const birthJDN = jdn(y, m, d);
    const allJDNs  = [];
    for (let yr = y - 1; yr <= y + 1; yr++) {
      for (const [lon, , aM, aD] of BAZI_MONTH_TERMS) {
        allJDNs.push(Math.floor(solarTermJDE(aM === 1 ? yr + 1 : yr, aM, aD, lon) + 0.5));
      }
    }
    allJDNs.sort((a, b) => a - b);
    return forward
      ? (allJDNs.find(t => t > birthJDN) ?? birthJDN + 30)
      : ([...allJDNs].reverse().find(t => t < birthJDN) ?? birthJDN - 30);
  }

  // ─── Day Master Strength Assessment ──────────────────────────────

  /**
   * Assess day master strength using month branch vitality + stem/branch support.
   * Returns 'extreme_strong'|'strong'|'balanced'|'weak'|'extreme_weak'.
   * chart must have yearPillar, monthPillar, dayPillar, hourPillar.
   */
  function assessDayMasterStrength(chart) {
    const dmIdx = chart.dayPillar.stem;
    const dmEl  = STEM_EL_NAME[dmIdx];
    let score   = 0;

    // 1. Month branch (月令) — most important factor, weight ×3
    const monthBr       = chart.monthPillar.branch;
    const monthStrength = MONTHLY_STRENGTH[dmEl][monthBr];
    score += (monthStrength - 2) * 3; // 旺→+6 相→+3 休→0 囚→-3 死→-6

    // 2. Other stems (year, month, hour — not day itself)
    for (const pillar of [chart.yearPillar, chart.monthPillar, chart.hourPillar]) {
      const el = STEM_EL_NAME[pillar.stem];
      if (el === dmEl)                       score += 1.0;  // same element supports
      else if (PRODUCTION_CYCLE[el] === dmEl) score += 0.8;  // produces DM
      else if (PRODUCTION_CYCLE[dmEl] === el) score -= 0.4;  // DM produces (leaks)
      else if (CONTROL_CYCLE[el] === dmEl)    score -= 0.8;  // controls DM
    }

    // 3. Hidden stems in all four branches (通根 — root strength)
    for (const pillar of [chart.yearPillar, chart.monthPillar, chart.dayPillar, chart.hourPillar]) {
      for (const hs of (HIDDEN_STEMS_ROLES[pillar.branch] || [])) {
        const hsEl = STEM_EL_NAME[hs.s];
        const w    = hs.r === 'main' ? 0.8 : hs.r === 'secondary' ? 0.5 : 0.3;
        if (hsEl === dmEl)                         score += w;
        else if (PRODUCTION_CYCLE[hsEl] === dmEl)  score += w * 0.5;
        else if (CONTROL_CYCLE[hsEl] === dmEl)     score -= w * 0.5;
      }
    }

    if (score >= 5)  return 'extreme_strong';
    if (score >= 2)  return 'strong';
    if (score >= -1) return 'balanced';
    if (score >= -4) return 'weak';
    return 'extreme_weak';
  }

  /**
   * Derive useful/harmful gods based on day master element and strength.
   * Returns { usefulGods: string[], harmfulGods: string[] }
   */
  function deriveUsefulGods(dmEl, strength) {
    const isWeak = strength === 'weak' || strength === 'extreme_weak';
    // What DM produces (output), what DM controls (wealth), what produces DM (resource), what controls DM (pressure)
    const outputEl   = PRODUCTION_CYCLE[dmEl];
    const wealthEl   = CONTROL_CYCLE[dmEl];
    const resourceEl = Object.keys(PRODUCTION_CYCLE).find(k => PRODUCTION_CYCLE[k] === dmEl);
    const pressureEl = Object.keys(CONTROL_CYCLE).find(k => CONTROL_CYCLE[k] === dmEl);

    if (isWeak) {
      // Weak DM needs: same element (比劫) + resource/印星 to survive
      // Harmful: wealth (财), output (食伤), pressure/官杀
      return {
        usefulGods:  [resourceEl, dmEl],
        harmfulGods: [wealthEl, outputEl, pressureEl],
      };
    } else {
      // Strong DM channels energy into: output (食伤), wealth (财), pressure/官杀
      // Harmful: more same element, more resource (overflow)
      return {
        usefulGods:  [outputEl, wealthEl, pressureEl],
        harmfulGods: [dmEl, resourceEl],
      };
    }
  }

  // ─── BaZi Calculation ────────────────────────────────────────────
  function calculateBaZi(birthDateStr, shichenIndex) {
    const [y, m, d] = birthDateStr.split('-').map(Number);
    const dayJdn         = jdn(y, m, d);
    const dayPillarIndex = (dayJdn + 49) % 60;
    const dayStem        = dayPillarIndex % 10;
    const dayBranch      = dayPillarIndex % 12;

    const hourBranch = parseInt(shichenIndex, 10) % 12;
    const ziStem     = [0, 2, 4, 6, 8][dayStem % 5];
    const hourStem   = (ziStem + hourBranch) % 10;

    // ── Year & Month pillars — solar term boundaries ─────────────────
    // getBaZiMonth uses actual 节气 dates via the solar term engine above.
    // This replaces the old hardcoded "before Feb 5" heuristic and the
    // calendar-month approximation for monthBranch.
    const { monthBranch, baziYear } = getBaZiMonth(y, m, d);
    let yearPillarIndex = (baziYear - 1984) % 60;
    if (yearPillarIndex < 0) yearPillarIndex += 60;
    const yearStem   = yearPillarIndex % 10;
    const yearBranch = yearPillarIndex % 12;

    const yinYueStem = [2, 4, 6, 8, 0][yearStem % 5];
    // Fix: use (monthBranch - 2 + 12) % 12 so 子月(branch 0) and 丑月(branch 1) resolve correctly.
    const monthStem  = (yinYueStem + (monthBranch - 2 + 12) % 12) % 10;

    const elementCounts = { wood:0, fire:0, earth:0, metal:0, water:0 };
    [yearStem, monthStem, dayStem, hourStem].forEach(s => {
      elementCounts[['wood','fire','earth','metal','water'][STEM_ELEMENT[s]]]++;
    });
    // Branch element mapping: 子(0)=water, 丑=earth, 寅=wood, 卯=wood, 辰=earth,
    // 巳=fire, 午=fire, 未=earth, 申=metal, 酉=metal, 戌=earth, 亥=water.
    // Fix: was [0,...] (wood) for 子; corrected to [4,...] (water).
    [yearBranch, monthBranch, dayBranch, hourBranch].forEach(b => {
      elementCounts[['wood','fire','earth','metal','water'][[4,2,0,0,2,1,1,2,3,3,2,4][b]]]++;
    });

    const total   = Object.values(elementCounts).reduce((a, b) => a + b, 0);
    const balance = {};
    Object.keys(elementCounts).forEach(k => { balance[k] = total ? Math.round((elementCounts[k] / total) * 100) : 0; });

    // ── Day Master Strength ──────────────────────────────────────
    const dayEl     = ['wood','fire','earth','metal','water'][STEM_ELEMENT[dayStem]];
    const dayElPct  = balance[dayEl] || 0;
    const dayMasterStrength = dayElPct >= 30 ? 'Strong' : dayElPct <= 15 ? 'Weak' : 'Moderate';

    // ── Favorable / Unfavorable Elements ────────────────────────
    // Rule: if Day Master is strong → control/drain elements are favorable
    //       if Day Master is weak  → generating/same elements are favorable
    const dmIdx = STEM_ELEMENT[dayStem]; // 0–4
    let favorableElements, unfavorableElements;
    if (dayMasterStrength === 'Strong') {
      // Control and drain (what DM generates) help balance a strong DM
      favorableElements   = [['wood','fire','earth','metal','water'][CONTROLS[dmIdx]],
                              ['wood','fire','earth','metal','water'][GENERATES[dmIdx]]];
      unfavorableElements = [dayEl,
                              ['wood','fire','earth','metal','water'][(CONTROLS.indexOf(dmIdx) + 5) % 5 < 5
                                ? CONTROLS.findIndex(v => v === dmIdx) : dmIdx]];
    } else {
      // Generating element and same element support a weak DM
      const supportEl = ['wood','fire','earth','metal','water'][GENERATES.findIndex(v => v === dmIdx)];
      favorableElements   = [dayEl, supportEl];
      unfavorableElements = [['wood','fire','earth','metal','water'][CONTROLS[dmIdx]]];
    }

    // ── Current Annual Pillar (流年) ─────────────────────────────
    const currentYear   = new Date().getFullYear();
    let annualPillarIdx = (currentYear - 1984) % 60;
    if (annualPillarIdx < 0) annualPillarIdx += 60;
    const annualStem   = annualPillarIdx % 10;
    const annualBranch = annualPillarIdx % 12;
    const annualPillar = {
      stem: annualStem, branch: annualBranch,
      stemChar: STEMS[annualStem], branchChar: BRANCHES[annualBranch],
      year: currentYear,
      tenGod: getTenGod(dayStem, annualStem),
      nayin: getNayin(annualStem, annualBranch)
    };

    // ── Arc strength & useful/harmful gods (for Lifetime Arc scoring) ─
    const arcChart = {
      yearPillar:  { stem: yearStem,  branch: yearBranch  },
      monthPillar: { stem: monthStem, branch: monthBranch },
      dayPillar:   { stem: dayStem,   branch: dayBranch   },
      hourPillar:  { stem: hourStem,  branch: hourBranch  },
    };
    const arcStrength = assessDayMasterStrength(arcChart);
    const dmElStr     = dayEl; // already computed above as dayEl
    const { usefulGods, harmfulGods } = deriveUsefulGods(dmElStr, arcStrength);

    return {
      yearPillar:  { stem: yearStem,  branch: yearBranch  },
      monthPillar: { stem: monthStem, branch: monthBranch },
      dayPillar:   { stem: dayStem,   branch: dayBranch   },
      hourPillar:  { stem: hourStem,  branch: hourBranch  },
      dayMaster: dayStem,
      dayMasterStrength,
      favorableElements,
      unfavorableElements,
      elementBalance: balance,
      annualPillar,
      pillarsStr: `${STEMS[yearStem]}${BRANCHES[yearBranch]} ${STEMS[monthStem]}${BRANCHES[monthBranch]} ${STEMS[dayStem]}${BRANCHES[dayBranch]} ${STEMS[hourStem]}${BRANCHES[hourBranch]}`,
      // ── Lifetime Arc fields ──
      dayMasterEl: dmElStr,
      arcStrength,
      usefulGods,
      harmfulGods,
    };
  }

  // ─── 大运 Major Luck Periods ─────────────────────────────────────
  /**
   * - Yang year stem + Male  OR  Yin year stem + Female → Forward through months
   * - Yin year stem + Male   OR  Yang year stem + Female → Backward
   * - Starting age = days to nearest actual "节" solar term ÷ 3 (rounded).
   */
  function calculateDaYun(chart, birthDateStr, gender) {
    const [y, m, d] = birthDateStr.split('-').map(Number);
    const yearStem  = chart.yearPillar.stem;
    const isYangYear = yearStem % 2 === 0; // 甲丙戊庚壬 are yang (even index)
    const isMale    = gender === 'male';
    const forward   = (isYangYear && isMale) || (!isYangYear && !isMale);

    // Accurate starting age: days to nearest actual "节" solar term ÷ 3.
    // nearestSolarTermJDN uses the solar term engine (not a proxy date).
    const termJDN  = nearestSolarTermJDN(y, m, d, forward);
    const daysDiff = Math.abs(termJDN - jdn(y, m, d));
    const startAge = Math.max(1, Math.round(daysDiff / 3));

    const currentYear = new Date().getFullYear();
    const currentAge  = currentYear - y;

    const mStem   = chart.monthPillar.stem;
    const mBranch = chart.monthPillar.branch;

    const decades = [];
    for (let i = 0; i < 10; i++) {
      const step        = forward ? (i + 1) : -(i + 1);
      const stemIndex   = ((mStem   + step) % 10 + 10) % 10;
      const branchIndex = ((mBranch + step) % 12 + 12) % 12;
      const decadeStart = startAge + i * 10;
      const decadeEnd   = decadeStart + 9;

      const decade = {
        stemIndex, branchIndex,
        stemChar:   STEMS[stemIndex],
        branchChar: BRANCHES[branchIndex],
        startAge: decadeStart, endAge: decadeEnd,
        startYear: y + decadeStart, endYear: y + decadeEnd,
        isCurrent: currentAge >= decadeStart && currentAge <= decadeEnd,
        isPast:    currentAge > decadeEnd,
        label:     STEMS[stemIndex] + BRANCHES[branchIndex]
      };

      // ── Score this decade using the BaZi scoring engine ──────────
      const scores = scoreCycle(decade, chart, gender);
      Object.assign(decade, scores);

      // Season classification from average score
      const avg = (scores.wealth + scores.love + scores.career + scores.health) / 4;
      decade.seasonType  = avg >= 75 ? 'golden' : avg >= 58 ? 'growth' : avg >= 45 ? 'stable' : avg >= 32 ? 'testing' : 'storm';
      decade.seasonEmoji = { golden:'🌟', growth:'🌱', stable:'⚖️', testing:'🔥', storm:'⛈️' }[decade.seasonType];

      decades.push(decade);
    }
    return decades;
  }

  // ─── Lifetime Arc Scoring Engine ─────────────────────────────────
  /**
   * Compute Wealth, Love, Career, Health scores (0-100) for a 大运 decade.
   * Uses Ten Gods, Twelve Stage, branch interactions, and Day Master strength.
   */
  function scoreCycle(decade, chart, gender) {
    const dm      = chart.dayPillar.stem;
    const dmEl    = chart.dayMasterEl || STEM_EL_NAME[dm];
    const useful  = chart.usefulGods  || [];
    const harmful = chart.harmfulGods || [];
    const isWeak   = chart.arcStrength === 'weak' || chart.arcStrength === 'extreme_weak';
    const isStrong = chart.arcStrength === 'strong' || chart.arcStrength === 'extreme_strong';

    const stemTenGod  = getScoreTenGod(dm, decade.stemIndex);
    const stemEl      = STEM_EL_NAME[decade.stemIndex];
    const hiddenStems = (HIDDEN_STEMS_ROLES[decade.branchIndex] || []).map(h => ({
      ...h,
      element: STEM_EL_NAME[h.s],
      tenGod:  getScoreTenGod(dm, h.s),
    }));
    const mainHS       = hiddenStems[0] || { element: stemEl, tenGod: stemTenGod, r: 'main' };
    const twelveStage  = getTwelveStageEn(dm, decade.branchIndex);
    const interactions = findBranchInteractions(decade.branchIndex, chart);
    const dayBrInts    = interactions.filter(i => i.withPillar === 'day');
    const monBrInts    = interactions.filter(i => i.withPillar === 'month');

    // Direction-aware month-branch clash:
    // Clashing a HARMFUL natal month branch → removes obstacle → positive score.
    // Clashing a USEFUL natal month branch  → removes support  → negative score.
    const monBrMainEl = HIDDEN_STEMS_ROLES[chart.monthPillar.branch]?.[0]
      ? STEM_EL_NAME[HIDDEN_STEMS_ROLES[chart.monthPillar.branch][0].s]
      : null;
    const hasMonClash = monBrInts.some(i => i.type === 'clash');
    const monClashDir = !hasMonClash ? 0
      : (monBrMainEl && harmful.includes(monBrMainEl)) ?  1   // removing harm = good
      : (monBrMainEl && useful.includes(monBrMainEl))  ? -1   // removing support = bad
      : 0;                                                     // neutral element = no change

    // ── WEALTH ────────────────────────────────────────────────────
    let wealth = 50;
    if (stemTenGod === 'harvest' || stemTenGod === 'windfall') wealth += 12;
    if (stemTenGod === 'muse')     wealth += 8;
    if (stemTenGod === 'maverick') wealth += 6;
    if (useful.includes(stemEl))   wealth += 8;
    if (harmful.includes(stemEl))  wealth -= 8;
    for (const hs of hiddenStems) {
      const w = hs.r === 'main' ? 6 : hs.r === 'secondary' ? 4 : 2;
      if (hs.tenGod === 'harvest' || hs.tenGod === 'windfall') wealth += w;
      if (hs.tenGod === 'muse')    wealth += Math.floor(w * 0.7);
      if (useful.includes(hs.element))  wealth += Math.floor(w * 0.5);
      if (harmful.includes(hs.element)) wealth -= Math.floor(w * 0.5);
    }
    if (isWeak) {
      const hasSupport = stemTenGod === 'guardian' || stemTenGod === 'mystic'
        || stemTenGod === 'mirror' || stemTenGod === 'shadow'
        || hiddenStems.some(h => ['guardian','mystic','mirror','shadow'].includes(h.tenGod));
      if (!hasSupport) {
        if (stemTenGod === 'harvest' || stemTenGod === 'windfall') wealth -= 15;
        wealth -= 8;
      }
    }
    if (stemTenGod === 'shadow') wealth -= 12;
    if (mainHS.tenGod === 'shadow') wealth -= 6;
    const wVit = { zenith:8, ascension:6, rising:4, awakening:2, waning:0, initiation:-2,
                   nurture:-2, conception:-4, retreat:-4, stillness:-6, vault:-6, void:-8 };
    wealth += wVit[twelveStage] ?? 0;
    wealth += monClashDir > 0 ? 8 : monClashDir < 0 ? -8 : 0;
    wealth = Math.max(5, Math.min(95, Math.round(wealth)));

    // ── LOVE (= Relationships) ────────────────────────────────────
    let love = 50;
    const lBonus = { guardian:12, muse:10, architect:8, harvest:8, mirror:6,
                     mystic:-4, maverick:-10, challenger:-6, shadow:-4, windfall:2 };
    love += lBonus[stemTenGod] ?? 0;
    for (const int of dayBrInts) {
      if (int.type === 'clash') love -= 18;
      else if (int.type === 'harm') love -= 12;
      else if (int.type === 'combo') {
        love += (int.resultElement && useful.includes(int.resultElement)) ? 10
               : (int.resultElement && harmful.includes(int.resultElement)) ? 2 : 6;
      }
    }
    // Gender-specific spouse star
    if (gender === 'female') {
      if (stemTenGod === 'architect') love += 6;
      if (hiddenStems.some(h => h.tenGod === 'architect')) love += 3;
    } else {
      if (stemTenGod === 'harvest') love += 6;
      if (hiddenStems.some(h => h.tenGod === 'harvest')) love += 3;
    }
    const lVit = { zenith:6, ascension:4, rising:4, awakening:6, waning:0, initiation:-2,
                   nurture:2, conception:0, retreat:-4, stillness:-6, vault:-4, void:-8 };
    love += lVit[twelveStage] ?? 0;
    if (stemTenGod === 'guardian' || mainHS.tenGod === 'guardian') love += 4;
    love += monClashDir > 0 ? 6 : monClashDir < 0 ? -8 : 0;
    love = Math.max(5, Math.min(95, Math.round(love)));

    // ── CAREER ───────────────────────────────────────────────────
    let career = 50;
    const cBonus = { architect:12, challenger:8, muse:8, maverick:5, windfall:4,
                     harvest:3, mirror:0, shadow:-8, guardian:2, mystic:4 };
    career += cBonus[stemTenGod] ?? 0;
    if (useful.includes(stemEl))  career += 8;
    if (harmful.includes(stemEl)) career -= 6;
    for (const hs of hiddenStems) {
      const w = hs.r === 'main' ? 4 : hs.r === 'secondary' ? 2 : 1;
      career += (cBonus[hs.tenGod] ?? 0) * (w / 4);
      if (useful.includes(hs.element))  career += w;
      if (harmful.includes(hs.element)) career -= w;
    }
    if (stemTenGod === 'challenger' && isWeak) {
      const hasGuardian = hiddenStems.some(h => h.tenGod === 'guardian' || h.tenGod === 'mystic');
      if (!hasGuardian) career -= 12;
    }
    const cVit = { zenith:8, ascension:6, rising:4, awakening:2, waning:0, initiation:-2,
                   nurture:-2, conception:-4, retreat:-4, stillness:-6, vault:-6, void:-8 };
    career += cVit[twelveStage] ?? 0;
    career += monClashDir > 0 ? 8 : monClashDir < 0 ? -10 : 0;
    career = Math.max(5, Math.min(95, Math.round(career)));

    // ── HEALTH ───────────────────────────────────────────────────
    let health = 50;
    const hVit = { zenith:30, ascension:24, rising:18, awakening:14, waning:4, nurture:6,
                   initiation:-4, conception:-2, retreat:-10, stillness:-14, vault:-16, void:-20 };
    health += hVit[twelveStage] ?? 0;
    if (useful.includes(stemEl))  health += 8;
    if (harmful.includes(stemEl)) health -= 6;
    if (useful.includes(mainHS.element))  health += 6;
    if (harmful.includes(mainHS.element)) health -= 4;
    if (stemTenGod === 'guardian') health += 10;
    if (stemTenGod === 'mystic')   health += 6;
    if (mainHS.tenGod === 'guardian' || mainHS.tenGod === 'mystic') health += 4;
    if (stemTenGod === 'mirror' || stemTenGod === 'shadow') health += 6;
    if (stemTenGod === 'challenger') {
      const hasGuardian = hiddenStems.some(h => h.tenGod === 'guardian' || h.tenGod === 'mystic');
      health += hasGuardian ? -2 : -10;
    }
    const clashCount = interactions.filter(i => i.type === 'clash').length;
    health -= clashCount * 4;
    if (isWeak   && health < 50) health -= 5;
    if (isStrong && health < 50) health += 3;
    health = Math.max(5, Math.min(95, Math.round(health)));

    return { wealth, love, career, health, stemTenGod, twelveStage, interactions };
  }

  // ─── View Management ─────────────────────────────────────────────
  function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('view-active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('view-active');
  }

  // ─── Landing ─────────────────────────────────────────────────────
  function initLanding() {
    document.getElementById('btn-start').addEventListener('click', () => showView('view-onboard'));
  }

  // ─── Merged Onboarding ───────────────────────────────────────────
  function initOnboard() {
    document.getElementById('btn-back-landing').addEventListener('click', () => {
      // If we have profiles already (came from the app), go back to app; else landing
      if (loadProfiles().length > 0 && state.chart) {
        showView('view-app');
      } else {
        showView('view-landing');
      }
    });
    document.getElementById('form-onboard').addEventListener('submit', function (e) {
      e.preventDefault();
      const fd = new FormData(this);
      // If no profileId in state (adding new), mint a fresh ID now
      const profileId = state.profileId || (String(Date.now()) + '_' + Math.floor(Math.random() * 1e6));
      setState({
        profileId,
        profileName:    (fd.get('profileName') || '').trim() || 'My Chart',
        birthDate:      fd.get('birthDate'),
        shichen:        fd.get('shichen'),
        gender:         fd.get('gender'),
        occupation:     fd.get('occupation') || '',
        relationship:   fd.get('relationship') || '',
        currentConcern: (fd.get('currentConcern') || '').trim()
      });
      runGeneration();
    });
  }

  // ─── Narrative API helpers ────────────────────────────────────────
  const STEM_NAMES_EN = [
    'Yang Wood','Yin Wood','Yang Fire','Yin Fire','Yang Earth',
    'Yin Earth','Yang Metal','Yin Metal','Yang Water','Yin Water'
  ];
  const DAY_MASTER_METAPHORS = [
    'Ancient Oak','Willow','Sun','Candlelight','Mountain',
    'Garden Soil','Sword','Gemstone','Ocean','Mist'
  ];
  const BRANCH_ANIMALS = [
    'Rat','Ox','Tiger','Rabbit','Dragon','Snake',
    'Horse','Goat','Monkey','Rooster','Dog','Pig'
  ];
  const ELEMENT_NAMES_CAP = ['Wood','Fire','Earth','Metal','Water'];

  function formatElementBalance(chart) {
    const b = chart.elementBalance || {};
    return ['wood','fire','earth','metal','water']
      .map(e => {
        const pct = b[e];
        return (pct != null) ? e[0].toUpperCase() + e.slice(1) + ' ' + Math.round(pct) + '%' : '';
      })
      .filter(Boolean)
      .join(', ');
  }

  async function fetchNarrativeFromAPI(chart) {
    try {
      const stemIdx       = chart.dayMaster;
      const currentDecade = (chart.daYun || []).find(d => d.isCurrent) || null;
      const payload = {
        dayMaster:         STEMS[stemIdx] + ' (' + (STEM_NAMES_EN[stemIdx] || '') + ')',
        dayMasterMetaphor: DAY_MASTER_METAPHORS[stemIdx] || '',
        pillarsStr:        chart.pillarsStr || '',
        elementBalance:    formatElementBalance(chart),
        dayMasterStrength: chart.dayMasterStrength || 'Moderate',
        favorableElements: (chart.favorableElements || []).map(
          e => e ? e[0].toUpperCase() + e.slice(1) : ''
        ).filter(Boolean),
        soulType:          (SOUL_TYPES[stemIdx] || {}).name || '',
        soulTypeTagline:   (SOUL_TYPES[stemIdx] || {}).tagline || '',
        luckPillarStr:     formatLuckPillar(currentDecade),
        annualPillarStr:   formatAnnualPillar(chart.annualPillar),
        occupation:        state.occupation   || '',
        relationship:      state.relationship || '',
        currentConcern:    state.currentConcern || '',
        dayMasterStemIdx:  stemIdx
      };
      const res = await fetch('/api/narrative', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json.error || !json.coreEssence) return null;
      return json;
    } catch (e) {
      console.warn('[SoulMap] Narrative API failed — using static fallback.', e);
      return null;
    }
  }

  function formatLuckPillar(decade) {
    if (!decade) return 'not yet active';
    const stemName = STEM_NAMES_EN[decade.stemIndex] || '';
    const animal   = BRANCH_ANIMALS[decade.branchIndex] || '';
    return `${STEM_ROMANIZATION[decade.stemIndex]} ${BRANCH_ROMANIZATION[decade.branchIndex]} — ${stemName} ${animal}, ages ${decade.startAge}–${decade.endAge} (${decade.startYear}–${decade.endYear})`;
  }

  function formatAnnualPillar(ap) {
    if (!ap) return 'not calculated';
    const TEN_GOD_ARCHETYPE = ['Mirror','Shadow','Muse','Maverick','Windfall','Harvest','Challenger','Architect','Mystic','Guardian'];
    const tg = TEN_GOD_ARCHETYPE[ap.tenGod] || '';
    return `${STEM_ROMANIZATION[ap.stem]} ${BRANCH_ROMANIZATION[ap.branch]} — ${STEM_NAMES_EN[ap.stem]} ${BRANCH_ANIMALS[ap.branch]}${tg ? ', Ten God: ' + tg : ''} (year ${ap.year})`;
  }

  function updateNarrativeSection(narrative) {
    if (!narrative) return;
    const s = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
    s('detail-core-essence',    narrative.coreEssence);
    s('detail-season',          narrative.season);
    s('detail-classical-text',  narrative.classicalQuote);
    s('detail-classical-source',narrative.classicalSource || '');
    s('detail-work',   narrative.work);
    s('detail-love',   narrative.love);
    s('detail-growth', narrative.growth);
    // Show/hide classical blockquote
    const block = document.getElementById('blockquote-classical');
    if (block) block.style.display = narrative.classicalQuote ? '' : 'none';
    // Hide the "AI reading coming soon" placeholder
    const placeholder = document.getElementById('narrative-placeholder');
    if (placeholder) placeholder.style.display = 'none';
  }

  async function buildChart() {
    const chart = calculateBaZi(state.birthDate, state.shichen);
    chart.daYun = calculateDaYun(chart, state.birthDate, state.gender);
    // Reset narrativeFromAPI so static fallback shows while API fetches
    setState({ chart, soulTypeIndex: chart.dayMaster, narrativeFromAPI: null });
    saveCurrentProfile();
    // Update both header labels
    const nameEl = document.getElementById('profile-btn-name');
    if (nameEl) nameEl.textContent = state.profileName || 'My Chart';
    document.getElementById('app-user-type').textContent = SOUL_TYPES[state.soulTypeIndex].name;
    renderAppBlueprint();
    showView('view-app');
    switchTab('blueprint');
    // Fetch AI narrative in background (blueprint already shown with static fallback)
    const narrative = await fetchNarrativeFromAPI(chart);
    if (narrative) {
      setState({ narrativeFromAPI: narrative });
      saveCurrentProfile();         // cache the narrative so it's instant on next load
      updateNarrativeSection(narrative);
    }
  }

  function runGeneration() {
    buildChart();
  }

  // ─── Helper utilities ────────────────────────────────────────────
  function getDayMasterStrength() {
    return (state.chart && state.chart.dayMasterStrength) || 'Moderate';
  }

  function setEl(id, text) {
    const el = document.getElementById(id);
    if (el && text != null) el.textContent = text;
  }

  // ─── Four Pillars Renderer (row-based grid) ───────────────────────
  function renderFourPillars() {
    const el = document.getElementById('bazi-pillars-section');
    if (!el || !state.chart) return;

    const c = state.chart;
    const pillars = [c.yearPillar, c.monthPillar, c.dayPillar, c.hourPillar];
    const elKeys  = ['wood','fire','earth','metal','water'];

    // Pre-compute per-pillar data
    const shenSha = getShenSha(c);

    const pData = pillars.map((p, i) => {
      const stemEl     = elKeys[STEM_ELEMENT[p.stem]];
      const branchEl   = elKeys[[0,2,0,0,2,1,1,2,3,3,2,4][p.branch]]; // primary branch element
      const tg         = getTenGod(c.dayMaster, p.stem);
      const hiddenS    = HIDDEN_STEMS[p.branch];
      const subStars   = hiddenS.map(hs => TEN_GOD_NAMES[getTenGod(c.dayMaster, hs)]);
      const hiddenNames = hiddenS.map(hs => STEMS[hs]);
      const hiddenEls  = hiddenS.map(hs => elKeys[STEM_ELEMENT[hs]]);
      const stage      = getTwelveStage(p.stem, p.branch);
      const selfSeat   = getTwelveStage(c.dayMaster, p.branch); // day stem in this branch
      const kongwang   = getKongWang(p.stem, p.branch);
      const nayin      = getNayin(p.stem, p.branch);
      const sha        = shenSha[i];
      return { p, stemEl, branchEl, tg, hiddenNames, hiddenEls, subStars, stage, selfSeat, kongwang, nayin, sha };
    });

    function stemCell(d) {
      return `<div class="bazi-cell">
        <span class="bazi-romanization">${STEM_ROMANIZATION[d.p.stem]}</span>
        <span class="bazi-char" style="color:${ELEMENT_HEX[d.stemEl]}">${STEMS[d.p.stem]}</span>
        <span class="bazi-elem-tag bazi-elem-${d.stemEl}">${ELEMENT_NAMES[d.stemEl]}</span>
      </div>`;
    }

    function branchCell(d) {
      return `<div class="bazi-cell">
        <span class="bazi-romanization">${BRANCH_ROMANIZATION[d.p.branch]}</span>
        <span class="bazi-char" style="color:${ELEMENT_HEX[d.branchEl]}">${BRANCHES[d.p.branch]}</span>
        <span class="bazi-elem-tag bazi-elem-${d.branchEl}">${ELEMENT_NAMES[d.branchEl]}</span>
      </div>`;
    }

    function hiddenCell(d) {
      const items = d.hiddenNames.map((ch, k) =>
        `<span style="color:${ELEMENT_HEX[d.hiddenEls[k]]}">${ch}</span>`
      ).join('');
      return `<div class="bazi-cell bazi-cell-hidden">${items}</div>`;
    }

    function subStarCell(d) {
      return `<div class="bazi-cell bazi-cell-small">${d.subStars.join('<br>')}</div>`;
    }

    function shaCell(d) {
      if (!d.sha || d.sha.length === 0) return `<div class="bazi-cell bazi-cell-small">—</div>`;
      return `<div class="bazi-cell bazi-cell-sha">${d.sha.map(s => `<span class="bazi-sha-tag">${s}</span>`).join('')}</div>`;
    }

    const hasSha = pData.some(d => d.sha && d.sha.length > 0);

    const rows = [
      // Row 0 — header
      `<div class="bazi-row bazi-row-header bazi-row-core">
        <div class="bazi-label"><span>日期</span><span class="bazi-label-en">Pillar</span></div>
        ${PILLAR_LABELS_CN.map((cn, i) => `<div class="bazi-col-head${i===2?' bazi-day-head':''}">${cn}<span class="bazi-col-en">${PILLAR_LABELS_EN[i]}</span></div>`).join('')}
      </div>`,

      // Row 1 — 主星 Ten God
      `<div class="bazi-row bazi-row-core">
        <div class="bazi-label"><span>主星</span><span class="bazi-label-en">10 Gods</span></div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-tengod${i===2?' bazi-day':''}">${TEN_GOD_NAMES[d.tg]}<span class="bazi-tg-en">${TEN_GOD_EN[d.tg]}</span></div>`).join('')}
      </div>`,

      // Row 2 — 天干 Heavenly Stems
      `<div class="bazi-row bazi-row-core">
        <div class="bazi-label"><span>天干</span><span class="bazi-label-en">Stems</span></div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${stemCell(d).replace('<div class="bazi-cell">','<div class="bazi-cell">')}</div>`).join('')}
      </div>`,

      // Row 3 — 地支 Earthly Branches
      `<div class="bazi-row bazi-row-core">
        <div class="bazi-label"><span>地支</span><span class="bazi-label-en">Branches</span></div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${branchCell(d)}</div>`).join('')}
      </div>`,

      // Row 4 — 藏干 Hidden Stems (first reference row — thick top border)
      `<div class="bazi-row bazi-row-ref bazi-row-ref-first">
        <div class="bazi-label"><span>藏干</span><span class="bazi-label-en">Hidden</span></div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${hiddenCell(d)}</div>`).join('')}
      </div>`,

      // Row 5 — 副星 Sub Stars (ten gods of hidden stems)
      `<div class="bazi-row bazi-row-ref">
        <div class="bazi-label"><span>副星</span><span class="bazi-label-en">Sub Stars</span></div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${subStarCell(d)}</div>`).join('')}
      </div>`,

      // Row 6 — 星运 12 Growth Stage (stem in its branch)
      `<div class="bazi-row bazi-row-ref">
        <div class="bazi-label"><span>星运</span><span class="bazi-label-en">Stage</span></div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-small${i===2?' bazi-day':''}">${d.stage}</div>`).join('')}
      </div>`,

      // Row 7 — 自坐 Self-seat (day master in each branch)
      `<div class="bazi-row bazi-row-ref">
        <div class="bazi-label"><span>自坐</span><span class="bazi-label-en">Self</span></div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-small${i===2?' bazi-day':''}">${d.selfSeat}</div>`).join('')}
      </div>`,

      // Row 8 — 空亡 Empty/Void
      `<div class="bazi-row bazi-row-ref">
        <div class="bazi-label"><span>空亡</span><span class="bazi-label-en">Void</span></div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-small${i===2?' bazi-day':''}">${d.kongwang}</div>`).join('')}
      </div>`,

      // Row 9 — 纳音 Nayin (last row when no spirits)
      `<div class="bazi-row bazi-row-ref${hasSha ? '' : ' bazi-row-last'}">
        <div class="bazi-label"><span>纳音</span><span class="bazi-label-en">Nayin</span></div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-small${i===2?' bazi-day':''}">${d.nayin}</div>`).join('')}
      </div>`,

      // Row 10 — 神煞 Spirit Killers (only shown when at least one pillar has sha)
      ...(hasSha ? [`<div class="bazi-row bazi-row-ref bazi-row-last">
        <div class="bazi-label"><span>神煞</span><span class="bazi-label-en">Spirits</span></div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${shaCell(d)}</div>`).join('')}
      </div>`] : [])
    ];

    el.innerHTML = `<div class="bazi-grid">${rows.join('')}</div>`;
  }

  // Short energy descriptions per stem index (0–9 = Jiǎ through Guǐ)
  const DAYUN_STEM_DESC = [
    'Yang Wood season — growth, ambition, and new beginnings. Rise and build.',
    'Yin Wood season — flexibility and connection. Cultivate and adapt.',
    'Yang Fire season — visibility and bold action. Step forward and lead.',
    'Yin Fire season — insight and refinement. Trust your inner light.',
    'Yang Earth season — stability and accumulation. Lay foundations that last.',
    'Yin Earth season — nurturing and patience. Transform through steadiness.',
    'Yang Metal season — decisiveness and release. Cut away what no longer fits.',
    'Yin Metal season — precision and depth. Seek quality and clarity.',
    'Yang Water season — flow and adaptability. Go deep; trust the current.',
    'Yin Water season — intuition and stillness. Listen beneath the surface.'
  ];

  // ─── 大运 Card Strip Renderer ─────────────────────────────────────
  function renderDaYun() {
    const strip = document.getElementById('dayun-strip');
    if (!strip || !state.chart || !state.chart.daYun) return;

    const dyElKeys = ['wood','fire','earth','metal','water'];
    const BRANCH_EL_IDX = [4,2,0,0,2,1,1,2,3,3,2,4]; // primary element per branch (water,earth,wood,wood,earth,fire,fire,earth,metal,metal,earth,water)

    strip.innerHTML = state.chart.daYun.map((decade, i) => {
      const stemEl   = dyElKeys[STEM_ELEMENT[decade.stemIndex]];
      const branchEl = dyElKeys[BRANCH_EL_IDX[decade.branchIndex]];
      const accent   = ELEMENT_COLORS[stemEl];
      const desc     = DAYUN_STEM_DESC[decade.stemIndex];
      const classes  = ['dayun-card', decade.isCurrent ? 'dayun-card-active' : ''].filter(Boolean).join(' ');
      return `
        <div class="${classes}" style="--card-accent:${accent}">
          <div class="dayun-row">
            <span class="dayun-row-label">Age · Year</span>
            <span class="dayun-age">${decade.startAge}–${decade.endAge} yrs</span>
            <span class="dayun-years">${decade.startYear}–${decade.endYear}</span>
            ${decade.isCurrent ? '<span class="badge-current" style="display:inline-block;margin-top:6px">NOW</span>' : ''}
          ${decade.seasonEmoji ? `<span class="badge-season" style="margin-left:4px">${decade.seasonEmoji}</span>` : ''}
          </div>
          <div class="dayun-row">
            <span class="dayun-row-label">天干 · 地支</span>
            <div class="dayun-chars">
              <span class="dayun-stem" style="color:${ELEMENT_HEX[stemEl]}">${decade.stemChar}</span>
              <span class="dayun-branch" style="color:${ELEMENT_HEX[branchEl]}">${decade.branchChar}</span>
            </div>
          </div>
          <div class="dayun-row">
            <span class="dayun-row-label">Season Energy</span>
            <span class="dayun-desc">${desc}</span>
          </div>
        </div>`;
    }).join('');

    // Sync custom scroll indicator thumb
    requestAnimationFrame(updateDayunScrollThumb);
    strip.addEventListener('scroll', updateDayunScrollThumb, { passive: true });
  }

  function updateDayunScrollThumb() {
    const strip = document.getElementById('dayun-strip');
    const thumb = document.getElementById('dayun-scroll-thumb');
    if (!strip || !thumb) return;
    const ratio    = strip.scrollLeft / (strip.scrollWidth - strip.clientWidth || 1);
    const trackW   = strip.closest('.dayun-section').clientWidth;
    const thumbW   = Math.max(40, (strip.clientWidth / strip.scrollWidth) * trackW);
    thumb.style.width = thumbW + 'px';
    thumb.style.transform = `translateX(${ratio * (trackW - thumbW)}px)`;
  }

  // ─── Lifetime Arc Combined Chart ─────────────────────────────────

  // Track definition: key = property on decade object, label, color hex
  const ARC_TRACKS = [
    { key:'love',   label:'Love',   cn:'感情', color:'#E87C7C' },
    { key:'wealth', label:'Wealth', cn:'财运', color:'#D4AF37' },
    { key:'career', label:'Career', cn:'事业', color:'#5B8CDB' },
    { key:'health', label:'Health', cn:'健康', color:'#3A7D44' },
  ];

  // Compute insight summary from daYun array
  function computeArcInsights(daYun) {
    const peak = daYun.reduce((best, d) => {
      const avg  = (d.wealth + d.love + d.career + d.health) / 4;
      const bAvg = (best.wealth + best.love + best.career + best.health) / 4;
      return avg > bAvg ? d : best;
    });
    const currentIdx = daYun.findIndex(d => d.isCurrent);
    let turningPoint = null;
    if (currentIdx >= 0) {
      for (let i = currentIdx + 1; i < daYun.length; i++) {
        const prev = daYun[i - 1];
        if (daYun[i].wealth > prev.wealth && daYun[i].love > prev.love
            && daYun[i].career > prev.career && daYun[i].health > prev.health) {
          turningPoint = daYun[i];
          break;
        }
      }
    }
    return { peak, turningPoint, currentIdx };
  }

  function renderEnergyCharts() {
    const section = document.getElementById('energy-charts-section');
    if (!section || !state.chart || !state.chart.daYun) return;

    const daYun   = state.chart.daYun;
    const n       = daYun.length;
    const insights = computeArcInsights(daYun);

    // ── Legend ──────────────────────────────────────────────────
    const legendHtml = ARC_TRACKS.map(t =>
      `<span class="arc-legend-item">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="4" fill="${t.color}"/>
        </svg>
        ${t.label} <span class="arc-legend-cn">${t.cn}</span>
      </span>`
    ).join('');

    // ── SVG chart ───────────────────────────────────────────────
    const VW = 500, VH = 200;
    const PL = 28, PR = 12, PT = 16, PB = 38;
    const CW = VW - PL - PR, CH = VH - PT - PB;
    const xOf = i => PL + (n > 1 ? (i / (n - 1)) * CW : CW / 2);
    const yOf = v => PT + CH - ((v - 5) / 90) * CH; // 5–95 → full height

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', VH);
    svg.setAttribute('class', 'arc-chart-svg');

    // Y-axis grid lines + labels (20 / 50 / 80)
    for (const [val, lbl] of [[20,'Low'],[50,'Mid'],[80,'High']]) {
      const gy = yOf(val);
      const gl = document.createElementNS(ns, 'line');
      gl.setAttribute('x1', PL); gl.setAttribute('x2', VW - PR);
      gl.setAttribute('y1', gy); gl.setAttribute('y2', gy);
      gl.setAttribute('stroke', '#D4C9B4'); gl.setAttribute('stroke-width', '0.5');
      gl.setAttribute('stroke-dasharray', '3,3');
      svg.appendChild(gl);
      const gt = document.createElementNS(ns, 'text');
      gt.setAttribute('x', PL - 4); gt.setAttribute('y', gy + 3.5);
      gt.setAttribute('text-anchor', 'end'); gt.setAttribute('font-size', '8');
      gt.setAttribute('fill', '#999'); gt.setAttribute('font-family', 'DM Sans,system-ui');
      gt.textContent = lbl;
      svg.appendChild(gt);
    }

    // Current decade vertical reference line
    const currentIdx = daYun.findIndex(d => d.isCurrent);
    if (currentIdx >= 0) {
      const cx = xOf(currentIdx);
      const vl = document.createElementNS(ns, 'line');
      vl.setAttribute('x1', cx); vl.setAttribute('x2', cx);
      vl.setAttribute('y1', PT); vl.setAttribute('y2', VH - PB);
      vl.setAttribute('stroke', '#E8372A'); vl.setAttribute('stroke-width', '1');
      vl.setAttribute('stroke-dasharray', '4,3'); vl.setAttribute('opacity', '0.5');
      svg.appendChild(vl);
    }

    // Draw each track: polyline (past solid, future dashed) + dots
    for (const track of ARC_TRACKS) {
      const values = daYun.map(d => d[track.key] ?? 50);
      const pEnd   = currentIdx >= 0 ? currentIdx + 1 : daYun.filter(d => d.isPast).length;
      const fStart = Math.max(0, currentIdx >= 0 ? currentIdx : pEnd - 1);

      // Past polyline
      if (pEnd > 1) {
        const pts = daYun.slice(0, pEnd).map((_, i) => `${xOf(i)},${yOf(values[i])}`).join(' ');
        const pl  = document.createElementNS(ns, 'polyline');
        pl.setAttribute('points', pts); pl.setAttribute('fill', 'none');
        pl.setAttribute('stroke', track.color); pl.setAttribute('stroke-width', '2');
        svg.appendChild(pl);
      }
      // Future polyline (dashed + lower opacity)
      if (n - fStart > 1) {
        const pts = daYun.slice(fStart).map((_, i) => `${xOf(fStart + i)},${yOf(values[fStart + i])}`).join(' ');
        const fl  = document.createElementNS(ns, 'polyline');
        fl.setAttribute('points', pts); fl.setAttribute('fill', 'none');
        fl.setAttribute('stroke', track.color); fl.setAttribute('stroke-width', '1.5');
        fl.setAttribute('stroke-dasharray', '5,3'); fl.setAttribute('opacity', '0.5');
        svg.appendChild(fl);
      }

      // Dots
      daYun.forEach((d, i) => {
        const x = xOf(i), y = yOf(values[i]);
        const dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('cx', x); dot.setAttribute('cy', y);
        if (d.isCurrent) {
          dot.setAttribute('r', '5'); dot.setAttribute('fill', track.color);
          dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', '2');
        } else if (d.isPast) {
          dot.setAttribute('r', '4'); dot.setAttribute('fill', track.color);
          dot.setAttribute('opacity', '0.85');
        } else {
          dot.setAttribute('r', '3'); dot.setAttribute('fill', 'none');
          dot.setAttribute('stroke', track.color); dot.setAttribute('stroke-width', '1.5');
          dot.setAttribute('opacity', '0.5');
        }
        // Click to show detail
        dot.style.cursor = 'pointer';
        dot.setAttribute('data-decade-idx', i);
        dot.setAttribute('data-track', track.key);
        svg.appendChild(dot);
      });
    }

    // X-axis labels (decade chars + emoji badge) + click targets
    daYun.forEach((d, i) => {
      const x = xOf(i);

      // Season emoji badge
      const emojiT = document.createElementNS(ns, 'text');
      emojiT.setAttribute('x', x); emojiT.setAttribute('y', VH - PB + 13);
      emojiT.setAttribute('text-anchor', 'middle'); emojiT.setAttribute('font-size', '10');
      emojiT.textContent = d.seasonEmoji || '⚖️';
      svg.appendChild(emojiT);

      // Decade chars
      const lbl = document.createElementNS(ns, 'text');
      lbl.setAttribute('x', x); lbl.setAttribute('y', VH - PB + 26);
      lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('font-size', '10');
      lbl.setAttribute('fill', d.isCurrent ? '#E8372A' : '#555');
      lbl.setAttribute('font-family', 'Noto Serif SC, serif');
      lbl.setAttribute('font-weight', d.isCurrent ? '700' : '400');
      lbl.textContent = d.stemChar + d.branchChar;
      svg.appendChild(lbl);

      // Age label
      const age = document.createElementNS(ns, 'text');
      age.setAttribute('x', x); age.setAttribute('y', VH - 2);
      age.setAttribute('text-anchor', 'middle'); age.setAttribute('font-size', '8');
      age.setAttribute('fill', '#999'); age.setAttribute('font-family', 'DM Sans,system-ui');
      age.textContent = d.startAge + '–' + d.endAge;
      svg.appendChild(age);

      // Invisible click area for entire column
      const hitRect = document.createElementNS(ns, 'rect');
      const colW = n > 1 ? CW / (n - 1) : CW;
      hitRect.setAttribute('x', x - colW / 2); hitRect.setAttribute('y', PT);
      hitRect.setAttribute('width', colW); hitRect.setAttribute('height', CH + PB);
      hitRect.setAttribute('fill', 'transparent'); hitRect.style.cursor = 'pointer';
      hitRect.setAttribute('data-decade-idx', i);
      hitRect.addEventListener('click', () => showCycleDetail(i));
      svg.appendChild(hitRect);
    });

    // ── Insight cards ────────────────────────────────────────────
    const { peak, turningPoint, currentIdx: ci } = insights;
    const current = ci >= 0 ? daYun[ci] : null;
    const peakAvg = peak ? Math.round((peak.wealth + peak.love + peak.career + peak.health) / 4) : 0;

    const insightHtml = `<div class="arc-insights">
      ${current && (current.seasonType === 'testing' || current.seasonType === 'storm') ? `
        <div class="arc-insight-card arc-insight-now">
          <div class="arc-insight-emoji">${current.seasonEmoji}</div>
          <div>
            <div class="arc-insight-label">Current Season</div>
            <div class="arc-insight-value">${current.stemChar}${current.branchChar} · Age ${current.startAge}–${current.endAge}</div>
            <div class="arc-insight-sub">${DAYUN_STEM_DESC[current.stemIndex] || ''}</div>
          </div>
        </div>` : current ? `
        <div class="arc-insight-card arc-insight-now">
          <div class="arc-insight-emoji">${current.seasonEmoji}</div>
          <div>
            <div class="arc-insight-label">Current Season</div>
            <div class="arc-insight-value">${current.stemChar}${current.branchChar} · Age ${current.startAge}–${current.endAge}</div>
            <div class="arc-insight-sub">${DAYUN_STEM_DESC[current.stemIndex] || ''}</div>
          </div>
        </div>` : ''}
      ${turningPoint ? `
        <div class="arc-insight-card arc-insight-turn">
          <div class="arc-insight-emoji">↑</div>
          <div>
            <div class="arc-insight-label">Turning Point</div>
            <div class="arc-insight-value">Age ${turningPoint.startAge} · ${turningPoint.stemChar}${turningPoint.branchChar}</div>
            <div class="arc-insight-sub">All tracks rise here</div>
          </div>
        </div>` : ''}
      <div class="arc-insight-card arc-insight-peak">
        <div class="arc-insight-emoji">🌟</div>
        <div>
          <div class="arc-insight-label">Lifetime Peak</div>
          <div class="arc-insight-value">${peak.stemChar}${peak.branchChar} · Age ${peak.startAge}–${peak.endAge}</div>
          <div class="arc-insight-sub">Average score ${peakAvg}/100</div>
        </div>
      </div>
    </div>`;

    // ── Assemble into section ────────────────────────────────────
    section.innerHTML = `
      <div class="arc-chart-header">
        <div class="arc-legend">${legendHtml}</div>
      </div>
      <div class="arc-chart-container" id="arc-svg-wrap"></div>
      ${insightHtml}
      <div id="cycle-detail-panel" class="cycle-detail-panel" style="display:none"></div>
    `;
    document.getElementById('arc-svg-wrap').appendChild(svg);
  }

  // ─── Cycle Detail Panel ───────────────────────────────────────────
  function showCycleDetail(idx) {
    const panel = document.getElementById('cycle-detail-panel');
    if (!panel || !state.chart || !state.chart.daYun) return;
    const decade = state.chart.daYun[idx];
    if (!decade) return;

    // Scores bar HTML
    const scoreBar = (label, value, color) => `
      <div class="cycle-score-row">
        <span class="cycle-score-label">${label}</span>
        <div class="cycle-score-bar-wrap">
          <div class="cycle-score-bar" style="width:${value}%;background:${color}"></div>
        </div>
        <span class="cycle-score-num">${value}</span>
      </div>`;

    const stageLabel = decade.twelveStage
      ? decade.twelveStage.charAt(0).toUpperCase() + decade.twelveStage.slice(1)
      : '—';
    const tenGodLabel = decade.stemTenGod
      ? decade.stemTenGod.charAt(0).toUpperCase() + decade.stemTenGod.slice(1)
      : '—';

    // Check if narrative already loaded
    const narrative = decade.narrative;
    const narrativeHtml = narrative
      ? `<div class="cycle-narrative">
          <p class="cycle-theme">"${narrative.theme}"</p>
          <p>${narrative.summary}</p>
          <div class="cycle-narrative-domains">
            <div><strong>💰 Wealth</strong><p>${narrative.wealthNote}</p></div>
            <div><strong>❤️ Love</strong><p>${narrative.relationshipsNote}</p></div>
            <div><strong>💼 Career</strong><p>${narrative.wealthNote}</p></div>
            <div><strong>💪 Health</strong><p>${narrative.healthNote}</p></div>
          </div>
          <div class="cycle-lesson">
            <p><strong>Life Lesson:</strong> ${narrative.lifeLessonThisSeason}</p>
          </div>
        </div>`
      : `<div class="cycle-narrative-loading">
          <button class="btn-refresh btn-cycle-narrative" onclick="fetchCycleNarrative(${idx})">
            ✦ Generate Reading for this Season
          </button>
          <p class="cycle-narrative-hint">Takes ~10 seconds · Saved to profile</p>
        </div>`;

    panel.style.display = '';
    panel.innerHTML = `
      <div class="cycle-detail-inner">
        <div class="cycle-detail-header">
          <span class="cycle-detail-emoji">${decade.seasonEmoji || '⚖️'}</span>
          <div>
            <div class="cycle-detail-pillar">${decade.stemChar}${decade.branchChar}</div>
            <div class="cycle-detail-age">Age ${decade.startAge}–${decade.endAge} · ${decade.startYear}–${decade.endYear}</div>
            <div class="cycle-detail-meta">${tenGodLabel} Season · ${stageLabel} Stage</div>
          </div>
          <button class="cycle-detail-close" onclick="document.getElementById('cycle-detail-panel').style.display='none'">✕</button>
        </div>
        <div class="cycle-scores">
          ${scoreBar('Love',   decade.love,   '#E87C7C')}
          ${scoreBar('Wealth', decade.wealth, '#D4AF37')}
          ${scoreBar('Career', decade.career, '#5B8CDB')}
          ${scoreBar('Health', decade.health, '#3A7D44')}
        </div>
        <div class="cycle-season-desc">${DAYUN_STEM_DESC[decade.stemIndex] || ''}</div>
        ${narrativeHtml}
      </div>`;

    // Scroll into view
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /** Fetch AI narrative for a specific decade cycle (lazy, on click) */
  async function fetchCycleNarrative(idx) {
    const decade = state.chart && state.chart.daYun && state.chart.daYun[idx];
    if (!decade) return;

    const btn = document.querySelector('.btn-cycle-narrative');
    if (btn) { btn.disabled = true; btn.textContent = '✦ Generating…'; }

    try {
      const chart = state.chart;
      const payload = {
        chart: {
          dayMaster:    STEMS[chart.dayMaster],
          dayMasterEl:  chart.dayMasterEl,
          strength:     chart.arcStrength || 'balanced',
          usefulGods:   chart.usefulGods  || [],
          harmfulGods:  chart.harmfulGods || [],
          gender:       state.gender || 'female',
          dayBranch:    BRANCHES[chart.dayPillar.branch],
          monthBranch:  BRANCHES[chart.monthPillar.branch],
        },
        cycle: {
          pillar:       decade.stemChar + decade.branchChar,
          stemTenGod:   decade.stemTenGod || '—',
          twelveStage:  decade.twelveStage || '—',
          ageRange:     decade.startAge + '-' + decade.endAge,
          years:        decade.startYear + '-' + decade.endYear,
          wealth:       decade.wealth,
          love:         decade.love,
          career:       decade.career,
          health:       decade.health,
          interactions: (decade.interactions || []).map(i => i.type + ' with ' + i.withPillar + ' pillar'),
        },
      };

      const res = await fetch('/api/cycle-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      decade.narrative = data;

      // Persist to profile
      saveCurrentProfile();

      // Re-render panel
      showCycleDetail(idx);
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = '✦ Try Again'; }
      console.error('fetchCycleNarrative error:', err);
    }
  }
  // Expose for inline onclick
  window.fetchCycleNarrative = fetchCycleNarrative;

  // ─── Main Blueprint Renderer ─────────────────────────────────────
  function renderAppBlueprint() {
    if (!state.chart) return;
    const t       = SOUL_TYPES[state.soulTypeIndex];
    const n       = BLUEPRINT_NARRATIVE[state.soulTypeIndex] || null;
    const balance = state.chart.elementBalance;

    // Dynamic background blobs — top 3 chart elements drive blob colors
    const _sortedEls = Object.entries(balance)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([el]) => el);
    const _r = document.documentElement;
    _r.style.setProperty('--blob-elem-1', ELEMENT_HEX[_sortedEls[0]] || ELEMENT_HEX.fire);
    _r.style.setProperty('--blob-elem-2', ELEMENT_HEX[_sortedEls[1]] || ELEMENT_HEX.metal);
    _r.style.setProperty('--blob-elem-3', ELEMENT_HEX[_sortedEls[2]] || ELEMENT_HEX.water);

    const season  = SEASON_NAMES[STEM_ELEMENT[state.chart.monthPillar.stem]] || '—';
    const zodiac  = getWesternZodiacSign(state.birthDate);

    // Portrait image — reveal frame only after image loads (no black placeholder)
    const imgEl   = document.getElementById('blueprint-detail-visual');
    const frameEl = document.getElementById('soul-portrait-frame');
    if (imgEl && frameEl) {
      frameEl.classList.remove('portrait-loaded');
      imgEl.onload  = () => frameEl.classList.add('portrait-loaded');
      imgEl.onerror = () => frameEl.style.display = 'none';
      imgEl.src = '/personas/persona-' + t.slug + '.png';
      imgEl.alt = t.name;
    }
    setEl('detail-type-name', t.name);
    setEl('detail-type-sub', t.sub);
    setEl('detail-tagline', t.tagline);

    // Meta
    setEl('detail-destiny-structure', 'Strength: ' + getDayMasterStrength());
    const favEls = (state.chart.favorableElements || []).join(' · ');
    setEl('detail-favorable-elements', favEls || season);
    setEl('detail-zodiac', zodiac);

    // Element bars
    const barsEl = document.getElementById('detail-elements-bars');
    if (barsEl) {
      barsEl.innerHTML = Object.entries(balance).map(([k, v]) =>
        `<div class="element-row">
          <span>${ELEMENT_NAMES[k]}</span>
          <div class="bar"><div class="fill" style="width:${v}%;background:${ELEMENT_HEX[k]}"></div></div>
          <span>${v}%</span>
        </div>`
      ).join('');
    }

    // Four Pillars table
    renderFourPillars();

    // Narrative placeholder logic
    const apiNarrative = state.narrativeFromAPI && state.narrativeFromAPI.coreEssence && state.narrativeFromAPI.work;
    const placeholder  = document.getElementById('narrative-placeholder');

    if (apiNarrative) {
      if (placeholder) placeholder.style.display = 'none';
      const na = state.narrativeFromAPI;
      setEl('detail-core-essence', na.coreEssence);
      setEl('detail-season', na.season);
      setEl('detail-work', na.work);
      setEl('detail-love', na.love);
      setEl('detail-growth', na.growth);
      setEl('detail-classical-text', na.classicalQuote || '—');
      setEl('detail-classical-source', (na.classicalSource || '').trim() || '—');
      const block = document.getElementById('blockquote-classical');
      if (block) block.style.display = na.classicalQuote ? '' : 'none';
    } else {
      // Show placeholder + static fallback
      if (placeholder) placeholder.style.display = '';
      if (n) {
        const coreEssence = 'Your core essence is ' + (n.shortName || t.name.replace(/^The /,'')) +
          ' — ' + n.essence + ' Born during ' + season.toLowerCase() + ', you carry the energy of that season.';
        setEl('detail-core-essence', coreEssence);
        setEl('detail-work',   n.work);
        setEl('detail-love',   n.love);
        setEl('detail-growth', n.growth);
        const classical = (window.CLASSICAL_BAZI_EXCERPTS && window.CLASSICAL_BAZI_EXCERPTS[state.soulTypeIndex]) || FALLBACK_CLASSICAL_BAZI[state.soulTypeIndex];
        if (classical) {
          setEl('detail-classical-text',   classical.text);
          setEl('detail-classical-source', classical.source + (classical.sourceEn ? '  ' + classical.sourceEn : ''));
        }
      }
    }

    // Concern block
    const concernSection = document.getElementById('section-concern');
    const concernEl      = document.getElementById('detail-concern');
    if (state.currentConcern && concernSection && concernEl && n) {
      const truncated  = state.currentConcern.length > 120 ? state.currentConcern.slice(0, 117) + '...' : state.currentConcern;
      concernEl.textContent = 'You shared: ' + truncated + ' — Your ' + t.element + ' nature is supported in ' + season + '. Trust your instincts.';
      concernSection.hidden = false;
    } else if (concernSection) {
      concernSection.hidden = true;
    }

    // Life Seasons + Energy Charts
    renderDaYun();
    renderEnergyCharts();
  }

  // ─── Tab Management ──────────────────────────────────────────────
  function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('tab-active'));
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.removeAttribute('aria-current'); });
    const pane = document.getElementById('tab-' + tabId);
    const btn  = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (pane) pane.classList.add('tab-active');
    if (btn)  { btn.classList.add('active'); btn.setAttribute('aria-current', 'page'); }
    if (tabId === 'blueprint' && state.chart) renderAppBlueprint();
  }

  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });
  }

  // ─── Oracle ───────────────────────────────────────────────────────

  // Pre-built deep-dive reading templates.
  // {year} is replaced at render-time with the current calendar year.
  const ORACLE_TEMPLATES = [
    {
      icon:     '⚡',
      title:    'Career Crossroads',
      desc:     'Work aligned with your fundamental nature',
      question: 'Looking at my Day Master, current life season (大运), and element balance — what kind of work environment, role, or path is most aligned with who I fundamentally am? What am I built for, and what tends to drain me professionally?',
    },
    {
      icon:     '◎',
      title:    'Relationship Lens',
      desc:     'Love patterns and what you attract',
      question: 'Based on my BaZi chart, what are my natural patterns in love and close relationships? What does my chart reveal about what I genuinely need in a partner, and what challenges do I tend to create or attract?',
    },
    {
      icon:     '◉',
      title:    '{year} Reading',
      desc:     'What this year activates in your chart',
      question: 'How does {year}\'s energy interact with my natal chart and current life season? What themes, opportunities, or friction points should I be most aware of this year — and what would you counsel me to prioritize?',
    },
    {
      icon:     '◐',
      title:    'Shadow Patterns',
      desc:     'Recurring blind spots working against you',
      question: 'What patterns does my BaZi chart reveal that may be quietly working against me — recurring challenges, blind spots, or self-sabotage tendencies I might not see clearly? Be direct with me.',
    },
    {
      icon:     '⚖',
      title:    'Timing a Leap',
      desc:     'Is this season right for a bold change?',
      question: 'I\'m considering a significant life change. Looking at my current life season (大运), this year\'s energy (流年), and my element balance — is this a period for bold action, patient groundwork, or strategic consolidation? What does the timing tell you?',
    },
    {
      icon:     '✦',
      title:    'Health & Vitality',
      desc:     'Your constitution and energy rhythms',
      question: 'What does my element balance and Day Master reveal about my physical constitution and energy rhythms? What should I protect, and what tends to deplete me at a deep level?',
    },
  ];

  function buildOracleChartContext() {
    if (!state.chart) return null;
    const c = state.chart;
    const stemIdx       = c.dayMaster;
    const currentDecade = (c.daYun || []).find(d => d.isCurrent) || null;
    return {
      dayMaster:         STEMS[stemIdx] + ' (' + (STEM_NAMES_EN[stemIdx] || '') + ')',
      dayMasterMetaphor: DAY_MASTER_METAPHORS[stemIdx] || '',
      pillarsStr:        c.pillarsStr || '',
      elementBalance:    formatElementBalance(c),
      dayMasterStrength: c.dayMasterStrength || 'Moderate',
      favorableElements: (c.favorableElements || []).map(
        e => e ? e[0].toUpperCase() + e.slice(1) : ''
      ).filter(Boolean),
      soulType:          (SOUL_TYPES[stemIdx] || {}).name || '',
      luckPillarStr:     formatLuckPillar(currentDecade),
      annualPillarStr:   formatAnnualPillar(c.annualPillar),
      occupation:        state.occupation    || '',
      relationship:      state.relationship  || '',
      currentConcern:    state.currentConcern || '',
    };
  }

  async function fetchOracleAnswer(question, conversationHistory) {
    const res = await fetch('/api/oracle', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        question,
        chartContext:        buildOracleChartContext(),
        conversationHistory: conversationHistory || [],
      }),
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || 'Oracle API error');
    return json.answer;
  }

  // Lightweight markdown renderer for Oracle AI responses only.
  // Security: only called on AI-generated text, never on user input.
  function renderMarkdown(text) {
    // 1. Horizontal rule
    let html = text.replace(/^---$/gm, '<hr class="oracle-hr">');
    // 2. Headings — handle #, ##, ### (AI uses any of these)
    html = html.replace(/^### (.+)$/gm, '<h3 class="oracle-h3">$1</h3>');
    html = html.replace(/^## (.+)$/gm,  '<h2 class="oracle-h2">$1</h2>');
    html = html.replace(/^# (.+)$/gm,   '<h2 class="oracle-h2">$1</h2>');
    // 3. Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g,     '<em>$1</em>');
    // 4. Split on double newlines → paragraphs (skip already-converted block tags)
    return html
      .split(/\n{2,}/)
      .map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        if (/^<(h[23]|hr)/.test(trimmed)) return trimmed;
        return '<p>' + trimmed.replace(/\n/g, ' ') + '</p>';
      })
      .filter(Boolean)
      .join('\n');
  }

  function initOracle() {
    const form        = document.getElementById('oracle-form');
    const input       = document.getElementById('oracle-input');
    const messages    = document.getElementById('oracle-messages');
    const placeholder = document.getElementById('oracle-placeholder');
    const sendBtn     = form ? form.querySelector('button[type="submit"]') : null;

    // Conversation history for multi-turn context (role/content pairs)
    const conversationHistory = [];

    // ── Render deep-dive template cards ───────────────────────────
    const templatesEl = document.getElementById('oracle-templates');
    if (templatesEl) {
      const year  = new Date().getFullYear();
      const label = document.createElement('p');
      label.className = 'oracle-templates-label';
      label.textContent = 'Deep-Dive Readings';
      templatesEl.appendChild(label);

      const grid = document.createElement('div');
      grid.className = 'oracle-templates-grid';

      ORACLE_TEMPLATES.forEach(t => {
        const btn   = document.createElement('button');
        btn.type    = 'button';
        btn.className = 'oracle-template-card';
        const title    = t.title.replace('{year}', year);
        const question = t.question.replace(/\{year\}/g, year);
        btn.innerHTML =
          '<span class="oracle-template-icon">'  + t.icon  + '</span>' +
          '<span class="oracle-template-title">' + title   + '</span>' +
          '<span class="oracle-template-desc">'  + t.desc  + '</span>';
        btn.addEventListener('click', () => {
          input.value = question;
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        });
        grid.appendChild(btn);
      });

      templatesEl.appendChild(grid);
    }

    // Dismiss leave-warning banner (one-time)
    document.getElementById('btn-dismiss-oracle-warning')?.addEventListener('click', () => {
      const w = document.getElementById('oracle-leave-warning');
      if (w) w.hidden = true;
    }, { once: true });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;

      // Collapse template cards once conversation begins
      if (templatesEl) templatesEl.style.display = 'none';

      if (placeholder) placeholder.style.display = 'none';

      // Show user message
      const userMsg = document.createElement('div');
      userMsg.className = 'msg user';
      userMsg.textContent = q;
      messages.appendChild(userMsg);
      input.value = '';

      // Disable send while waiting
      if (sendBtn) sendBtn.disabled = true;

      // Typing indicator
      const typing = document.createElement('div');
      typing.className = 'msg assistant typing';
      typing.innerHTML = '<span></span><span></span><span></span>';
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;

      try {
        const answer = await fetchOracleAnswer(q, conversationHistory);

        // Remove typing indicator, show real reply
        typing.remove();
        const reply = document.createElement('div');
        reply.className = 'msg assistant';
        reply.innerHTML = renderMarkdown(answer);

        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'oracle-save-btn';
        saveBtn.setAttribute('aria-label', 'Save to Wisdom Vault');
        saveBtn.innerHTML = '🔖 Save';
        saveBtn.addEventListener('click', () => {
          const alreadySaved = getStoredAdditions().some(
            e => e.tradition === 'saved' && e.text === answer
          );
          if (alreadySaved) {
            saveBtn.textContent = '✓ Saved';
            saveBtn.disabled = true;
            return;
          }
          addCitationToVault({
            tradition: 'saved',
            source:    'SoulMap Oracle',
            author:    q.slice(0, 80) + (q.length > 80 ? '…' : ''),
            text:      answer,
            savedAt:   Date.now()
          });
          saveBtn.textContent = '✓ Saved';
          saveBtn.disabled = true;
        });
        reply.appendChild(saveBtn);

        messages.appendChild(reply);
        messages.scrollTop = messages.scrollHeight;

        // Show leave-warning banner after first reply
        const warning = document.getElementById('oracle-leave-warning');
        if (warning) warning.hidden = false;

        // Save to conversation history for follow-up context
        conversationHistory.push({ role: 'user',      content: q      });
        conversationHistory.push({ role: 'assistant', content: answer });

        // Parse any classical citations into the Wisdom Vault
        const parsed = parseCitationFromMessage(answer);
        if (parsed) addCitationToVault(parsed);

      } catch (err) {
        typing.remove();
        const errMsg = document.createElement('div');
        errMsg.className = 'msg assistant error';
        errMsg.textContent = 'The Oracle is unavailable right now. Please try again in a moment.';
        messages.appendChild(errMsg);
        messages.scrollTop = messages.scrollHeight;
        console.warn('[SoulMap] Oracle API failed:', err);
      } finally {
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
      }
    });
  }

  // ─── Wisdom Vault ────────────────────────────────────────────────
  const WISDOM_VAULT_BASE = (typeof window !== 'undefined' && window.WISDOM_VAULT) || [
    { tradition:'daoism',   source:'Tao Te Ching', author:'Lao Tzu',         text:'The highest good is like water. Water benefits the ten thousand things but does not compete.' },
    { tradition:'stoicism', source:'Meditations',  author:'Marcus Aurelius', text:'You have power over your mind — not outside events. Realize this, and you will find strength.' },
    { tradition:'buddhism', source:'Dhammapada',   author:'Buddha',           text:'All experience is preceded by mind, led by mind, made by mind.' }
  ];
  const WISDOM_VAULT_STORAGE_KEY = 'soulmap_wisdom_vault_additions';

  function getStoredAdditions() {
    try { const raw = localStorage.getItem(WISDOM_VAULT_STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch (_) { return []; }
  }
  function saveAdditions(arr) { try { localStorage.setItem(WISDOM_VAULT_STORAGE_KEY, JSON.stringify(arr)); } catch (_) {} }
  function getWisdomVault()   {
    return WISDOM_VAULT_BASE
      .concat(getStoredAdditions())           // global classical citations
      .concat(state.savedOracleItems || []);  // profile-scoped Oracle saves
  }

  // ── "For You" smart curation ─────────────────────────────────────
  // Traditions that resonate with each element's archetypal energy
  const ELEMENT_TRADITION_AFFINITY = {
    water:  ['daoism', 'sufi', 'buddhism'],         // flow, depth, surrender
    wood:   ['buddhism', 'confucianism', 'vedic'],   // growth, cultivation, dharma
    fire:   ['stoicism', 'greek', 'christianity'],   // courage, reason, love
    earth:  ['confucianism', 'judaism', 'vedic'],    // stability, duty, rootedness
    metal:  ['chinese', 'stoicism', 'islam'],         // precision, discipline, refinement
  };

  // One-line caption explaining why a quote speaks to the user's elemental chart
  const WHY_CAPTIONS = {
    water: {
      daoism:       'Water is scarce in your chart — Daoism teaches yielding as strength.',
      sufi:         'The Sufi poets speak to Water\'s longing: love that dissolves the self.',
      buddhism:     'Buddhism\'s teaching on impermanence mirrors the flow of Water.',
    },
    wood: {
      buddhism:     'Your Wood nature grows through conscious unfolding — Buddhism shows the path.',
      confucianism: 'Wood seeks upward cultivation — Confucius teaches the discipline of character.',
      vedic:        'The Vedic tradition speaks to Wood\'s dharma: purposeful, devoted action.',
    },
    fire: {
      stoicism:     'Stoicism channels Fire\'s intensity into practical wisdom under pressure.',
      greek:        'Greek philosophy asks Fire\'s question: how to live a life worth living.',
      christianity: 'The Christian tradition speaks to Fire\'s warmth — love as the highest virtue.',
    },
    earth: {
      confucianism: 'Earth energy needs roots — Confucianism builds the stable ground of virtue.',
      judaism:      'Jewish wisdom speaks to Earth\'s covenant: showing up faithfully, day after day.',
      vedic:        'The Vedic path of karma yoga speaks to Earth\'s gift: steady, devoted action.',
    },
    metal: {
      chinese:      'The I Ching speaks to Metal\'s discernment — timing and precision over force.',
      stoicism:     'Metal resonates with Stoic refinement: cutting away what is not essential.',
      islam:        'Islamic teaching on discipline speaks to Metal\'s path of purification.',
    },
  };

  function curateForYou(vault, chart) {
    const nonSaved = vault.filter(x => x.tradition !== 'saved');
    if (!chart || !chart.elementBalance) return nonSaved.slice(0, 18);

    const elNames = ['wood','fire','earth','metal','water'];
    const balance = chart.elementBalance; // { wood, fire, earth, metal, water } percentages
    const sorted  = elNames.slice().sort((a, b) => (balance[a] || 0) - (balance[b] || 0));
    const weakest    = sorted[0];
    const secondWeak = sorted[1];
    const dmEl       = (chart.dayMasterEl || '').toLowerCase();

    // Score each item by how well its tradition resonates with the user's element profile
    const scored = nonSaved.map(item => {
      let score = 0;
      if (ELEMENT_TRADITION_AFFINITY[weakest]?.includes(item.tradition))    score += 3;
      if (ELEMENT_TRADITION_AFFINITY[secondWeak]?.includes(item.tradition)) score += 2;
      if (ELEMENT_TRADITION_AFFINITY[dmEl]?.includes(item.tradition))       score += 1;
      const why = WHY_CAPTIONS[weakest]?.[item.tradition]
               || WHY_CAPTIONS[dmEl]?.[item.tradition]
               || null;
      return { ...item, _score: score, _why: why };
    }).sort((a, b) => b._score - a._score);

    // Shuffle within each score tier so the feed feels fresh on each visit
    const tiers = {};
    for (const item of scored) {
      (tiers[item._score] = tiers[item._score] || []).push(item);
    }
    const result = [];
    for (const score of Object.keys(tiers).sort((a, b) => b - a)) {
      const shuffled = tiers[score].sort(() => Math.random() - 0.5);
      result.push(...shuffled);
      if (result.length >= 18) break;
    }
    return result.slice(0, 18);
  }

  function categorizeCitation(citation) {
    const combined = ((citation.source || '') + ' ' + (citation.author || '')).toLowerCase();
    if (/\b(tao te ching|lao tzu|zhuangzi|dao)\b/.test(combined))                     return 'daoism';
    if (/\b(analects|confucius)\b/.test(combined))                                      return 'confucianism';
    if (/\b(dhammapada|heart sutra|buddha|sutra)\b/.test(combined))                    return 'buddhism';
    if (/\b(i ching|yijing)\b/.test(combined))                                          return 'chinese';
    if (/\b(meditations|marcus aurelius|seneca|epictetus|stoic)\b/.test(combined))      return 'stoicism';
    if (/\b(plato|aristotle|heraclitus|republic|ethics|greek)\b/.test(combined))        return 'greek';
    if (/\b(rumi|masnavi|hafiz|ibn arabi|sufi|sa.di)\b/.test(combined))                  return 'sufi';
    if (/\b(bhagavad gita|veda|vedic|upanishad)\b/.test(combined))                      return 'vedic';
    if (/\b(bible|psalm|proverb|matthew|gospel|augustine|kempis|christian|corinthian)\b/.test(combined)) return 'christianity';
    if (/\b(quran|hadith|al-ghazali|ghazali|islamic|prophet|muhammad|bukhari|muslim)\b/.test(combined))  return 'islam';
    if (/\b(talmud|torah|rabbi|pirkei|maimonides|jewish|hebrew|hillel|mishneh)\b/.test(combined))        return 'judaism';
    return 'uncategorized';
  }

  function addCitationToVault(citation) {
    if (!citation || !citation.text) return false;
    const vault = getWisdomVault();
    const norm  = t => String(t).trim().toLowerCase().replace(/\s+/g, ' ');
    if (vault.some(e => norm(e.text) === norm(citation.text))) return false;

    if (citation.tradition === 'saved') {
      // Profile-scoped: store inside the profile object so saves never bleed across profiles
      const items = state.savedOracleItems || [];
      items.push({
        tradition: 'saved',
        source:    (citation.source || 'SoulMap Oracle').trim(),
        author:    (citation.author || '').trim(),
        text:      citation.text.trim(),
        savedAt:   citation.savedAt || Date.now(),
      });
      state.savedOracleItems = items;
      saveCurrentProfile();
    } else {
      // Global: classical citations are not profile-specific
      const additions = getStoredAdditions();
      additions.push({
        tradition: citation.tradition || categorizeCitation(citation),
        source:    (citation.source || 'Unknown').trim(),
        author:    (citation.author || 'Unknown').trim(),
        text:      citation.text.trim(),
      });
      saveAdditions(additions);
    }

    const active = document.querySelector('.wisdom-vault-tab.active');
    if (document.getElementById('wisdom-vault-list')) renderWisdomVault(active ? active.getAttribute('data-tradition') : 'all');
    return true;
  }

  function parseCitationFromMessage(messageText) {
    if (!messageText) return null;
    const m = messageText.match(/As\s+(.+?)\s+wrote\s+in\s+(.+?):\s*[\u201C"]([^"\u201D]+)[\u201D"]/i);
    if (m && m[3] && m[3].length > 10) return { author: m[1].trim(), source: m[2].trim(), text: m[3].trim() };
    return null;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderWisdomVault(filter) {
    const list  = document.getElementById('wisdom-vault-list');
    const vault = getWisdomVault();
    let items;
    if (filter === 'all') {
      items = curateForYou(vault, state.chart || null);
    } else {
      items = vault.filter(x => x.tradition === filter);
    }
    list.innerHTML = items.map(x => {
      if (x.tradition === 'saved') {
        return `<div class="wisdom-vault-item wisdom-vault-item--saved">
          <span class="tradition">saved</span>
          <h4 class="oracle-saved-question">${escapeHtml(x.author)}</h4>
          <div class="oracle-saved-body">${renderMarkdown(x.text)}</div>
        </div>`;
      }
      const title  = x.source + (x.author ? ' — ' + x.author : '');
      const whyHtml = x._why
        ? `<div class="vault-why">${escapeHtml(x._why)}</div>`
        : '';
      return `<div class="wisdom-vault-item">
        <span class="tradition">${escapeHtml(x.tradition)}</span>
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(x.text)}</p>
        ${whyHtml}
      </div>`;
    }).join('');
  }

  function initWisdomVault() {
    renderWisdomVault('all');
    document.querySelectorAll('.wisdom-vault-tab').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.wisdom-vault-tab').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderWisdomVault(this.getAttribute('data-tradition'));
      });
    });
  }

  // ─── Daily Spark ─────────────────────────────────────────────────
  const SPARK_PROMPTS = [
    'What are you holding onto that no longer serves you?',
    'Who made you feel seen today?',
    'What would you do if you weren\'t afraid?',
    'Where did you find a moment of peace today?',
    'What do you need to forgive yourself for?'
  ];
  const SPARK_PRACTICES = [
    'Take 5 breaths: count to 4 on each inhale and exhale.',
    'Name 3 things you\'re grateful for — one for body, mind, and spirit.',
    'Notice 5 things you can see, 4 you can touch, 3 you can hear.'
  ];

  function initSpark() {
    const today = new Date();
    const seed  = today.getDate() + today.getMonth() * 31;
    const vault = getWisdomVault();
    const q     = vault[seed % vault.length];
    document.getElementById('spark-date').textContent    = today.toDateString();
    document.getElementById('spark-text').innerHTML      = `<strong>${q.source}${q.author ? ' — ' + q.author : ''}</strong><p style="margin-top:0.5rem;opacity:0.85">${q.text}</p>`;
    document.getElementById('spark-prompt').textContent  = SPARK_PROMPTS[seed % SPARK_PROMPTS.length];
    document.getElementById('spark-practice').textContent = SPARK_PRACTICES[seed % SPARK_PRACTICES.length];
    try {
      const saved = localStorage.getItem('soulmap_streak');
      if (saved) state.streak = parseInt(saved, 10);
      document.getElementById('spark-streak-num').textContent = state.streak;
    } catch (_) {}
    document.getElementById('btn-spark-done').addEventListener('click', () => {
      state.streak++;
      try { localStorage.setItem('soulmap_streak', String(state.streak)); } catch (_) {}
      document.getElementById('spark-streak-num').textContent = state.streak;
      document.getElementById('btn-spark-done').textContent = 'Done! See you tomorrow.';
    });
  }

  // ─── Still Point ─────────────────────────────────────────────────
  const MEDITATIONS = [
    { icon:'🪵', title:'Wood — Growth & Vision',      desc:'Visualization of roots and rising energy. 5–10 min.' },
    { icon:'🔥', title:'Fire — Warmth & Connection',   desc:'Heart-centered warmth. For when you feel disconnected.' },
    { icon:'🗿', title:'Earth — Grounding',            desc:'Body scan and earth connection. For anxiety.' },
    { icon:'🪙', title:'Metal — Release & Clarity',   desc:'Breath-focused, letting go. For clutter or indecision.' },
    { icon:'💧', title:'Water — Flow & Surrender',    desc:'Fluid movement visualization. For when you feel stuck.' },
    { icon:'◎',  title:'Before a Big Decision',       desc:'Grounding + clarity. 10 min.' }
  ];

  function initStillPoint() {
    document.getElementById('meditation-list').innerHTML = MEDITATIONS.map(m =>
      `<div class="meditation-item"><span class="icon">${m.icon}</span><div><div class="title">${m.title}</div><p class="desc">${m.desc}</p></div></div>`
    ).join('');
  }

  // ─── Refresh narrative button ─────────────────────────────────────
  function initRefreshNarrative() {
    const btn = document.getElementById('btn-refresh-narrative');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      if (!state.chart) return;
      // Clear cached narrative — show static fallback while re-fetching
      setState({ narrativeFromAPI: null });
      saveCurrentProfile();
      renderAppBlueprint();
      const narrative = await fetchNarrativeFromAPI(state.chart);
      if (narrative) {
        setState({ narrativeFromAPI: narrative });
        saveCurrentProfile();
        updateNarrativeSection(narrative);
      }
    });
  }

  // ─── Profile Switcher ─────────────────────────────────────────────
  function renderProfileList() {
    const list     = document.getElementById('profile-list');
    if (!list) return;
    const profiles = loadProfiles();
    const single   = profiles.length <= 1;

    list.innerHTML = profiles.map(p => {
      const isActive = p.id === state.profileId;
      // Compute soul type name from chart, or fall back to Day Master only
      let soulSubtitle = '';
      try {
        const c = calculateBaZi(p.birthDate, p.shichen);
        soulSubtitle = SOUL_TYPES[c.dayMaster].sub;
      } catch (_) {}

      return `<li class="profile-list-item${isActive ? ' profile-list-item-active' : ''}" data-id="${p.id}">
        <div class="profile-list-info">
          ${isActive ? '<span class="profile-active-dot" aria-label="Active"></span>' : '<span class="profile-active-dot profile-active-dot-empty"></span>'}
          <div>
            <strong class="profile-list-name">${p.name}</strong>
            <span class="profile-list-sub">${soulSubtitle}</span>
          </div>
        </div>
        <button class="profile-delete-btn btn btn-ghost btn-sm${single ? ' profile-delete-disabled' : ''}"
          data-delete="${p.id}" ${single ? 'disabled aria-disabled="true"' : ''}
          aria-label="Delete ${p.name}">✕</button>
      </li>`;
    }).join('');

    // Switch on click of a profile row
    list.querySelectorAll('.profile-list-item').forEach(item => {
      item.addEventListener('click', function(e) {
        if (e.target.closest('[data-delete]')) return; // handled below
        const id = this.getAttribute('data-id');
        const profiles = loadProfiles();
        const profile  = profiles.find(p => p.id === id);
        if (!profile) return;
        closeProfileSheet();
        activateProfile(profile);
        renderAppBlueprint();
        showView('view-app');
        switchTab('blueprint');
      });
    });

    // Delete button
    list.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (this.disabled) return;
        const id       = this.getAttribute('data-delete');
        let profiles   = loadProfiles();
        const wasActive = id === state.profileId;
        profiles       = profiles.filter(p => p.id !== id);
        saveProfiles(profiles);
        if (wasActive && profiles.length > 0) {
          activateProfile(profiles[0]);
          renderAppBlueprint();
        }
        renderProfileList();
      });
    });
  }

  function openProfileSheet() {
    const sheet = document.getElementById('profile-sheet');
    if (!sheet) return;
    renderProfileList();
    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeProfileSheet() {
    const sheet = document.getElementById('profile-sheet');
    if (!sheet) return;
    sheet.hidden = true;
    document.body.style.overflow = '';
  }

  function initProfileSwitcher() {
    const openBtn  = document.getElementById('btn-profile-switcher');
    const closeBtn = document.getElementById('btn-close-sheet');
    const backdrop = document.getElementById('profile-sheet-backdrop');
    const addBtn   = document.getElementById('btn-add-profile');

    if (openBtn)  openBtn.addEventListener('click', openProfileSheet);
    if (closeBtn) closeBtn.addEventListener('click', closeProfileSheet);
    if (backdrop) backdrop.addEventListener('click', closeProfileSheet);

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        closeProfileSheet();
        // Clear form for a fresh profile
        const form = document.getElementById('form-onboard');
        if (form) form.reset();
        // Signal to onboarding that this is a new profile (not editing existing)
        setState({ profileId: null, profileName: '' });
        showView('view-onboard');
      });
    }
  }

  // Pre-fill onboarding form if editing an existing profile
  function prefillOnboardForm() {
    if (!state.profileId || !state.birthDate) return;
    const form = document.getElementById('form-onboard');
    if (!form) return;
    const set = (name, val) => {
      const el = form.elements[name];
      if (el && val != null) el.value = val;
    };
    set('profileName', state.profileName);
    set('birthDate',   state.birthDate);
    set('shichen',     state.shichen);
    set('gender',      state.gender);
    set('occupation',  state.occupation);
    set('relationship',state.relationship);
    set('currentConcern', state.currentConcern);
  }

  // ─── Init ────────────────────────────────────────────────────────
  function init() {
    initLanding();
    initOnboard();
    initTabs();
    initOracle();
    initWisdomVault();
    initSpark();
    initStillPoint();
    initRefreshNarrative();
    initProfileSwitcher();

    // Migrate any legacy single-session → first named profile
    migrateOldSession();

    const profiles  = loadProfiles();
    if (profiles.length > 0) {
      const activeId  = getActiveProfileId();
      const profile   = profiles.find(p => p.id === activeId) || profiles[0];
      activateProfile(profile);
      migrateOrphanedSaves(); // one-time: move global 'saved' items into this profile
      renderAppBlueprint();
      showView('view-app');
      switchTab('blueprint');
    }
    // else: stay on view-landing (default)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
