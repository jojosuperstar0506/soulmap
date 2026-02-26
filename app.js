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
    metal: 'var(--color-ash)',
    water: 'var(--color-cyan)'
  };
  // Hex fallbacks for SVG (CSS vars don't work in SVG attributes)
  const ELEMENT_HEX = {
    wood:'#2B4CE0', fire:'#E8372A', earth:'#FF6B1A', metal:'#888888', water:'#00C5CD'
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
    profileId: null,     // ID of the active profile
    profileName: ''      // display name of the active profile
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
      narrativeFromAPI: state.narrativeFromAPI || null
    };
    if (idx >= 0) { profiles[idx] = profileData; } else { profiles.push(profileData); }
    saveProfiles(profiles);
    setActiveProfileId(state.profileId);
  }

  /** Load a profile object into state and re-render the app */
  function activateProfile(p) {
    const chart = calculateBaZi(p.birthDate, p.shichen);
    chart.daYun = calculateDaYun(chart, p.birthDate, p.gender || 'male');
    setState({
      birthDate:      p.birthDate,
      shichen:        p.shichen,
      gender:         p.gender || 'male',
      occupation:     p.occupation || '',
      relationship:   p.relationship || '',
      currentConcern: p.currentConcern || '',
      chart,
      soulTypeIndex:  chart.dayMaster,
      profileId:        p.id,
      profileName:      p.name || 'My Chart',
      narrativeFromAPI: p.narrativeFromAPI || null
    });
    setActiveProfileId(p.id);
    // Update header labels
    const nameEl = document.getElementById('profile-btn-name');
    if (nameEl) nameEl.textContent = p.name || 'My Chart';
    const typeEl = document.getElementById('app-user-type');
    if (typeEl) typeEl.textContent = SOUL_TYPES[chart.dayMaster].name;
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

  // ─── BaZi Calculation ────────────────────────────────────────────
  function calculateBaZi(birthDateStr, shichenIndex) {
    const [y, m, d] = birthDateStr.split('-').map(Number);
    const dayJdn         = jdn(y, m, d);
    const dayPillarIndex = (dayJdn + 58) % 60;
    const dayStem        = dayPillarIndex % 10;
    const dayBranch      = dayPillarIndex % 12;

    const hourBranch = parseInt(shichenIndex, 10) % 12;
    const ziStem     = [0, 2, 4, 6, 8][dayStem % 5];
    const hourStem   = (ziStem + hourBranch) % 10;

    const beforeLiChun  = m < 2 || (m === 2 && d < 5);
    const yearForPillar = beforeLiChun ? y - 1 : y;
    let yearPillarIndex = (yearForPillar - 1984) % 60;
    if (yearPillarIndex < 0) yearPillarIndex += 60;
    const yearStem   = yearPillarIndex % 10;
    const yearBranch = yearPillarIndex % 12;

    const monthBranch = m === 1 ? 1 : (m + 1) % 12;
    const yinYueStem  = [2, 4, 6, 8, 0][yearStem % 5];
    const monthStem   = (yinYueStem + monthBranch - 2 + 20) % 10;

    const elementCounts = { wood:0, fire:0, earth:0, metal:0, water:0 };
    [yearStem, monthStem, dayStem, hourStem].forEach(s => {
      elementCounts[['wood','fire','earth','metal','water'][STEM_ELEMENT[s]]]++;
    });
    [yearBranch, monthBranch, dayBranch, hourBranch].forEach(b => {
      elementCounts[['wood','fire','earth','metal','water'][[0,2,0,0,2,1,1,2,3,3,2,4][b]]]++;
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
      pillarsStr: `${STEMS[yearStem]}${BRANCHES[yearBranch]} ${STEMS[monthStem]}${BRANCHES[monthBranch]} ${STEMS[dayStem]}${BRANCHES[dayBranch]} ${STEMS[hourStem]}${BRANCHES[hourBranch]}`
    };
  }

  // ─── 大运 Major Luck Periods ─────────────────────────────────────
  /**
   * Simplified calculation:
   * - Yang year stem + Male  OR  Yin year stem + Female → Forward through months
   * - Yin year stem + Male   OR  Yang year stem + Female → Backward
   * - Starting age approximated from birth day / 3 (simplified; full solar-term
   *   lookup is a future improvement noted in code).
   */
  function calculateDaYun(chart, birthDateStr, gender) {
    const [y, m, d] = birthDateStr.split('-').map(Number);
    const yearStem  = chart.yearPillar.stem;
    const isYangYear = yearStem % 2 === 0; // 甲丙戊庚壬 are yang (even index)
    const isMale    = gender === 'male';
    const forward   = (isYangYear && isMale) || (!isYangYear && !isMale);

    // Simplified starting age: days to nearest solar-term proxy ÷ 3
    // Proxy: 15th of next (forward) or previous (backward) month
    let termDate;
    if (forward) {
      const nm = m === 12 ? 1 : m + 1;
      const ny = m === 12 ? y + 1 : y;
      termDate = new Date(ny, nm - 1, 15);
    } else {
      const pm = m === 1 ? 12 : m - 1;
      const py = m === 1 ? y - 1 : y;
      termDate = new Date(py, pm - 1, 15);
    }
    const birthDate = new Date(y, m - 1, d);
    const daysDiff  = Math.abs(termDate - birthDate) / (1000 * 60 * 60 * 24);
    const startAge  = Math.max(1, Math.round(daysDiff / 3));

    const currentYear = new Date().getFullYear();
    const currentAge  = currentYear - y;

    const mStem   = chart.monthPillar.stem;
    const mBranch = chart.monthPillar.branch;

    const decades = [];
    for (let i = 0; i < 8; i++) {
      const step        = forward ? (i + 1) : -(i + 1);
      const stemIndex   = ((mStem   + step) % 10 + 10) % 10;
      const branchIndex = ((mBranch + step) % 12 + 12) % 12;
      const decadeStart = startAge + i * 10;
      const decadeEnd   = decadeStart + 9;

      decades.push({
        stemIndex, branchIndex,
        stemChar:   STEMS[stemIndex],
        branchChar: BRANCHES[branchIndex],
        startAge: decadeStart, endAge: decadeEnd,
        startYear: y + decadeStart, endYear: y + decadeEnd,
        isCurrent: currentAge >= decadeStart && currentAge <= decadeEnd,
        isPast:    currentAge > decadeEnd,
        label:     STEMS[stemIndex] + BRANCHES[branchIndex]
      });
    }
    return decades;
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
      const stemIdx = chart.dayMaster;
      const payload = {
        dayMaster:         STEMS[stemIdx] + ' (' + (STEM_NAMES_EN[stemIdx] || '') + ')',
        pillarsStr:        chart.pillarsStr || '',
        elementBalance:    formatElementBalance(chart),
        dayMasterStrength: chart.dayMasterStrength || 'Moderate',
        favorableElements: (chart.favorableElements || []).map(
          e => e ? e[0].toUpperCase() + e.slice(1) : ''
        ).filter(Boolean),
        soulType:          (SOUL_TYPES[stemIdx] || {}).name || '',
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

  function updateNarrativeSection(narrative) {
    if (!narrative) return;
    const s = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
    s('detail-core-essence',    narrative.coreEssence);
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
        <span class="bazi-char" style="color:${ELEMENT_HEX[d.stemEl]}">${STEMS[d.p.stem]}</span>
        <span class="bazi-elem-tag bazi-elem-${d.stemEl}">${d.stemEl.charAt(0).toUpperCase()}</span>
      </div>`;
    }

    function branchCell(d) {
      return `<div class="bazi-cell">
        <span class="bazi-char" style="color:${ELEMENT_HEX[d.branchEl]}">${BRANCHES[d.p.branch]}</span>
        <span class="bazi-elem-tag bazi-elem-${d.branchEl}">${d.branchEl.charAt(0).toUpperCase()}</span>
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

    const rows = [
      // Row 0 — header
      `<div class="bazi-row bazi-row-header">
        <div class="bazi-label">日期</div>
        ${PILLAR_LABELS_CN.map((cn, i) => `<div class="bazi-col-head${i===2?' bazi-day-head':''}">${cn}<span class="bazi-col-en">${PILLAR_LABELS_EN[i]}</span></div>`).join('')}
      </div>`,

      // Row 1 — 主星 Ten God
      `<div class="bazi-row">
        <div class="bazi-label">主星</div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-tengod${i===2?' bazi-day':''}">${TEN_GOD_NAMES[d.tg]}</div>`).join('')}
      </div>`,

      // Row 2 — 天干 Heavenly Stems
      `<div class="bazi-row">
        <div class="bazi-label">天干</div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${stemCell(d).replace('<div class="bazi-cell">','<div class="bazi-cell">')}</div>`).join('')}
      </div>`,

      // Row 3 — 地支 Earthly Branches
      `<div class="bazi-row">
        <div class="bazi-label">地支</div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${branchCell(d)}</div>`).join('')}
      </div>`,

      // Row 4 — 藏干 Hidden Stems
      `<div class="bazi-row">
        <div class="bazi-label">藏干</div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${hiddenCell(d)}</div>`).join('')}
      </div>`,

      // Row 5 — 副星 Sub Stars (ten gods of hidden stems)
      `<div class="bazi-row">
        <div class="bazi-label">副星</div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${subStarCell(d)}</div>`).join('')}
      </div>`,

      // Row 6 — 星运 12 Growth Stage (stem in its branch)
      `<div class="bazi-row">
        <div class="bazi-label">星运</div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-small${i===2?' bazi-day':''}">${d.stage}</div>`).join('')}
      </div>`,

      // Row 7 — 自坐 Self-seat (day master in each branch)
      `<div class="bazi-row">
        <div class="bazi-label">自坐</div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-small${i===2?' bazi-day':''}">${d.selfSeat}</div>`).join('')}
      </div>`,

      // Row 8 — 空亡 Empty/Void
      `<div class="bazi-row">
        <div class="bazi-label">空亡</div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-small${i===2?' bazi-day':''}">${d.kongwang}</div>`).join('')}
      </div>`,

      // Row 9 — 纳音 Nayin
      `<div class="bazi-row">
        <div class="bazi-label">纳音</div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-small${i===2?' bazi-day':''}">${d.nayin}</div>`).join('')}
      </div>`,

      // Row 10 — 神煞 Spirit Killers
      `<div class="bazi-row bazi-row-last">
        <div class="bazi-label">神煞</div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${shaCell(d)}</div>`).join('')}
      </div>`
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

    strip.innerHTML = state.chart.daYun.map((decade, i) => {
      const accent  = DAYUN_ACCENT_COLORS[i % DAYUN_ACCENT_COLORS.length];
      const desc    = DAYUN_STEM_DESC[decade.stemIndex];
      const classes = ['dayun-card', decade.isCurrent ? 'dayun-card-active' : ''].filter(Boolean).join(' ');
      return `
        <div class="${classes}" style="--card-accent:${accent}">
          <div class="dayun-row">
            <span class="dayun-row-label">Age · Year</span>
            <span class="dayun-age">${decade.startAge}–${decade.endAge} yrs</span>
            <span class="dayun-years">${decade.startYear}–${decade.endYear}</span>
            ${decade.isCurrent ? '<span class="badge-current" style="display:inline-block;margin-top:6px">NOW</span>' : ''}
          </div>
          <div class="dayun-row">
            <span class="dayun-row-label">天干 · 地支</span>
            <div class="dayun-chars">
              <span class="dayun-stem">${decade.stemChar}</span>
              <span class="dayun-branch">${decade.branchChar}</span>
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

  // ─── Energy Aspect Charts (SVG dot-dash) ─────────────────────────
  const ENERGY_ASPECTS = [
    { key:'love',   labelEn:'Love & Relationships', labelCn:'感情', aspectIdx:0 },
    { key:'wealth', labelEn:'Wealth',               labelCn:'财运', aspectIdx:1 },
    { key:'career', labelEn:'Career',               labelCn:'事业', aspectIdx:2 },
    { key:'health', labelEn:'Health',               labelCn:'健康', aspectIdx:3 }
  ];

  /** Seeded pseudo-random energy value 1–10 per aspect/decade combination */
  function getEnergyValue(aspectIdx, stemIndex, branchIndex) {
    return ((stemIndex * 7 + branchIndex * 11 + aspectIdx * 13 + stemIndex * branchIndex) % 8) + 2; // 2–9
  }

  function renderEnergyCharts() {
    const section = document.getElementById('energy-charts-section');
    if (!section || !state.chart || !state.chart.daYun) return;

    section.innerHTML = ENERGY_ASPECTS.map(a =>
      `<div class="energy-chart-wrap">
        <div class="energy-chart-header">
          <span class="energy-chart-title">${a.labelEn}</span>
          <span class="energy-chart-cn">${a.labelCn}</span>
        </div>
        <div class="energy-chart-svg-wrap" id="energy-svg-${a.key}"></div>
      </div>`
    ).join('');

    ENERGY_ASPECTS.forEach(a => drawEnergyChart(a));
  }

  function drawEnergyChart(aspect) {
    const container = document.getElementById('energy-svg-' + aspect.key);
    if (!container) return;

    const decades = state.chart.daYun;
    const n       = decades.length;
    const values  = decades.map(d => getEnergyValue(aspect.aspectIdx, d.stemIndex, d.branchIndex));

    const VW = 400, VH = 90;
    const PL = 10, PR = 10, PT = 18, PB = 20;
    const CW = VW - PL - PR, CH = VH - PT - PB;

    const xOf = i => PL + (n > 1 ? (i / (n - 1)) * CW : CW / 2);
    const yOf = v => PT + CH - ((v - 1) / 8) * CH; // 1–9 scale

    const ns  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', VH);

    const currentIdx = decades.findIndex(d => d.isCurrent);

    // ── Past polyline (solid cobalt)
    const pastEnd = currentIdx >= 0 ? currentIdx + 1 : decades.filter(d => d.isPast).length;
    if (pastEnd > 1) {
      const pts = decades.slice(0, pastEnd).map((_, i) => `${xOf(i)},${yOf(values[i])}`).join(' ');
      const pl  = document.createElementNS(ns, 'polyline');
      pl.setAttribute('points', pts);
      pl.setAttribute('fill', 'none');
      pl.setAttribute('stroke', '#2B4CE0');
      pl.setAttribute('stroke-opacity', '0.65');
      pl.setAttribute('stroke-width', '1.5');
      svg.appendChild(pl);
    }

    // ── Future polyline (dashed ghost)
    const futureStart = Math.max(0, currentIdx >= 0 ? currentIdx : pastEnd - 1);
    if (n - futureStart > 1) {
      const pts = decades.slice(futureStart).map((_, i) => `${xOf(futureStart + i)},${yOf(values[futureStart + i])}`).join(' ');
      const fl  = document.createElementNS(ns, 'polyline');
      fl.setAttribute('points', pts);
      fl.setAttribute('fill', 'none');
      fl.setAttribute('stroke', '#444444');
      fl.setAttribute('stroke-width', '1');
      fl.setAttribute('stroke-dasharray', '4,3');
      svg.appendChild(fl);
    }

    // ── Dots
    decades.forEach((d, i) => {
      const x = xOf(i), y = yOf(values[i]);

      if (d.isCurrent) {
        // Outer pulse ring
        const ring = document.createElementNS(ns, 'circle');
        ring.setAttribute('cx', x); ring.setAttribute('cy', y);
        ring.setAttribute('r', '9');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#E8372A');
        ring.setAttribute('stroke-opacity', '0.25');
        ring.setAttribute('stroke-width', '1.5');
        svg.appendChild(ring);
        // Filled vermillion dot
        const dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('cx', x); dot.setAttribute('cy', y);
        dot.setAttribute('r', '5');
        dot.setAttribute('fill', '#E8372A');
        svg.appendChild(dot);
        // "now" label
        const lbl = document.createElementNS(ns, 'text');
        lbl.setAttribute('x', x); lbl.setAttribute('y', y - 11);
        lbl.setAttribute('text-anchor', 'middle');
        lbl.setAttribute('font-size', '7');
        lbl.setAttribute('fill', '#E8372A');
        lbl.setAttribute('font-family', 'DM Sans, system-ui');
        lbl.setAttribute('font-weight', '700');
        lbl.setAttribute('letter-spacing', '0.05em');
        lbl.textContent = 'NOW';
        svg.appendChild(lbl);
      } else if (d.isPast) {
        const dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('cx', x); dot.setAttribute('cy', y);
        dot.setAttribute('r', '4');
        dot.setAttribute('fill', '#2B4CE0');
        dot.setAttribute('opacity', '0.7');
        svg.appendChild(dot);
      } else {
        // Future: hollow
        const dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('cx', x); dot.setAttribute('cy', y);
        dot.setAttribute('r', '3.5');
        dot.setAttribute('fill', 'none');
        dot.setAttribute('stroke', '#444444');
        dot.setAttribute('stroke-width', '1.5');
        svg.appendChild(dot);
      }

      // X-axis label (decade chars)
      const xLbl = document.createElementNS(ns, 'text');
      xLbl.setAttribute('x', x); xLbl.setAttribute('y', VH - 3);
      xLbl.setAttribute('text-anchor', 'middle');
      xLbl.setAttribute('font-size', '10');
      xLbl.setAttribute('fill', d.isCurrent ? '#E8372A' : '#444444');
      xLbl.setAttribute('font-family', 'Noto Serif SC, serif');
      xLbl.textContent = d.stemChar + d.branchChar;
      svg.appendChild(xLbl);
    });

    container.appendChild(svg);
  }

  // ─── Main Blueprint Renderer ─────────────────────────────────────
  function renderAppBlueprint() {
    if (!state.chart) return;
    const t       = SOUL_TYPES[state.soulTypeIndex];
    const n       = BLUEPRINT_NARRATIVE[state.soulTypeIndex] || null;
    const balance = state.chart.elementBalance;
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
  function buildOracleChartContext() {
    if (!state.chart) return null;
    const c = state.chart;
    const stemIdx = c.dayMaster;
    return {
      dayMaster:         STEMS[stemIdx] + ' (' + (STEM_NAMES_EN[stemIdx] || '') + ')',
      pillarsStr:        c.pillarsStr || '',
      elementBalance:    formatElementBalance(c),
      dayMasterStrength: c.dayMasterStrength || 'Moderate',
      favorableElements: (c.favorableElements || []).map(
        e => e ? e[0].toUpperCase() + e.slice(1) : ''
      ).filter(Boolean),
      soulType:          (SOUL_TYPES[stemIdx] || {}).name || '',
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

  function initOracle() {
    const form        = document.getElementById('oracle-form');
    const input       = document.getElementById('oracle-input');
    const messages    = document.getElementById('oracle-messages');
    const placeholder = document.getElementById('oracle-placeholder');
    const sendBtn     = form ? form.querySelector('button[type="submit"]') : null;

    // Conversation history for multi-turn context (role/content pairs)
    const conversationHistory = [];

    document.querySelectorAll('.oracle-suggestion').forEach(btn => {
      btn.addEventListener('click', () => { input.value = btn.getAttribute('data-q'); input.focus(); });
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;

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
        reply.textContent = answer;
        messages.appendChild(reply);
        messages.scrollTop = messages.scrollHeight;

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

  // ─── Wisdom Vault / Sacred Library ──────────────────────────────
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
  function getWisdomVault()   { return WISDOM_VAULT_BASE.concat(getStoredAdditions()); }

  function categorizeCitation(citation) {
    const combined = ((citation.source || '') + ' ' + (citation.author || '')).toLowerCase();
    if (/\b(tao te ching|lao tzu|zhuangzi|dao)\b/.test(combined))                     return 'daoism';
    if (/\b(analects|confucius)\b/.test(combined))                                      return 'confucianism';
    if (/\b(dhammapada|heart sutra|buddha|sutra)\b/.test(combined))                    return 'buddhism';
    if (/\b(i ching|yijing)\b/.test(combined))                                          return 'chinese';
    if (/\b(meditations|marcus aurelius|seneca|epictetus|stoic)\b/.test(combined))      return 'stoicism';
    if (/\b(plato|aristotle|heraclitus|republic|ethics|greek)\b/.test(combined))        return 'greek';
    if (/\b(rumi|masnavi|sufi)\b/.test(combined))                                       return 'sufi';
    if (/\b(bhagavad gita|veda|vedic)\b/.test(combined))                                return 'vedic';
    return 'uncategorized';
  }

  function addCitationToVault(citation) {
    if (!citation || !citation.text) return false;
    const vault = getWisdomVault();
    const norm  = t => String(t).trim().toLowerCase().replace(/\s+/g, ' ');
    if (vault.some(e => norm(e.text) === norm(citation.text))) return false;
    const additions = getStoredAdditions();
    additions.push({ tradition: categorizeCitation(citation), source: (citation.source || 'Unknown').trim(), author: (citation.author || 'Unknown').trim(), text: citation.text.trim() });
    saveAdditions(additions);
    const active = document.querySelector('.library-tab.active');
    if (document.getElementById('library-list')) renderLibrary(active ? active.getAttribute('data-tradition') : 'all');
    return true;
  }

  function parseCitationFromMessage(messageText) {
    if (!messageText) return null;
    const m = messageText.match(/As\s+(.+?)\s+wrote\s+in\s+(.+?):\s*[\u201C"]([^"\u201D]+)[\u201D"]/i);
    if (m && m[3] && m[3].length > 10) return { author: m[1].trim(), source: m[2].trim(), text: m[3].trim() };
    return null;
  }

  function renderLibrary(filter) {
    const list  = document.getElementById('library-list');
    const vault = getWisdomVault();
    const items = filter === 'all' ? vault : vault.filter(x => x.tradition === filter);
    list.innerHTML = items.map(x => {
      const title = x.source + (x.author ? ' — ' + x.author : '');
      return `<div class="library-item"><span class="tradition">${x.tradition}</span><h4>${title}</h4><p>${x.text}</p></div>`;
    }).join('');
  }

  function initLibrary() {
    renderLibrary('all');
    document.querySelectorAll('.library-tab').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.library-tab').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderLibrary(this.getAttribute('data-tradition'));
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
    initLibrary();
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
