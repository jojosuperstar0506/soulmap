/**
 * SoulMap — Life decision making tool (HTML MVP)
 * BaZi calculation, Soul Blueprint, and main app logic.
 */

(function () {
  'use strict';

  // ─── BaZi constants (PRD Appendix A) ─────────────────────────────────
  const STEMS = '甲乙丙丁戊己庚辛壬癸';
  const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
  const ELEMENT_NAMES = { wood: 'Wood', fire: 'Fire', earth: 'Earth', metal: 'Metal', water: 'Water' };
  const ELEMENT_COLORS = { wood: '#10b981', fire: '#f59e0b', earth: '#92400e', metal: '#94a3b8', water: '#3b82f6' };
  const STEM_ELEMENT = [0,0,1,1,2,2,3,3,4,4]; // 0=wood, 1=fire, 2=earth, 3=metal, 4=water

  const SOUL_TYPES = [
    { name: 'The Pioneer', sub: '甲木 · Jiǎ Wood', element: 'wood', emoji: '🌳', tagline: 'Tall tree — growth, ambition, upward drive. You build and lead with clarity.' },
    { name: 'The Weaver', sub: '乙木 · Yǐ Wood', element: 'wood', emoji: '🪴', tagline: 'Vine and flower — flexible, graceful, adaptive. You connect and nurture.' },
    { name: 'The Radiant', sub: '丙火 · Bǐng Fire', element: 'fire', emoji: '☀️', tagline: 'Sun — warmth, visibility, leadership. You light the way for others.' },
    { name: 'The Luminary', sub: '丁火 · Dīng Fire', element: 'fire', emoji: '🕯️', tagline: 'Candle and star — gentle light, insight, intimacy. You see what others miss.' },
    { name: 'The Mountain', sub: '戊土 · Wù Earth', element: 'earth', emoji: '⛰️', tagline: 'Mountain — stability, reliability, immovable. You are the foundation.' },
    { name: 'The Garden', sub: '己土 · Jǐ Earth', element: 'earth', emoji: '🌿', tagline: 'Fertile soil — nurturing, receptive, transformative. You help things grow.' },
    { name: 'The Blade', sub: '庚金 · Gēng Metal', element: 'metal', emoji: '⚔️', tagline: 'Sword — decisive, reforming, sharp. You cut through confusion.' },
    { name: 'The Jewel', sub: '辛金 · Xīn Metal', element: 'metal', emoji: '💎', tagline: 'Gem — refined, precious, sensitive. You value quality and depth.' },
    { name: 'The Ocean', sub: '壬水 · Rén Water', element: 'water', emoji: '🌊', tagline: 'Ocean — powerful, flowing, unstoppable. You adapt and persist.' },
    { name: 'The Mist', sub: '癸水 · Guǐ Water', element: 'water', emoji: '🌫️', tagline: 'Still water runs deep. You absorb everything, reflecting the world with quiet clarity.' }
  ];

  const SEASON_NAMES = ['Spring Wood', 'Summer Fire', 'Transitional Earth', 'Autumn Metal', 'Winter Water'];

  // Part B schema: core essence + classical quote (separate) + work / love / growth only. No theme, challenge, strength.
  const BLUEPRINT_NARRATIVE = [
    { shortName: 'Pioneer', essence: 'You are built to rise — to take the lead and create something that lasts. Your clarity and ambition are not ego; they are your nature reaching for the light.', work: 'In work, you thrive when you have room to build and own outcomes. Roles that reward initiative, strategy, or leadership fit your chart.', love: 'In relationships, you offer stability and vision. You need a partner who respects your need to grow and who can stand beside you without dimming your light.', growth: 'Your growth happens when you channel your drive into structures that last — and when you learn to bend without breaking.', thrive: 'Water and Wood support you; seek spaces that allow both roots and reach.' },
    { shortName: 'Weaver', essence: 'You are the one who connects — people, ideas, and possibilities. Your strength is flexibility and grace under pressure; you don\'t need to be the tallest tree to change the landscape.', work: 'In work, you excel where collaboration and nuance matter. Creative, people-centered, or adaptive roles let your nature shine.', love: 'In love, you bring warmth and attentiveness. You need connection that allows you to adapt and bloom without being taken for granted.', growth: 'Your growth comes when you honor your sensitivity as strength and choose environments that nurture rather than drain you.', thrive: 'Wood and Water support you; seek gentle light and steady soil.' },
    { shortName: 'Radiant', essence: 'You are here to light the way — for yourself and for others. Your presence is warmth and visibility; when you show up fully, people feel it.', work: 'In work, you shine in roles that put you in front of others — leading, presenting, or inspiring. You are built for impact when the stage fits.', love: 'In love, you give warmth and loyalty. You need a partner who sees your light and doesn\'t ask you to dim it.', growth: 'Your growth happens when you balance visibility with rest, and when you use your fire to warm rather than burn.', thrive: 'Wood and Fire support you; seek spaces where your energy can radiate.' },
    { shortName: 'Luminary', essence: 'You see what others miss — the detail, the mood, the truth beneath the surface. Your light is subtle but essential; you illuminate the inner world.', work: 'In work, you excel in roles that value insight, care, or precision — research, healing, arts, or strategy. You thrive when your depth is recognized.', love: 'In love, you offer intimacy and understanding. You need a partner who values depth and gives you space to recharge.', growth: 'Your growth comes when you protect your sensitivity and choose people and places that honor your need for meaning.', thrive: 'Wood and Fire in balance support you; seek both warmth and calm.' },
    { shortName: 'Mountain', essence: 'You are the one others lean on — steady, reliable, unmoved by chaos. Your gift is to hold the ground so others can build.', work: 'In work, you shine in roles that require dependability and structure — operations, management, or any place that needs a steady hand.', love: 'In love, you offer loyalty and stability. You need a partner who values your constancy and doesn\'t mistake it for rigidity.', growth: 'Your growth happens when you allow yourself to rest and receive, not only to hold.', thrive: 'Fire and Earth support you; seek warmth and solid ground.' },
    { shortName: 'Garden', essence: 'You are the one who helps things grow — through nurture, patience, and receptivity. You transform what you touch without needing to dominate.', work: 'In work, you excel where cultivation matters — teaching, healing, design, or any role that improves people or systems over time.', love: 'In love, you bring nurturing and attentiveness. You need a partner who appreciates your depth and gives you room to recharge.', growth: 'Your growth comes when you set boundaries so your giving doesn\'t deplete you.', thrive: 'Fire and Earth support you; seek fertile ground and gentle warmth.' },
    { shortName: 'Blade', essence: 'You are built to cut through noise — to decide, reform, and clarify. Your edge is not harshness; it is the precision that creates order.', work: 'In work, you thrive in roles that reward decisiveness and standards — law, finance, engineering, or leadership that demands clarity.', love: 'In love, you offer loyalty and directness. You need a partner who can handle truth and who values your no-nonsense devotion.', growth: 'Your growth happens when you balance cutting away with choosing what to keep — and when you soften the blade for those closest to you.', thrive: 'Earth and Metal support you; seek order and quality.' },
    { shortName: 'Jewel', essence: 'You are built for depth and quality — you notice what is precious and you protect it. Your sensitivity is your radar for what matters.', work: 'In work, you excel where refinement and standards matter — arts, craft, analysis, or roles that reward precision and taste.', love: 'In love, you offer depth and devotion. You need a partner who values nuance and who doesn\'t mistake your sensitivity for weakness.', growth: 'Your growth comes when you honor your need for beauty and boundaries, and when you let others in without losing your polish.', thrive: 'Earth and Metal support you; seek clarity and care.' },
    { shortName: 'Ocean', essence: 'You are built to flow and persist — to adapt without losing direction. Your power is in movement and depth; you don\'t need to be loud to be unstoppable.', work: 'In work, you thrive in roles that allow movement and impact — strategy, influence, or fields that reward adaptability and reach.', love: 'In love, you offer depth and loyalty. You need a partner who can go deep with you and who doesn\'t need you to be constantly on.', growth: 'Your growth happens when you channel your flow into clear channels and when you rest in stillness as much as in motion.', thrive: 'Metal and Water support you; seek both structure and flow.' },
    { shortName: 'Mist', essence: 'You absorb and reflect the world with rare clarity — your stillness is not passivity but perception. You see what is hidden in the depths.', work: 'In work, you excel in roles that value insight and subtlety — research, psychology, arts, or strategy. You thrive when your depth is given space and time.', love: 'In love, you offer understanding and emotional depth. You need a partner who values quiet connection and doesn\'t drain your reserves.', growth: 'Your growth comes when you protect your need for solitude and choose relationships that replenish you.', thrive: 'Metal and Water support you; seek clarity and quiet depth.' }
  ];

  const WESTERN_SIGNS = [
    { start: [12, 22], end: [1, 19], name: 'Capricorn' }, { start: [1, 20], end: [2, 18], name: 'Aquarius' },
    { start: [2, 19], end: [3, 20], name: 'Pisces' }, { start: [3, 21], end: [4, 19], name: 'Aries' },
    { start: [4, 20], end: [5, 20], name: 'Taurus' }, { start: [5, 21], end: [6, 20], name: 'Gemini' },
    { start: [6, 21], end: [7, 22], name: 'Cancer' }, { start: [7, 23], end: [8, 22], name: 'Leo' },
    { start: [8, 23], end: [9, 22], name: 'Virgo' }, { start: [9, 23], end: [10, 22], name: 'Libra' },
    { start: [10, 23], end: [11, 21], name: 'Scorpio' }, { start: [11, 22], end: [12, 21], name: 'Sagittarius' }
  ];
  function getWesternZodiacSign(birthDateStr) {
    if (!birthDateStr) return '—';
    const [y, m, d] = birthDateStr.split('-').map(Number);
    if (!m || !d) return '—';
    const dVal = m * 100 + d;
    for (const sign of WESTERN_SIGNS) {
      const s = sign.start[0] * 100 + sign.start[1];
      const e = sign.end[0] * 100 + sign.end[1];
      if (sign.start[0] > sign.end[0]) { if (dVal >= s || dVal <= e) return sign.name; }
      else { if (dVal >= s && dVal <= e) return sign.name; }
    }
    return 'Capricorn';
  }

  // Fallback classical quotes when content/classical-bazi-excerpts.js is not loaded (guarantee quote block is never empty).
  var FALLBACK_CLASSICAL_BAZI = [
    { text: 'Yang Wood reaches for heaven; it needs fire to flourish. When earth is moist and heaven in harmony, it stands for a thousand ages.', source: '《滴天髓》', sourceEn: 'Ditian Sui' },
    { text: 'Yin Wood is gentle yet can cut through difficulty. With Fire\'s warmth it crosses boundaries and climbs.', source: '《滴天髓》', sourceEn: 'Ditian Sui' },
    { text: 'Yang Fire is fierce; it defies frost and snow. It tempers Metal but meets Yin Metal with care.', source: '《滴天髓》', sourceEn: 'Ditian Sui' },
    { text: 'Yin Fire is gentle within and bright without. It nourishes Wood and joins Water in balance.', source: '《滴天髓》', sourceEn: 'Ditian Sui' },
    { text: 'Yang Earth is solid and central, still when closed and active when open; it governs the fate of the ten thousand things.', source: '《滴天髓》', sourceEn: 'Ditian Sui' },
    { text: 'Yin Earth is humble and moist, storing and nurturing. It does not fear strong Wood nor rushing Water.', source: '《滴天髓》', sourceEn: 'Ditian Sui' },
    { text: 'Yang Metal carries edge; it is firm and strong. With Water it clarifies; with Fire it sharpens.', source: '《滴天髓》', sourceEn: 'Ditian Sui' },
    { text: 'Yin Metal is soft, warm and clear. It fears too much Earth and delights in full Water.', source: '《滴天髓》', sourceEn: 'Ditian Sui' },
    { text: 'Yang Water runs like a river and can release Metal. Its virtue is strength at the center, flowing without stagnation.', source: '《滴天髓》', sourceEn: 'Ditian Sui' },
    { text: 'Yin Water is most yielding yet reaches the heavenly ford. With dragon\'s virtue it moves; its transforming power is divine.', source: '《滴天髓》', sourceEn: 'Ditian Sui' }
  ];

  // ─── State ───────────────────────────────────────────────────────────
  const SOULMAP_SESSION_KEY = 'soulmap_session';
  let state = {
    birthDate: '',
    shichen: 0,
    gender: 'male',
    occupation: '',
    relationship: '',
    currentConcern: '',
    chart: null,
    soulTypeIndex: 0,
    streak: 0,
    narrativeFromAPI: null  // Part B schema: { coreEssence, classicalQuote, classicalSource?, work, love, growth }. If set, UI uses this instead of static BLUEPRINT_NARRATIVE. Never use theme/challenge/strength.
  };

  function getState() { return state; }
  function setState(partial) { state = { ...state, ...partial }; }

  function saveSession() {
    try {
      if (!state.birthDate) return;
      var payload = {
        birthDate: state.birthDate,
        shichen: state.shichen,
        gender: state.gender,
        occupation: state.occupation || '',
        relationship: state.relationship || '',
        currentConcern: state.currentConcern || ''
      };
      localStorage.setItem(SOULMAP_SESSION_KEY, JSON.stringify(payload));
    } catch (_) {}
  }

  function restoreSession() {
    try {
      var raw = localStorage.getItem(SOULMAP_SESSION_KEY);
      if (!raw) return false;
      var payload = JSON.parse(raw);
      if (!payload.birthDate) return false;
      var chart = calculateBaZi(payload.birthDate, payload.shichen);
      setState({
        birthDate: payload.birthDate,
        shichen: payload.shichen,
        gender: payload.gender || 'male',
        occupation: payload.occupation || '',
        relationship: payload.relationship || '',
        currentConcern: payload.currentConcern || '',
        chart: chart,
        soulTypeIndex: chart.dayMaster
      });
      return true;
    } catch (_) { return false; }
  }

  // ─── Julian Day Number (for day pillar) ───────────────────────────────
  function jdn(y, m, d) {
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  // ─── BaZi calculation (simplified MVP) ─────────────────────────────────
  function calculateBaZi(birthDateStr, shichenIndex) {
    const [y, m, d] = birthDateStr.split('-').map(Number);
    const dayJdn = jdn(y, m, d);
    const dayPillarIndex = (dayJdn + 58) % 60;
    const dayStem = dayPillarIndex % 10;
    const dayBranch = dayPillarIndex % 12;

    const hourBranch = parseInt(shichenIndex, 10) % 12;
    const ziStem = [0, 2, 4, 6, 8][dayStem % 5];
    const hourStem = (ziStem + hourBranch) % 10;

    const beforeLiChun = m < 2 || (m === 2 && d < 5);
    const yearForPillar = beforeLiChun ? y - 1 : y;
    const yearPillarIndex = (yearForPillar - 1984) % 60;
    if (yearPillarIndex < 0) yearPillarIndex += 60;
    const yearStem = yearPillarIndex % 10;
    const yearBranch = yearPillarIndex % 12;

    const monthBranch = m === 1 ? 1 : (m + 1) % 12;
    const yinYueStem = [2, 4, 6, 8, 0][yearStem % 5];
    const monthStem = (yinYueStem + monthBranch - 2 + 20) % 10;

    const elementCounts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    [yearStem, monthStem, dayStem, hourStem].forEach(s => {
      const el = ['wood', 'fire', 'earth', 'metal', 'water'][STEM_ELEMENT[s]];
      elementCounts[el]++;
    });
    [yearBranch, monthBranch, dayBranch, hourBranch].forEach(b => {
      const branchEl = [0, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4][b];
      const el = ['wood', 'fire', 'earth', 'metal', 'water'][branchEl];
      elementCounts[el]++;
    });

    const total = Object.values(elementCounts).reduce((a, b) => a + b, 0);
    const balance = {};
    Object.keys(elementCounts).forEach(k => { balance[k] = total ? Math.round((elementCounts[k] / total) * 100) : 0; });

    return {
      yearPillar: { stem: yearStem, branch: yearBranch },
      monthPillar: { stem: monthStem, branch: monthBranch },
      dayPillar: { stem: dayStem, branch: dayBranch },
      hourPillar: { stem: hourStem, branch: hourBranch },
      dayMaster: dayStem,
      elementBalance: balance,
      pillarsStr: `${STEMS[yearStem]}${BRANCHES[yearBranch]} ${STEMS[monthStem]}${BRANCHES[monthBranch]} ${STEMS[dayStem]}${BRANCHES[dayBranch]} ${STEMS[hourStem]}${BRANCHES[hourBranch]}`
    };
  }

  // ─── Views ────────────────────────────────────────────────────────────
  function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('view-active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('view-active');
  }

  function initLanding() {
    document.getElementById('btn-start').addEventListener('click', () => showView('view-onboard-birth'));
  }

  function initOnboardBirth() {
    document.getElementById('btn-back-landing').addEventListener('click', () => showView('view-landing'));
    document.getElementById('form-birth').addEventListener('submit', function (e) {
      e.preventDefault();
      const fd = new FormData(this);
      setState({
        birthDate: fd.get('birthDate'),
        shichen: fd.get('shichen'),
        gender: fd.get('gender')
      });
      showView('view-onboard-life');
    });
  }

  function initOnboardLife() {
    document.getElementById('btn-back-birth').addEventListener('click', () => showView('view-onboard-birth'));
    document.getElementById('form-life').addEventListener('submit', function (e) {
      e.preventDefault();
      const fd = new FormData(this);
      setState({
        occupation: fd.get('occupation') || '',
        relationship: fd.get('relationship') || '',
        currentConcern: (fd.get('currentConcern') || '').trim()
      });
      runGeneration();
    });
  }

  function runGeneration() {
    showView('view-generating');
    const particles = document.getElementById('particles');
    particles.innerHTML = '';
    const colors = [ELEMENT_COLORS.wood, ELEMENT_COLORS.fire, ELEMENT_COLORS.water, ELEMENT_COLORS.metal];
    for (let i = 0; i < 24; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 2 + 's';
      particles.appendChild(p);
    }
    const lines = ['gen-line-1', 'gen-line-2', 'gen-line-3'];
    lines.forEach((id, i) => {
      setTimeout(() => document.getElementById(id).classList.add('visible'), (i + 1) * 1200);
    });
    setTimeout(() => {
      const chart = calculateBaZi(state.birthDate, state.shichen);
      const soulTypeIndex = chart.dayMaster;
      setState({ chart, soulTypeIndex });
      saveSession();
      renderBlueprintReveal();
      showView('view-blueprint-reveal');
    }, 4200);
  }

  function getDayMasterStrength() {
    const balance = state.chart.elementBalance;
    const dayEl = ['wood', 'fire', 'earth', 'metal', 'water'][STEM_ELEMENT[state.chart.dayPillar.stem]];
    const pct = balance[dayEl] || 0;
    if (pct <= 15) return 'Weak';
    if (pct >= 30) return 'Strong';
    return 'Moderate';
  }

  function renderBlueprintReveal() {
    const t = SOUL_TYPES[state.soulTypeIndex];
    const balance = state.chart.elementBalance;
    document.getElementById('blueprint-type-name').textContent = t.name;
    document.getElementById('blueprint-type-sub').textContent = t.sub;
    document.getElementById('blueprint-tagline').textContent = t.tagline;
    document.getElementById('blueprint-visual').textContent = t.emoji;
    const seasonName = SEASON_NAMES[STEM_ELEMENT[state.chart.monthPillar.stem]] || '—';
    const zodiacName = getWesternZodiacSign(state.birthDate);
    document.getElementById('blueprint-destiny-structure').textContent = 'Strength: ' + getDayMasterStrength();
    document.getElementById('blueprint-favorable-elements').textContent = seasonName;
    document.getElementById('blueprint-zodiac').textContent = zodiacName;
    const barsEl = document.getElementById('elements-bars');
    barsEl.innerHTML = Object.entries(balance).map(([k, v]) =>
      `<div class="element-row"><span>${ELEMENT_NAMES[k]} </span><div class="bar"><div class="fill" style="width:${v}%;background:${ELEMENT_COLORS[k]}"></div></div><span>${v}%</span></div>`
    ).join('');
    renderAppBlueprint();
  }

  function initBlueprintReveal() {
    document.getElementById('btn-enter-app').addEventListener('click', () => {
      renderAppBlueprint();
      document.getElementById('app-user-type').textContent = SOUL_TYPES[state.soulTypeIndex].name;
      showView('view-app');
    });
    var btnRefresh = document.getElementById('btn-refresh-narrative');
    if (btnRefresh) btnRefresh.addEventListener('click', function () { renderAppBlueprint(); });
    document.getElementById('btn-share-blueprint').addEventListener('click', () => {
      const t = SOUL_TYPES[state.soulTypeIndex];
      const text = `${t.name} — ${t.sub}\n${t.tagline}\n\nSoulMap — soulmap.app`;
      if (navigator.share) {
        navigator.share({ title: 'My Soul Blueprint', text }).catch(() => copyShareText(text));
      } else {
        copyShareText(text);
      }
    });
  }

  function copyShareText(text) {
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard. Share it anywhere!'));
  }

  function getNarrativeLens() {
    var c = (state.currentConcern || '').toLowerCase();
    var o = (state.occupation || '').toLowerCase();
    var r = (state.relationship || '').toLowerCase();
    if (/\b(career|job|work|business|promotion|career change|switching job)\b/.test(c)) return 'work';
    if (/\b(relationship|love|partner|dating|marriage|family|breakup)\b/.test(c)) return 'love';
    if (o && o !== 'other') return 'work';
    if (r && r !== 'prefer-not' && r !== '') return 'love';
    return 'growth';
  }

  function setEl(id, text) {
    var el = document.getElementById(id);
    if (el && text != null) el.textContent = text;
  }

  function renderAppBlueprint() {
    if (!state.chart) return;
    var t = SOUL_TYPES[state.soulTypeIndex];
    var n = (typeof BLUEPRINT_NARRATIVE !== 'undefined' && BLUEPRINT_NARRATIVE[state.soulTypeIndex]) || null;
    var balance = state.chart.elementBalance;
    var seasonName = SEASON_NAMES[STEM_ELEMENT[state.chart.monthPillar.stem]] || '—';
    var zodiacName = getWesternZodiacSign(state.birthDate);

    setEl('blueprint-detail-visual', t.emoji);
    setEl('detail-type-name', t.name);
    setEl('detail-type-sub', t.sub);
    setEl('detail-tagline', t.tagline);
    setEl('detail-destiny-structure', 'Strength: ' + getDayMasterStrength());
    setEl('detail-favorable-elements', seasonName);
    setEl('detail-zodiac', zodiacName);
    var barsEl = document.getElementById('detail-elements-bars');
    if (barsEl) barsEl.innerHTML = Object.entries(balance).map(function (entry) {
      var k = entry[0], v = entry[1];
      return '<div class="element-row"><span>' + ELEMENT_NAMES[k] + ' </span><div class="bar"><div class="fill" style="width:' + v + '%;background:' + ELEMENT_COLORS[k] + '"></div></div><span>' + v + '%</span></div>';
    }).join('');

    // Part B: only core essence, From the classics (quote + source), Work/Love/Growth. Never display theme, challenge, or strength.
    var apiNarrative = state.narrativeFromAPI && state.narrativeFromAPI.coreEssence && state.narrativeFromAPI.work;
    if (apiNarrative) {
      var na = state.narrativeFromAPI;
      setEl('detail-core-essence', na.coreEssence);
      setEl('detail-work', na.work);
      setEl('detail-love', na.love);
      setEl('detail-growth', na.growth);
      setEl('detail-classical-text', na.classicalQuote || '—');
      setEl('detail-classical-source', (na.classicalSource || '').trim() || '—');
      var block = document.getElementById('blockquote-classical');
      if (block) block.style.display = (na.classicalQuote && na.classicalQuote !== '—') ? '' : 'none';
    } else if (n) {
      var coreEssence = 'Your core essence is ' + (n.shortName || t.name.replace(/^The /, '')) + ' — ' + n.essence + ' Born during ' + seasonName.toLowerCase() + ', you carry the energy of that season. Your chart is supported when you invest in environments and relationships that align with what you care about: work, love, and growth.';
      setEl('detail-core-essence', coreEssence);
      setEl('detail-work', n.work);
      setEl('detail-love', n.love);
      setEl('detail-growth', n.growth);
      var classical = (typeof window !== 'undefined' && window.CLASSICAL_BAZI_EXCERPTS && window.CLASSICAL_BAZI_EXCERPTS[state.soulTypeIndex]) || FALLBACK_CLASSICAL_BAZI[state.soulTypeIndex];
      if (classical) {
        setEl('detail-classical-text', classical.text);
        setEl('detail-classical-source', classical.source + ' ' + (classical.sourceEn || ''));
      }
      var block = document.getElementById('blockquote-classical');
      if (block) block.style.display = state.chart ? '' : 'none';
    }

    var concernSection = document.getElementById('section-concern');
    var concernEl = document.getElementById('detail-concern');
    if (state.currentConcern && concernSection && concernEl && n) {
      var concernIntro = 'You shared that ' + (state.currentConcern.length > 120 ? state.currentConcern.slice(0, 117) + '...' : state.currentConcern) + '. ';
      var concernTie = 'Your ' + t.element + ' nature is supported when you lean into what your chart favors: ' + seasonName + '. Trust your instincts as you move through this.';
      concernEl.textContent = concernIntro + concernTie;
      concernSection.hidden = false;
    } else if (concernSection) {
      concernSection.hidden = true;
    }

    if (n && !document.getElementById('detail-core-essence')) {
      setEl('detail-who-you-are', n.essence + ' Work: ' + n.work + ' Love: ' + n.love + ' Growth: ' + n.growth);
      setEl('detail-favorable', n.thrive);
    }
  }

  // ─── Tabs ────────────────────────────────────────────────────────────
  function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('tab-active'));
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.removeAttribute('aria-current'); });
    const pane = document.getElementById('tab-' + tabId);
    const btn = document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
    if (pane) pane.classList.add('tab-active');
    if (btn) { btn.classList.add('active'); btn.setAttribute('aria-current', 'page'); }
    if (tabId === 'blueprint' && state.chart) renderAppBlueprint();
  }

  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });
  }

  // ─── Oracle (placeholder) ─────────────────────────────────────────────
  function initOracle() {
    const form = document.getElementById('oracle-form');
    const input = document.getElementById('oracle-input');
    const messages = document.getElementById('oracle-messages');
    const placeholder = document.getElementById('oracle-placeholder');

    document.querySelectorAll('.oracle-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.getAttribute('data-q');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      placeholder.style.display = 'none';
      const userMsg = document.createElement('div');
      userMsg.className = 'msg user';
      userMsg.textContent = q;
      messages.appendChild(userMsg);
      input.value = '';

      const reply = document.createElement('div');
      reply.className = 'msg assistant';
      const chartNote = 'In the full app, the Life Oracle (powered by an AI like Claude) would answer using your BaZi chart and classical wisdom. Your chart: ' + (state.chart ? state.chart.pillarsStr : '—') + '. ';
      const vault = getWisdomVault();
      const cite = vault[Math.floor(Math.random() * vault.length)];
      const citeLine = "As " + cite.author + " wrote in " + cite.source + ": “" + cite.text + "”";
      reply.textContent = chartNote + "This is a static demo. To close, a word from the Wisdom Vault: " + citeLine;
      messages.appendChild(reply);
      var parsed = parseCitationFromMessage(reply.textContent);
      if (parsed) addCitationToVault(parsed);
    });
  }

  // ─── Wisdom Vault (Sacred Library) ───────────────────────────────────────
  // Base from content/wisdom-vault.js; Oracle citations auto-added and categorized in localStorage.
  const WISDOM_VAULT_BASE = (typeof window !== 'undefined' && window.WISDOM_VAULT) || [
    { tradition: 'daoism', source: 'Tao Te Ching', author: 'Lao Tzu', text: 'The highest good is like water. Water benefits the ten thousand things but does not compete.' },
    { tradition: 'stoicism', source: 'Meditations', author: 'Marcus Aurelius', text: 'You have power over your mind — not outside events. Realize this, and you will find strength.' },
    { tradition: 'buddhism', source: 'Dhammapada', author: 'Buddha', text: 'All experience is preceded by mind, led by mind, made by mind.' }
  ];
  const WISDOM_VAULT_STORAGE_KEY = 'soulmap_wisdom_vault_additions';

  function getStoredAdditions() {
    try {
      const raw = localStorage.getItem(WISDOM_VAULT_STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }

  function saveAdditions(arr) {
    try { localStorage.setItem(WISDOM_VAULT_STORAGE_KEY, JSON.stringify(arr)); } catch (_) {}
  }

  function getWisdomVault() {
    return WISDOM_VAULT_BASE.concat(getStoredAdditions());
  }

  function normalizeText(t) {
    return String(t).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function isInVault(vault, citation) {
    var n = normalizeText(citation.text);
    return vault.some(function (e) { return normalizeText(e.text) === n; });
  }

  function categorizeCitation(citation) {
    var s = (citation.source || '').toLowerCase();
    var a = (citation.author || '').toLowerCase();
    var combined = s + ' ' + a;
    if (/\b(tao te ching|lao tzu|zhuangzi|dao)\b/.test(combined)) return 'daoism';
    if (/\b(analects|confucius)\b/.test(combined)) return 'confucianism';
    if (/\b(dhammapada|heart sutra|buddha|sutra)\b/.test(combined)) return 'buddhism';
    if (/\b(i ching|yijing)\b/.test(combined)) return 'chinese';
    if (/\b(meditations|marcus aurelius|seneca|epictetus|letters to lucilius|enchiridion|discourses|stoic)\b/.test(combined)) return 'stoicism';
    if (/\b(plato|aristotle|heracritus|republic|ethics|apology|greek)\b/.test(combined)) return 'greek';
    if (/\b(rumi|masnavi|sufi)\b/.test(combined)) return 'sufi';
    if (/\b(bhagavad gita|veda|vedic)\b/.test(combined)) return 'vedic';
    return 'uncategorized';
  }

  function addCitationToVault(citation) {
    if (!citation || !citation.text) return false;
    var vault = getWisdomVault();
    if (isInVault(vault, citation)) return false;
    var tradition = citation.tradition || categorizeCitation(citation);
    var entry = { tradition: tradition, source: (citation.source || 'Unknown').trim(), author: (citation.author || 'Unknown').trim(), text: citation.text.trim() };
    var additions = getStoredAdditions();
    additions.push(entry);
    saveAdditions(additions);
    var list = document.getElementById('library-list');
    if (list) renderLibrary(document.querySelector('.library-tab.active') ? document.querySelector('.library-tab.active').getAttribute('data-tradition') : 'all');
    return true;
  }

  function parseCitationFromMessage(messageText) {
    if (!messageText || typeof messageText !== 'string') return null;
    var patterns = [
      /As\s+([^ wrote]+?)\s+wrote\s+in\s+([^:]+?):\s*[\u201C\u201D"]([^"\u201C\u201D]+)[\u201C\u201D"]/i,
      /As\s+([^ said]+?)\s+said\s+(?:in\s+)?([^:]+?):\s*[\u201C\u201D"]([^"\u201C\u201D]+)[\u201C\u201D"]/i
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = messageText.match(patterns[i]);
      if (m && m[3] && m[3].length > 10) return { author: (m[1] || '').trim(), source: (m[2] || '').trim(), text: (m[3] || '').trim() };
    }
    return null;
  }

  function renderLibrary(filter) {
    const list = document.getElementById('library-list');
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

  // ─── Daily Spark ───────────────────────────────────────────────────────
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

  function getSparkForToday() {
    const today = new Date().toDateString();
    const seed = new Date().getDate() + new Date().getMonth() * 31;
    const vault = getWisdomVault();
    const q = vault[seed % vault.length];
    return {
      date: today,
      text: { title: q.source + (q.author ? ' — ' + q.author : ''), text: q.text },
      prompt: SPARK_PROMPTS[seed % SPARK_PROMPTS.length],
      practice: SPARK_PRACTICES[seed % SPARK_PRACTICES.length]
    };
  }

  function initSpark() {
    const spark = getSparkForToday();
    document.getElementById('spark-date').textContent = spark.date;
    document.getElementById('spark-text').innerHTML = `<strong>${spark.text.title}</strong><p>${spark.text.text}</p>`;
    document.getElementById('spark-prompt').textContent = spark.prompt;
    document.getElementById('spark-practice').textContent = spark.practice;
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

  // ─── Still Point (meditations) ──────────────────────────────────────────
  const MEDITATIONS = [
    { icon: '🪵', title: 'Wood — Growth & Vision', desc: 'Visualization of roots and rising energy. 5–10 min.' },
    { icon: '🔥', title: 'Fire — Warmth & Connection', desc: 'Heart-centered warmth. For when you feel disconnected.' },
    { icon: '🗿', title: 'Earth — Grounding', desc: 'Body scan and earth connection. For anxiety.' },
    { icon: '🪙', title: 'Metal — Release & Clarity', desc: 'Breath-focused, letting go. For clutter or indecision.' },
    { icon: '💧', title: 'Water — Flow & Surrender', desc: 'Fluid movement visualization. For when you feel stuck.' },
    { icon: '◎', title: 'Before a Big Decision', desc: 'Grounding + clarity. 10 min.' }
  ];

  function initStillPoint() {
    document.getElementById('meditation-list').innerHTML = MEDITATIONS.map(m =>
      `<div class="meditation-item"><span class="icon">${m.icon}</span><div><div class="title">${m.title}</div><p class="desc">${m.desc}</p></div></div>`
    ).join('');
  }

  // ─── Init ─────────────────────────────────────────────────────────────
  function init() {
    initLanding();
    initOnboardBirth();
    initOnboardLife();
    initBlueprintReveal();
    initTabs();
    initOracle();
    initLibrary();
    initSpark();
    initStillPoint();
    if (restoreSession()) {
      document.getElementById('app-user-type').textContent = SOUL_TYPES[state.soulTypeIndex].name;
      showView('view-app');
      switchTab('blueprint');
      renderAppBlueprint();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
