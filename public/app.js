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
    wood:'#3A7A4A', fire:'#C45A3A', earth:'#8A6A3A', metal:'#C9A840', water:'#4A7090'
  };
  const STEM_ELEMENT = [0,0,1,1,2,2,3,3,4,4]; // 0=wood 1=fire 2=earth 3=metal 4=water

  // ─── Haptic feedback helper ───────────────────────────────────────
  function haptic(style) {
    if (!navigator.vibrate) return;   // silent no-op on iOS Safari
    navigator.vibrate(style === 'medium' ? 15 : style === 'heavy' ? 25 : 8);
  }

  // ─── Analytics helper ────────────────────────────────────────────
  function trackEvent(name, props) {
    try {
      if (typeof window.va === 'function') window.va('event', { name, ...props });
    } catch (_) {}
  }

  // ─── Internationalisation (i18n) ─────────────────────────────────
  const I18N = {
    en: {
      // Landing
      landing_hl_top:        'ACT ON YOUR',
      landing_hl_accent:     'Destiny',
      landing_tagline:       'Ancient Wisdom Meets Modern Navigation',
      landing_stat1_label:   'years of ancient wisdom',
      landing_stat2_label:   'unique life patterns',
      landing_sub:           "From the oldest astronomical tradition on earth \u2014 it doesn\u2019t predict the future. It maps the terrain, so you know when to climb and when to rest.",
      landing_cta:           'See My Blueprint',
      // Onboarding
      onboard_step1_title:   'Your Birth Chart',
      onboard_step2_title:   'Your Life Context',
      onboard_step1_desc:    'BaZi is anchored to your exact solar birth timestamp \u2014 precise enough to map your life in decade-long phases.',
      onboard_step2_desc:    'A few more details help the AI speak to where you actually are right now.',
      onboard_back_label:    'Back',
      onboard_name_label:    'Name',
      onboard_name_ph:       'e.g. Max, Mom, Sarah\u2026',
      onboard_dob_label:     'Date of Birth',
      onboard_time_label:    'Time of Birth',
      onboard_time_hint:     'Not sure? Pick the closest.',
      onboard_time_ph:       'Select time of birth',
      onboard_gender_label:  'Gender at Birth',
      onboard_gender_hint:   'Used for Luck Pillar direction.',
      onboard_gender_ph:     'Select',
      onboard_gender_male:   'Male',
      onboard_gender_female: 'Female',
      onboard_occ_label:     'Occupation',
      onboard_occ_ph:        'Select',
      onboard_occ_student:   'Student',
      onboard_occ_pro:       'Professional',
      onboard_occ_creative:  'Creative',
      onboard_occ_entre:     'Entrepreneur',
      onboard_occ_between:   'Between Things',
      onboard_occ_other:     'Other',
      onboard_rel_label:     'Relationship Status',
      onboard_rel_ph:        'Select',
      onboard_rel_single:    'Single',
      onboard_rel_dating:    'Dating',
      onboard_rel_in:        'In a Relationship',
      onboard_rel_married:   'Married',
      onboard_rel_comp:      "It\u2019s Complicated",
      onboard_rel_prefer:    'Prefer Not to Say',
      onboard_concern_label: "What\u2019s on your mind?",
      onboard_concern_opt:   'Optional',
      onboard_concern_ph:    'e.g. Am I on the right path? Career, love, purpose\u2026',
      onboard_email_label:   'Email',
      onboard_email_opt:     'Optional',
      onboard_email_hint:    'Get updates and early access.',
      onboard_email_ph:      'you@example.com',
      onboard_btn_continue:  'Continue \u2192',
      onboard_btn_generate:  'Generate My Blueprint \u2192',
      // Tabs
      tab_blueprint: 'Blueprint', tab_oracle: 'Oracle',
      tab_vault: 'Wisdom Vault', tab_spark: 'Spark', tab_still: 'Still',
      // Blueprint
      bp_divider_narrative:  'Your Narrative',
      bp_divider_pillars:    '\u56db\u67f1 \u00b7 Four Pillars',
      bp_divider_annual:     '\u6d41\u5e74 \u00b7 This Year',
      bp_divider_seasons:    '\u5927\u8fd0 \u00b7 Life Seasons',
      bp_divider_energy:     'Energy per Season',
      bp_reading_card_label: 'CLICK ME \u00b7 518,400 unique persona patterns, FIND YOURS',
      bp_reveal_btn:         'CLICK ME \u00b7 \u2726 Reveal Your Life Journey \u203a',
      bp_reveal_hint:        'Life Seasons \u00b7 Lifetime Arc \u00b7 Energy Charts',
      // Oracle
      oracle_placeholder:        'Your chart is loaded. Tap a question above or ask your own \u2014 Claude will answer with your BaZi context.',
      oracle_leave_warning:      'Answers clear when you leave this tab \u2014 tap \ud83d\udd16 Save on any reply to keep it.',
      oracle_input_ph:           'Ask the Oracle\u2026',
      oracle_send_btn:           'Send',
      oracle_templates_header:   'Deep-Dive Readings',
      oracle_error:              'The Oracle is unavailable right now. Please try again in a moment.',
      // Vault
      vault_seg_foryou: '\u2726 For You', vault_seg_theme: 'Theme', vault_seg_tradition: 'Tradition',
      vault_save_btn: '\u2726 Save', vault_copy_btn: 'Copy', vault_copied: '\u2713 Copied',
      // Spark
      spark_streak:   '\u2726 {n} days of awareness',
      spark_title:    "Today\u2019s Spark",
      spark_done_btn: 'I reflected today',
      spark_done_complete: 'Done! See you tomorrow.',
      // Stillpoint
      stillpoint_intro: 'Guided meditations matched to your elemental balance. Choose by element or by need.',
      // Profile sheet
      profile_sheet_title: 'Switch Profile',
      profile_add_btn:     '+ Add new profile',
      profile_lang_btn:    'Language / \u8bed\u8a00',
      // Reading sheet
      reading_sheet_title:   'Your Reading',
      reading_generating:    'Generating your reading\u2026',
      reading_personalized:  '\u2726 Personalized for you',
      reading_reveal:        'Reveal your unique reading',
      reading_current_season: 'Your current season',
      reading_classics:       'From the classics',
      reading_means:          'What this means for you',
      reading_concern_title:  "What\u2019s on your mind",
      reading_refresh_btn:    'Refresh',
      // Generating view
      loading_for_name:  "Reading \u2018{name}\u2019s chart\u2026",
      loading_generic:   'Reading your chart\u2026',
      // Arrays
      LOADING_PHRASES: [
        'Let humans be humans.',
        'Your life terrain could be mapped.',
        'We are here with different missions. What\u2019s yours?',
        'The oldest astrology that ever existed.',
        'Finally someone actually knows you.',
        '518,400 unique persona patterns \u2014 not 12, not 16.',
        'Help you find your passion and strength.',
        'This is what clarity looks like.',
      ],
      SPLASH_PHRASES: [
        'Let humans be humans.',
        'Your life terrain could be mapped.',
        'We are here with different missions. What\u2019s yours?',
        'The oldest astrology that ever existed.',
        'Finally someone actually knows you.',
        '518,400 unique persona patterns \u2014 not 12, not 16.',
        'Help you find your passion and strength.',
        'This is what clarity looks like.',
      ],
      SPARK_PROMPTS: [
        'What are you holding onto that no longer serves you?',
        'Who made you feel seen today?',
        "What would you do if you weren\u2019t afraid?",
        'Where did you find a moment of peace today?',
        'What do you need to forgive yourself for?',
      ],
      SPARK_PRACTICES: [
        'Take 5 breaths: count to 4 on each inhale and exhale.',
        "Name 3 things you\u2019re grateful for \u2014 one for body, mind, and spirit.",
        'Notice 5 things you can see, 4 you can touch, 3 you can hear.',
      ],
      SOUL_TYPES: [
        { name: 'The Pioneer',  tagline: 'Tall tree \u2014 growth, ambition, upward drive. You build and lead with clarity.' },
        { name: 'The Weaver',   tagline: 'Vine and flower \u2014 flexible, graceful, adaptive. You connect and nurture.' },
        { name: 'The Radiant',  tagline: 'Sun \u2014 warmth, visibility, leadership. You light the way for others.' },
        { name: 'The Luminary', tagline: 'Candle and star \u2014 gentle light, insight, intimacy. You see what others miss.' },
        { name: 'The Mountain', tagline: 'Mountain \u2014 stability, reliability, immovable. You are the foundation.' },
        { name: 'The Garden',   tagline: 'Fertile soil \u2014 nurturing, receptive, transformative. You help things grow.' },
        { name: 'The Blade',    tagline: 'Sword \u2014 decisive, reforming, sharp. You cut through confusion.' },
        { name: 'The Jewel',    tagline: 'Gem \u2014 refined, precious, sensitive. You value quality and depth.' },
        { name: 'The Ocean',    tagline: 'Ocean \u2014 powerful, flowing, unstoppable. You adapt and persist.' },
        { name: 'The Mist',     tagline: 'Still water runs deep. You absorb everything, reflecting the world with quiet clarity.' },
      ],
      ANNUAL_INSIGHTS: {
        architect:  'The year rewards structure and formal moves. What you\u2019ve been building quietly is ready to be named.',
        harvest:    'Patient work begins paying. Relationships and effort that have been quietly compounding become visible.',
        windfall:   'The year carries an unconventional current \u2014 stay open to what arrives through unexpected doors.',
        challenger: 'Friction this year is formative, not punitive. What resists you is clarifying what you\u2019re actually made of.',
        muse:       'Creative and expressive work has real traction right now. Make things.',
        maverick:   'A year for questioning what no longer fits. Don\u2019t defend structures out of habit.',
        guardian:   'Support arrives this year. Lean on people who have been watching you \u2014 they want to help.',
        mystic:     'A quiet year, but a deep one. Insight arrives in stillness. Protect your inner space.',
        mirror:     'The people around you are unusually instructive this year. Choose your circle carefully.',
        shadow:     'This is a year for precision, not boldness. Measure twice before committing.',
        _default:   'A year of steady unfolding \u2014 tend to what matters most.',
      },
      ORACLE_TEMPLATES: [
        { icon: '\u26a1', title: 'What am I built for?',       desc: 'Work that fits your actual nature',        question: 'What kind of work environment, role, or path is most aligned with who I fundamentally am? What am I genuinely built for \u2014 and what tends to quietly drain me, even when it looks right on paper?' },
        { icon: '\u25ce', title: 'The relationship question',  desc: 'Patterns in love and close connection',    question: 'What are my real patterns in love and close relationships \u2014 what I need, what I tend to create, what I avoid or attract? Be honest with me about the recurring shape of things.' },
        { icon: '\u25c9', title: '{year} \u2014 the current', desc: 'What this year is asking from you',         question: 'What is {year} asking from me? Where is the current running, and where might I be swimming against it without knowing? What deserves the most of my attention and energy this year?' },
        { icon: '\u25d0', title: 'What I keep circling',       desc: 'The thing you haven\u2019t resolved yet',  question: 'There\u2019s something I keep returning to but haven\u2019t resolved. I want to understand what\u2019s actually underneath it \u2014 not just the surface version of the question. Help me see it more clearly.' },
        { icon: '\u2696', title: 'Is the timing right?',       desc: 'A significant move, and when to make it',  question: 'I\u2019m weighing something significant. I want to understand whether this is the right moment to move \u2014 or whether patience, preparation, or a different approach is the more intelligent choice right now.' },
        { icon: '\u2726', title: 'The long game',              desc: 'What this decade is actually building',    question: 'What am I actually building across this decade \u2014 not just the year? What deserves my deepest investment right now, and what would I regret not having started?' },
      ],
      THEME_LABELS: {
        healing: 'Healing & Renewal', courage: 'Courage & Strength', clarity: 'Clarity & Truth',
        love: 'Love & Belonging', purpose: 'Purpose & Calling', stillness: 'Stillness & Peace',
        resilience: 'Resilience & Endurance', change: 'Change & Letting Go',
      },
      VAULT_THEME_PILLS: [
        { value: 'healing', label: 'Healing' }, { value: 'courage', label: 'Courage' },
        { value: 'clarity', label: 'Clarity' }, { value: 'love', label: 'Love' },
        { value: 'purpose', label: 'Purpose' }, { value: 'stillness', label: 'Stillness' },
        { value: 'resilience', label: 'Resilience' }, { value: 'change', label: 'Change' },
      ],
      VAULT_TRADITION_PILLS: [
        { value: 'daoism', label: 'Daoism' }, { value: 'buddhism', label: 'Buddhism' },
        { value: 'stoicism', label: 'Stoicism' }, { value: 'christianity', label: 'Christianity' },
        { value: 'judaism', label: 'Judaism' }, { value: 'islam', label: 'Islam' },
        { value: 'confucianism', label: 'Confucianism' }, { value: 'sufi', label: 'Sufi' },
        { value: 'greek', label: 'Greek' }, { value: 'vedic', label: 'Vedic' },
        { value: 'chinese', label: 'I Ching' }, { value: 'saved', label: 'Saved' },
      ],
      MEDITATIONS: [
        { icon: '\ud83e\udeb5', title: 'Wood \u2014 Growth & Vision',     desc: 'Visualization of roots and rising energy. 5\u201310 min.' },
        { icon: '\ud83d\udd25', title: 'Fire \u2014 Warmth & Connection', desc: 'Heart-centered warmth. For when you feel disconnected.' },
        { icon: '\ud83d\uddff', title: 'Earth \u2014 Grounding',          desc: 'Body scan and earth connection. For anxiety.' },
        { icon: '\ud83e\ude99', title: 'Metal \u2014 Release & Clarity',  desc: 'Breath-focused, letting go. For clutter or indecision.' },
        { icon: '\ud83d\udca7', title: 'Water \u2014 Flow & Surrender',   desc: 'Fluid movement visualization. For when you feel stuck.' },
        { icon: '\u25ce',  title: 'Before a Big Decision',      desc: 'Grounding + clarity. 10 min.' },
      ],
      // Blueprint display strings
      dom_archetype_label:      'Dominant Archetype',
      decision_pattern_label:   'Your Decision Pattern',
      bp_strength_label:        'Strength',
      bp_show_details:          '\uff0b Show chart details',
      bp_hide_details:          '\uff0d Hide chart details',
      reading_preview_fallback: 'Tap to unlock your personalized reading \u2192',
      PILLAR_LABELS_EN:   ['Year', 'Month', 'Day', 'Hour'],
      ELEMENT_NAMES:      { wood: 'Wood', fire: 'Fire', earth: 'Earth', metal: 'Metal', water: 'Water' },
      TEN_GOD_EN:         ['Friend', 'Rob Wealth', 'Eating God', 'Hurt Officer', 'Ind. Wealth', 'Dir. Wealth', '7 Killings', 'Dir. Officer', 'Ind. Seal', 'Dir. Seal'],
      TEN_GOD_ARCHETYPE:  ['Mirror', 'Shadow', 'Muse', 'Maverick', 'Windfall', 'Harvest', 'Challenger', 'Architect', 'Mystic', 'Guardian'],
      TEN_GOD_BRIEF: [
        'You define yourself through peers \u2014 collaboration and competition are your forge.',
        "You take risks others won't \u2014 bold action is your edge and your blind spot.",
        'Creative output flows naturally from you \u2014 talent that looks effortless to others.',
        'You break patterns and challenge norms \u2014 innovation lives here, alongside friction.',
        'Windfall and unexpected opportunity seek you \u2014 wealth arrives through unconventional paths.',
        'You build wealth steadily through patience and relationship \u2014 trust compounds over time.',
        'Pressure and competition forge you \u2014 you become most powerful when challenged.',
        'You earn authority through structure \u2014 institutions and systems are your domain.',
        'Deep solitary wisdom is your gift \u2014 insight arrives in stillness and silence.',
        'You attract mentors and protection \u2014 others invest in you because they see your potential.',
      ],
      DECISION_LENS: [
        "You calibrate against what peers are doing — great at reading a room, sometimes slow to trust what others haven't validated. Watch for: delaying decisions until you've seen someone else make them first.",
        "You move fast and trust your instincts — the risk is underweighting what can't be undone. Watch for: framing caution as timidity when it's actually accurate.",
        "New possibilities feel more alive than current commitments — your mind generates better options under constraint. Watch for: surfacing alternatives at the exact moment of commitment.",
        "You spot what's wrong with the conventional option — a genuine asset, until searching becomes easier than deciding. Watch for: using critical thinking to defer rather than to decide.",
        "You're tuned for opportunity — you notice upside quickly and move toward it naturally. Watch for: decisions that look like expansion but are actually distraction.",
        "You have a long horizon and genuine patience — sometimes cultivation masks an overdue decision. Watch for: \"not the right time\" becoming a permanent posture.",
        "You sharpen through resistance — but not all friction is formative. Watch for: staying in something difficult because leaving feels like losing.",
        "You trust structure, process, and precedent — reliable and often right. Watch for: the decision you've made in practice but haven't made in form.",
        "You trust deep knowing over surface evidence — and it's often accurate. Watch for: \"I'm not ready\" as a cover for \"I don't want to choose.\"",
        "You decide well when supported — skilled at building conditions for good decisions. Watch for: over-consulting past the point where input substitutes for commitment.",
      ],
    },

    zh: {
      // Landing
      landing_hl_top:        '\u638c\u63e1\u4f60\u7684',
      landing_hl_accent:     '\u547d\u8fd0',
      landing_tagline:       '\u53e4\u8001\u667a\u6167\uff0c\u7167\u4eae\u5f53\u4e0b',
      landing_stat1_label:   '\u5e74\u7684\u53e4\u8001\u4f20\u627f',
      landing_stat2_label:   '\u79cd\u72ec\u7279\u547d\u8fd0\u683c\u5c40',
      landing_sub:           '\u6765\u81ea\u5730\u7403\u4e0a\u6700\u53e4\u8001\u7684\u661f\u8c61\u4f20\u7edf\u2014\u2014\u5b83\u4e0d\u9884\u6d4b\u672a\u6765\uff0c\u800c\u662f\u7ed8\u5236\u4eba\u751f\u5730\u5f62\uff0c\u8ba9\u4f60\u77e5\u9053\u4f55\u65f6\u6500\u767b\uff0c\u4f55\u65f6\u6b47\u606f\u3002',
      landing_cta:           '\u67e5\u770b\u6211\u7684\u547d\u76d8',
      // Onboarding
      onboard_step1_title:   '\u4f60\u7684\u547d\u76d8',
      onboard_step2_title:   '\u4f60\u7684\u4eba\u751f\u73b0\u72b6',
      onboard_step1_desc:    '\u516b\u5b57\u4ee5\u4f60\u51fa\u751f\u7684\u7cbe\u786e\u592a\u9633\u65f6\u523b\u4e3a\u57fa\u7840\u2014\u2014\u7cbe\u786e\u5230\u8db3\u4ee5\u7528\u5341\u5e74\u4e3a\u5355\u4f4d\u7ed8\u5236\u4f60\u7684\u4eba\u751f\u8f68\u8ff9\u3002',
      onboard_step2_desc:    '\u591a\u4e86\u89e3\u4e00\u4e9b\u4f60\u73b0\u5728\u7684\u72b6\u6001\uff0cAI\u624d\u80fd\u771f\u6b63\u4e0e\u4f60\u5f53\u4e0b\u6240\u5904\u7684\u4f4d\u7f6e\u5bf9\u8bdd\u3002',
      onboard_back_label:    '\u8fd4\u56de',
      onboard_name_label:    '\u59d3\u540d',
      onboard_name_ph:       '\u4f8b\u5982\uff1a\u5c0f\u660e\u3001\u5988\u5988\u3001Sarah\u2026',
      onboard_dob_label:     '\u51fa\u751f\u65e5\u671f',
      onboard_time_label:    '\u51fa\u751f\u65f6\u8fb0',
      onboard_time_hint:     '\u4e0d\u786e\u5b9a\uff1f\u9009\u6700\u63a5\u8fd1\u7684\u3002',
      onboard_time_ph:       '\u9009\u62e9\u51fa\u751f\u65f6\u8fb0',
      onboard_gender_label:  '\u51fa\u751f\u6027\u522b',
      onboard_gender_hint:   '\u7528\u4e8e\u786e\u5b9a\u5927\u8fd0\u987a\u9006\u65b9\u5411\u3002',
      onboard_gender_ph:     '\u8bf7\u9009\u62e9',
      onboard_gender_male:   '\u7537',
      onboard_gender_female: '\u5973',
      onboard_occ_label:     '\u804c\u4e1a',
      onboard_occ_ph:        '\u8bf7\u9009\u62e9',
      onboard_occ_student:   '\u5b66\u751f',
      onboard_occ_pro:       '\u804c\u573a\u4eba',
      onboard_occ_creative:  '\u521b\u610f\u4ece\u4e1a\u8005',
      onboard_occ_entre:     '\u521b\u4e1a\u8005',
      onboard_occ_between:   '\u8fc7\u6e21\u671f\u4e2d',
      onboard_occ_other:     '\u5176\u4ed6',
      onboard_rel_label:     '\u611f\u60c5\u72b6\u6001',
      onboard_rel_ph:        '\u8bf7\u9009\u62e9',
      onboard_rel_single:    '\u5355\u8eab',
      onboard_rel_dating:    '\u7ea6\u4f1a\u4e2d',
      onboard_rel_in:        '\u604b\u7231\u4e2d',
      onboard_rel_married:   '\u5df2\u5a5a',
      onboard_rel_comp:      '\u5173\u7cfb\u590d\u6742',
      onboard_rel_prefer:    '\u4e0d\u4fbf\u900f\u9732',
      onboard_concern_label: '\u6700\u8fd1\u5728\u60f3\u4ec0\u4e48\uff1f',
      onboard_concern_opt:   '\u9009\u586b',
      onboard_concern_ph:    '\u4f8b\u5982\uff1a\u6211\u8d70\u5728\u6b63\u786e\u7684\u8def\u4e0a\u5417\uff1f\u4e8b\u4e1a\u3001\u611f\u60c5\u3001\u4eba\u751f\u65b9\u5411\u2026',
      onboard_email_label:   '\u90ae\u7b71',
      onboard_email_opt:     '\u9009\u586b',
      onboard_email_hint:    '\u83b7\u53d6\u66f4\u65b0\u548c\u65e9\u671f\u4f53\u9a8c\u8d44\u683c\u3002',
      onboard_email_ph:      'you@example.com',
      onboard_btn_continue:  '\u7ee7\u7eed \u2192',
      onboard_btn_generate:  '\u751f\u6210\u6211\u7684\u547d\u76d8\u84dd\u56fe \u2192',
      // Tabs
      tab_blueprint: '\u547d\u76d8', tab_oracle: '\u5360\u95ee',
      tab_vault: '\u667a\u6167\u5b9d\u5e93', tab_spark: '\u65e5\u8bfe', tab_still: '\u9759\u5b9a',
      // Blueprint
      bp_divider_narrative:  '\u547d\u4e3b\u53d9\u4e8b',
      bp_divider_pillars:    '\u56db\u67f1 \u00b7 Four Pillars',
      bp_divider_annual:     '\u6d41\u5e74 \u00b7 This Year',
      bp_divider_seasons:    '\u5927\u8fd0 \u00b7 Life Seasons',
      bp_divider_energy:     '\u5404\u8fd0\u80fd\u91cf',
      bp_reading_card_label: '\u70b9\u6211 \u00b7 518,400 \u79cd\u72ec\u7279\u547d\u76d8\u683c\u5c40\uff0c\u627e\u5230\u4f60\u7684\u90a3\u4e00\u4e2a',
      bp_reveal_btn:         '\u70b9\u6211 \u00b7 \u2726 \u5c55\u5f00\u4f60\u7684\u4eba\u751f\u8f68\u8ff9 \u203a',
      bp_reveal_hint:        '\u5927\u8fd0 \u00b7 \u4eba\u751f\u5f27\u7ebf \u00b7 \u80fd\u91cf\u56fe',
      // Oracle
      oracle_placeholder:      '\u4f60\u7684\u547d\u76d8\u5df2\u52a0\u8f7d\u3002\u70b9\u51fb\u4e0a\u65b9\u95ee\u9898\uff0c\u6216\u81ea\u7531\u63d0\u95ee\u2014\u2014AI\u5c06\u7ed3\u5408\u4f60\u7684\u516b\u5b57\u4e3a\u4f60\u89e3\u7b54\u3002',
      oracle_leave_warning:    '\u79bb\u5f00\u6b64\u9875\u9762\u540e\uff0c\u5bf9\u8bdd\u5c06\u6e05\u7a7a\u2014\u2014\u70b9\u51fb\u56de\u590d\u4e0a\u7684 \ud83d\udd16 \u4fdd\u5b58 \u5373\u53ef\u7559\u5b58\u3002',
      oracle_input_ph:         '\u5411\u5360\u95ee\u5b98\u63d0\u95ee\u2026',
      oracle_send_btn:         '\u53d1\u9001',
      oracle_templates_header: '\u6df1\u5ea6\u89e3\u8bfb',
      oracle_error:            '\u5360\u95ee\u5b98\u6682\u65f6\u65e0\u6cd5\u56de\u5e94\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002',
      // Vault
      vault_seg_foryou: '\u2726 \u4e3a\u4f60\u7cbe\u9009', vault_seg_theme: '\u4e3b\u9898', vault_seg_tradition: '\u4f20\u7edf',
      vault_save_btn: '\u2726 \u6536\u85cf', vault_copy_btn: '\u590d\u5236', vault_copied: '\u2713 \u5df2\u590d\u5236',
      // Spark
      spark_streak:   '\u2726 \u5df2\u8fde\u7eed\u89c9\u77e5 {n} \u5929',
      spark_title:    '\u4eca\u65e5\u4e00\u8bfe',
      spark_done_btn: '\u4eca\u65e5\u5df2\u7701\u601d',
      spark_done_complete: '\u5f88\u597d\uff01\u660e\u5929\u89c1\u3002',
      // Stillpoint
      stillpoint_intro: '\u6839\u636e\u4f60\u7684\u4e94\u884c\u5e73\u8861\u5339\u914d\u7684\u5f15\u5bfc\u51a5\u60f3\uff0c\u6309\u5143\u7d20\u6216\u6309\u9700\u6c42\u9009\u62e9\u3002',
      // Profile sheet
      profile_sheet_title: '\u5207\u6362\u6863\u6848',
      profile_add_btn:     '+ \u6dfb\u52a0\u65b0\u6863\u6848',
      profile_lang_btn:    'Language / \u8bed\u8a00',
      // Reading sheet
      reading_sheet_title:    '\u4f60\u7684\u89e3\u8bfb',
      reading_generating:     '\u6b63\u5728\u751f\u6210\u4f60\u7684\u89e3\u8bfb\u2026',
      reading_personalized:   '\u2726 \u4e13\u5c5e\u4e8e\u4f60',
      reading_reveal:         '\u5c55\u5f00\u4f60\u7684\u4e13\u5c5e\u89e3\u8bfb',
      reading_current_season: '\u4f60\u5f53\u524d\u7684\u8fd0\u7a0b',
      reading_classics:       '\u53e4\u5178\u540d\u53e5',
      reading_means:          '\u8fd9\u5bf9\u4f60\u610f\u5473\u7740\u4ec0\u4e48',
      reading_concern_title:  '\u4f60\u5fc3\u4e2d\u6240\u60f3',
      reading_refresh_btn:    '\u91cd\u65b0\u751f\u6210',
      // Generating view
      loading_for_name: '\u6b63\u5728\u89e3\u8bfb\u300c{name}\u300d\u7684\u547d\u76d8\u2026',
      loading_generic:  '\u6b63\u5728\u89e3\u8bfb\u4f60\u7684\u547d\u76d8\u2026',
      // Arrays
      LOADING_PHRASES: [
        '\u8ba9\u4eba\u7c7b\u6210\u4e3a\u771f\u6b63\u7684\u81ea\u5df1\u3002',
        '\u4f60\u7684\u4eba\u751f\u5730\u5f62\uff0c\u53ef\u4ee5\u88ab\u7ed8\u5236\u3002',
        '\u6211\u4eec\u5404\u6709\u4f7f\u547d\u2014\u2014\u4f60\u7684\u662f\u4ec0\u4e48\uff1f',
        '\u6709\u53f2\u4ee5\u6765\u6700\u53e4\u8001\u7684\u661f\u8c61\u4f20\u7edf\u3002',
        '\u7ec8\u4e8e\uff0c\u6709\u4eba\u771f\u6b63\u4e86\u89e3\u4f60\u4e86\u3002',
        '518,400 \u79cd\u72ec\u7279\u547d\u76d8\u683c\u5c40\u2014\u2014\u4e0d\u662f12\u79cd\uff0c\u4e0d\u662f16\u79cd\u3002',
        '\u5e2e\u4f60\u627e\u5230\u70ed\u60c5\u4e0e\u529b\u91cf\u7684\u6240\u5728\u3002',
        '\u8fd9\u5c31\u662f\u6e05\u660e\u7684\u6a21\u6837\u3002',
      ],
      SPLASH_PHRASES: [
        '\u8ba9\u4eba\u7c7b\u6210\u4e3a\u771f\u6b63\u7684\u81ea\u5df1\u3002',
        '\u4f60\u7684\u4eba\u751f\u5730\u5f62\uff0c\u53ef\u4ee5\u88ab\u7ed8\u5236\u3002',
        '\u6211\u4eec\u5404\u6709\u4f7f\u547d\u2014\u2014\u4f60\u7684\u662f\u4ec0\u4e48\uff1f',
        '\u6709\u53f2\u4ee5\u6765\u6700\u53e4\u8001\u7684\u661f\u8c61\u4f20\u7edf\u3002',
        '\u7ec8\u4e8e\uff0c\u6709\u4eba\u771f\u6b63\u4e86\u89e3\u4f60\u4e86\u3002',
        '518,400 \u79cd\u72ec\u7279\u547d\u76d8\u683c\u5c40\u2014\u2014\u4e0d\u662f12\u79cd\uff0c\u4e0d\u662f16\u79cd\u3002',
        '\u5e2e\u4f60\u627e\u5230\u70ed\u60c5\u4e0e\u529b\u91cf\u7684\u6240\u5728\u3002',
        '\u8fd9\u5c31\u662f\u6e05\u660e\u7684\u6a21\u6837\u3002',
      ],
      SPARK_PROMPTS: [
        '\u4f60\u6b63\u5728\u6267\u7740\u4ec0\u4e48\uff0c\u800c\u5b83\u5df2\u4e0d\u518d\u6ecb\u517b\u4f60\uff1f',
        '\u4eca\u5929\u662f\u8c01\u8ba9\u4f60\u611f\u5230\u88ab\u771f\u6b63\u770b\u89c1\uff1f',
        '\u5982\u679c\u4f60\u4e0d\u5bb3\u6015\uff0c\u4f60\u4f1a\u505a\u4ec0\u4e48\uff1f',
        '\u4eca\u5929\u4f60\u5728\u54ea\u4e2a\u77ac\u95f4\u627e\u5230\u4e86\u5185\u5fc3\u7684\u5e73\u9759\uff1f',
        '\u6709\u4ec0\u4e48\u662f\u4f60\u9700\u8981\u539f\u8c05\u81ea\u5df1\u7684\uff1f',
      ],
      SPARK_PRACTICES: [
        '\u505a\u4e94\u6b21\u547c\u5438\uff1a\u5438\u6c14\u65f6\u9ed8\u6570\u56db\u62cd\uff0c\u547c\u6c14\u65f6\u540c\u6837\u6570\u56db\u62cd\u3002',
        '\u8bf4\u51fa\u4e09\u4ef6\u4f60\u611f\u6069\u7684\u4e8b\u2014\u2014\u4e00\u4ef6\u5173\u4e8e\u8eab\u4f53\uff0c\u4e00\u4ef6\u5173\u4e8e\u5185\u5fc3\uff0c\u4e00\u4ef6\u5173\u4e8e\u7cbe\u795e\u3002',
        '\u89c9\u5bdf\u6b64\u523b\uff1a5 \u4ef6\u4f60\u80fd\u770b\u5230\u7684\u4e8b\uff0c4 \u4ef6\u4f60\u80fd\u89e6\u78b0\u7684\uff0c3 \u4ef6\u4f60\u80fd\u542c\u5230\u7684\u3002',
      ],
      SOUL_TYPES: [
        { name: '\u5f00\u62d3\u8005', tagline: '\u53c2\u5929\u5927\u6811\u2014\u2014\u6210\u957f\u3001\u5fd7\u5411\u3001\u5411\u4e0a\u7684\u751f\u547d\u529b\u3002\u4f60\u4ee5\u6e05\u660e\u4e4b\u5fc3\u5efa\u9020\u4e0e\u5f15\u9886\u3002' },
        { name: '\u7ec7\u68a6\u8005', tagline: '\u85e4\u8513\u4e0e\u82b1\u6735\u2014\u2014\u67d4\u97e7\u3001\u4f18\u96c5\u3001\u5584\u4e8e\u9002\u5e94\u3002\u4f60\u8fde\u7ed3\u4eba\u5fc3\uff0c\u6ecb\u517b\u4e07\u7269\u3002' },
        { name: '\u5149\u8000\u8005', tagline: '\u592a\u9633\u2014\u2014\u6e29\u6696\u3001\u53ef\u89c1\u3001\u9886\u5bfc\u529b\u3002\u4f60\u4e3a\u4ed6\u4eba\u7167\u4eae\u524d\u8def\u3002' },
        { name: '\u660e\u706f\u8005', tagline: '\u70db\u706b\u4e0e\u661f\u5149\u2014\u2014\u67d4\u548c\u7684\u5149\uff0c\u6d1e\u89c1\uff0c\u4eb2\u5bc6\u611f\u3002\u4f60\u770b\u89c1\u522b\u4eba\u9519\u8fc7\u7684\u4e8b\u7269\u3002' },
        { name: '\u78d0\u77f3\u8005', tagline: '\u5c71\u5cb3\u2014\u2014\u7a33\u5b9a\u3001\u53ef\u9760\u3001\u4e0d\u53ef\u6495\u52a8\u3002\u4f60\u662f\u4f17\u4eba\u7684\u57fa\u77f3\u3002' },
        { name: '\u6c83\u571f\u8005', tagline: '\u80a5\u6c83\u7684\u571f\u58e4\u2014\u2014\u6ecb\u517b\u3001\u63a5\u7eb3\u3001\u8f6c\u5316\u3002\u4f60\u5e2e\u52a9\u4e07\u7269\u751f\u957f\u3002' },
        { name: '\u5229\u5203\u8005', tagline: '\u5b9d\u5251\u2014\u2014\u679c\u51b3\u3001\u9769\u65b0\u3001\u950b\u5229\u3002\u4f60\u65a9\u65ad\u8ff7\u96fe\uff0c\u76f4\u8fbe\u672c\u8d28\u3002' },
        { name: '\u73cd\u5b9d\u8005', tagline: '\u5b9d\u77f3\u2014\u2014\u7cbe\u70bc\u3001\u73cd\u8d35\u3001\u654f\u611f\u3002\u4f60\u73cd\u89c6\u54c1\u8d28\u4e0e\u6df1\u5ea6\u3002' },
        { name: '\u5927\u6d0b\u8005', tagline: '\u6d77\u6d0b\u2014\u2014\u5f3a\u5927\u3001\u6d41\u52a8\u3001\u52bf\u4e0d\u53ef\u6321\u3002\u4f60\u5584\u4e8e\u9002\u5e94\uff0c\u575a\u97e7\u4e0d\u62d4\u3002' },
        { name: '\u6668\u96fe\u8005', tagline: '\u9759\u6c34\u6df1\u6d41\u3002\u4f60\u5438\u7eb3\u4e00\u5207\uff0c\u4ee5\u6f84\u660e\u7684\u5185\u5fc3\u6620\u7167\u8fd9\u4e2a\u4e16\u754c\u3002' },
      ],
      ANNUAL_INSIGHTS: {
        architect:  '\u6b63\u5b98\u5e74\uff1a\u6b63\u5f0f\u8ba4\u53ef\u7684\u673a\u9047\u5df2\u81f3\u2014\u2014\u4ee5\u7ed3\u6784\u4e0e\u6e05\u660e\u63a8\u52a8\u524d\u884c\u3002',
        harvest:    '\u6b63\u8d22\u661f\u6d3b\u8dc3\u2014\u2014\u8010\u5fc3\u79ef\u7d2f\u7ec8\u6709\u56de\u62a5\uff0c\u4eba\u9645\u5173\u7cfb\u6210\u4e3a\u8d22\u5bcc\u901a\u9053\u3002',
        windfall:   '\u504f\u8d22\u6d8c\u52a8\u2014\u2014\u4fdd\u6301\u5f00\u653e\uff0c\u610f\u5916\u673a\u9047\u5f80\u5f80\u6765\u81ea\u5bfb\u5e38\u8def\u4e4b\u5916\u3002',
        challenger: '\u4e03\u6740\u78e8\u7ef4\u4f60\u3002\u5c06\u6469\u64e6\u8f6c\u5316\u4e3a\u8f93\u51fa\uff0c\u800c\u975e\u53cd\u5e94\u3002',
        muse:       '\u98df\u795e\u6d41\u5e74\u2014\u2014\u521b\u610f\u4e0e\u8868\u8fbe\u4e4b\u8def\u8d70\u5f97\u683c\u5916\u987a\u7545\u3002',
        maverick:   '\u4f24\u5b98\u89e6\u53d1\u53d8\u9769\u3002\u5ba1\u89c6\u5df2\u4e0d\u518d\u9002\u5408\u7684\u4e8b\u7269\uff0c\u4e0d\u5fc5\u56fa\u5b88\u65e7\u6709\u3002',
        guardian:   '\u6b63\u5370\u62a4\u4f2a\u6b64\u5e74\u3002\u591a\u4f9d\u9760\u8d35\u4eba\u548c\u5e08\u957f\u2014\u2014\u4ed6\u4eec\u5c06\u652f\u6301\u4f60\u3002',
        mystic:     '\u504f\u5370\u52a0\u6df1\u3002\u9759\u5bc1\u4e2d\u6d1e\u89c1\u6d8c\u73b0\u3002\u5b88\u62a4\u4f60\u7684\u5185\u5728\u7a7a\u95f4\u3002',
        mirror:     '\u6bd4\u80a9\u4e4b\u5e74\uff1a\u540c\u4f34\u7684\u529b\u91cf\u8fdb\u5165\u7126\u70b9\u3002\u7528\u5fc3\u9009\u62e9\u4f60\u7684\u5708\u5b50\u3002',
        shadow:     '\u52ab\u8d22\u5e74\uff1a\u8b66\u60d5\u98ce\u9669\u5347\u7ea7\u3002\u5927\u80c6\u7684\u884c\u52a8\u80cc\u540e\u6709\u771f\u5b9e\u7684\u4ee3\u4ef7\u3002',
        _default:   '\u4e00\u4e2a\u7a33\u6b65\u5c55\u5f00\u7684\u5e74\u4efd\u2014\u2014\u4e13\u6ce8\u4e8e\u6700\u91cd\u8981\u7684\u4e8b\u3002',
      },
      ORACLE_TEMPLATES: [
        { icon: '\u26a1', title: '\u4e8b\u4e1a\u6289\u62e9',   desc: '\u4e0e\u4f60\u672c\u8d28\u5951\u5408\u7684\u4e8b\u4e1a\u65b9\u5411',   question: 'What kind of work environment, role, or path is most aligned with who I fundamentally am? What am I genuinely built for \u2014 and what tends to quietly drain me, even when it looks right on paper?' },
        { icon: '\u25ce',  title: '\u611f\u60c5\u955c\u50cf',   desc: '\u4f60\u7684\u611f\u60c5\u6a21\u5f0f\u4e0e\u6240\u5438\u5f15\u7684\u4eba',   question: 'What are my real patterns in love and close relationships \u2014 what I need, what I tend to create, what I avoid or attract? Be honest with me about the recurring shape of things.' },
        { icon: '\u25c9',  title: '{year} \u6d41\u5e74', desc: '\u4eca\u5e74\u6fc0\u6d3b\u4e86\u4f60\u547d\u76d8\u4e2d\u7684\u4ec0\u4e48',   question: 'What is {year} asking from me? Where is the current running, and where might I be swimming against it without knowing? What deserves the most of my attention and energy this year?' },
        { icon: '\u25d0',  title: '\u9634\u6697\u9762\u6a21\u5f0f', desc: '\u5728\u6697\u5904\u5bf9\u4f60\u8d77\u4f5c\u7528\u7684\u76f2\u70b9',   question: "There's something I keep returning to but haven't resolved. I want to understand what's actually underneath it \u2014 not just the surface version of the question. Help me see it more clearly." },
        { icon: '\u2696',  title: '\u884c\u52a8\u65f6\u673a',   desc: '\u5f53\u4e0b\u9002\u5408\u5927\u80c6\u6539\u53d8\u5417\uff1f',   question: "I'm weighing something significant. I want to understand whether this is the right moment to move \u2014 or whether patience, preparation, or a different approach is the more intelligent choice right now." },
        { icon: '\u2726',  title: '\u5065\u5eb7\u4e0e\u6d3b\u529b', desc: '\u4f60\u7684\u4f53\u8d28\u4e0e\u80fd\u91cf\u8282\u5f8b',   question: 'What am I actually building across this decade \u2014 not just the year? What deserves my deepest investment right now, and what would I regret not having started?' },
      ],
      THEME_LABELS: {
        healing: '\u7597\u6108\u4e0e\u66f4\u65b0', courage: '\u52c7\u6c14\u4e0e\u529b\u91cf', clarity: '\u6e05\u660e\u4e0e\u771f\u5b9e',
        love: '\u7231\u4e0e\u5f52\u5c5e', purpose: '\u4f7f\u547d\u4e0e\u53ec\u5524', stillness: '\u9759\u5b9a\u4e0e\u5b89\u5b81',
        resilience: '\u97e7\u6027\u4e0e\u6301\u4e45', change: '\u53d8\u5316\u4e0e\u653e\u4e0b',
      },
      VAULT_THEME_PILLS: [
        { value: 'healing', label: '\u7597\u6108' }, { value: 'courage', label: '\u52c7\u6c14' },
        { value: 'clarity', label: '\u6e05\u660e' }, { value: 'love', label: '\u7231' },
        { value: 'purpose', label: '\u4f7f\u547d' }, { value: 'stillness', label: '\u9759\u5b9a' },
        { value: 'resilience', label: '\u97e7\u6027' }, { value: 'change', label: '\u53d8\u5316' },
      ],
      VAULT_TRADITION_PILLS: [
        { value: 'daoism', label: '\u9053\u5bb6' }, { value: 'buddhism', label: '\u4f5b\u6559' },
        { value: 'stoicism', label: '\u65af\u591a\u845b' }, { value: 'christianity', label: '\u57fa\u7763\u6559' },
        { value: 'judaism', label: '\u72b9\u592a\u6559' }, { value: 'islam', label: '\u4f0a\u65af\u5170' },
        { value: 'confucianism', label: '\u5112\u5bb6' }, { value: 'sufi', label: '\u82cf\u83f2' },
        { value: 'greek', label: '\u5e0c\u814a' }, { value: 'vedic', label: '\u5420\u9640' },
        { value: 'chinese', label: '\u6613\u7ecf' }, { value: 'saved', label: '\u5df2\u6536\u85cf' },
      ],
      MEDITATIONS: [
        { icon: '\ud83e\udeb5', title: '\u6728\u2014\u2014\u751f\u957f\u4e0e\u613f\u666f',  desc: '\u6839\u7cfb\u4e0e\u5347\u817e\u80fd\u91cf\u7684\u610f\u8c61\u5f15\u5bfc\u30025\u201310 \u5206\u949f\u3002' },
        { icon: '\ud83d\udd25', title: '\u706b\u2014\u2014\u6e29\u6696\u4e0e\u8fde\u7ed3',  desc: '\u4ee5\u5fc3\u4e3a\u4e2d\u5fc3\u7684\u6e29\u6696\u51a5\u60f3\uff0c\u9002\u5408\u611f\u5230\u758f\u79bb\u65f6\u3002' },
        { icon: '\ud83d\uddff', title: '\u571f\u2014\u2014\u624e\u6839\u843d\u5730',    desc: '\u8eab\u4f53\u626b\u63cf\u4e0e\u5927\u5730\u8fde\u7ed3\uff0c\u9002\u5408\u7126\u8651\u65f6\u3002' },
        { icon: '\ud83e\ude99', title: '\u91d1\u2014\u2014\u91ca\u653e\u4e0e\u6e05\u660e',  desc: '\u4ee5\u547c\u5438\u4e3a\u4e3b\u7684\u653e\u4e0b\u51a5\u60f3\uff0c\u9002\u5408\u6df7\u4e71\u6216\u96be\u4ee5\u51b3\u65ad\u65f6\u3002' },
        { icon: '\ud83d\udca7', title: '\u6c34\u2014\u2014\u6d41\u52a8\u4e0e\u81e3\u670d',  desc: '\u6d41\u52a8\u610f\u8c61\u5f15\u5bfc\uff0c\u9002\u5408\u611f\u5230\u505c\u6ede\u65f6\u3002' },
        { icon: '\u25ce',  title: '\u91cd\u5927\u6289\u62e9\u524d\u7684\u51c6\u5907', desc: '\u624e\u6839\uff0b\u6e05\u660e\u300210 \u5206\u949f\u3002' },
      ],
      // Blueprint display strings (Chinese)
      dom_archetype_label:      '\u547d\u4e3b\u539f\u578b',
      decision_pattern_label:   '\u4f60\u7684\u51b3\u7b56\u6a21\u5f0f',
      bp_strength_label:        '\u5f3a\u5ea6',
      bp_show_details:          '\uff0b \u5c55\u5f00\u547d\u76d8\u8be6\u60c5',
      bp_hide_details:          '\uff0d \u6536\u8d77\u547d\u76d8\u8be6\u60c5',
      reading_preview_fallback: '\u70b9\u51fb\u89e3\u9501\u4f60\u7684\u4e13\u5c5e\u89e3\u8bfb \u2192',
      PILLAR_LABELS_EN:   ['\u5e74', '\u6708', '\u65e5', '\u65f6'],
      ELEMENT_NAMES:      { wood: '\u6728', fire: '\u706b', earth: '\u571f', metal: '\u91d1', water: '\u6c34' },
      TEN_GOD_EN:         ['\u6bd4\u80a9', '\u52ab\u8d22', '\u98df\u795e', '\u4f24\u5b98', '\u504f\u8d22', '\u6b63\u8d22', '\u4e03\u6740', '\u6b63\u5b98', '\u504f\u5370', '\u6b63\u5370'],
      TEN_GOD_ARCHETYPE:  ['\u955c\u50cf\u8005', '\u5f71\u8005', '\u7075\u611f\u8005', '\u7834\u683c\u8005', '\u673a\u7f18\u8005', '\u79ef\u805a\u8005', '\u6311\u6218\u8005', '\u5efa\u6784\u8005', '\u7384\u601d\u8005', '\u5b88\u62a4\u8005'],
      TEN_GOD_BRIEF: [
        '\u4f60\u901a\u8fc7\u540c\u4f34\u5b9a\u4e49\u81ea\u6211\u2014\u2014\u534f\u4f5c\u4e0e\u7ade\u4e89\u662f\u78e8\u792c\u4f60\u7684\u71d4\u7089\u3002',
        '\u4f60\u656c\u4e8e\u5192\u4ed6\u4eba\u4e0d\u656c\u5192\u7684\u9669\u2014\u2014\u679c\u656c\u884c\u52a8\u662f\u4f60\u7684\u4f18\u52bf\uff0c\u4e5f\u662f\u4f60\u7684\u76f2\u70b9\u3002',
        '\u521b\u9020\u6027\u7684\u8f93\u51fa\u4ece\u4f60\u8eab\u4e0a\u81ea\u7136\u6d41\u6de4\u2014\u2014\u90a3\u4efd\u624d\u534e\u5728\u65c1\u4eba\u773c\u4e2d\u770b\u4f3c\u6beb\u4e0d\u8d39\u529b\u3002',
        '\u4f60\u6253\u7834\u6a21\u5f0f\u3001\u6311\u6218\u5e38\u89c4\u2014\u2014\u9769\u65b0\u5728\u6b64\uff0c\u6469\u64e6\u4ea6\u7136\u3002',
        '\u504f\u8d22\u4e0e\u610f\u5916\u673a\u9047\u4e3b\u52a8\u5bfb\u4f60\u2014\u2014\u8d22\u5bcc\u901a\u8fc7\u975e\u5bfb\u5e38\u7684\u8def\u5f84\u5230\u6765\u3002',
        '\u4f60\u4ee5\u8010\u5fc3\u548c\u5173\u7cfb\u7a33\u5065\u79ef\u7d2f\u8d22\u5bcc\u2014\u2014\u4fe1\u4efb\u968f\u65f6\u95f4\u590d\u5229\u589e\u957f\u3002',
        '\u538b\u529b\u4e0e\u7ade\u4e89\u953b\u9020\u4f60\u2014\u2014\u5f53\u4f60\u88ab\u6311\u6218\u65f6\uff0c\u4f60\u624d\u771f\u6b63\u5f3a\u5927\u8d77\u6765\u3002',
        '\u4f60\u901a\u8fc7\u7ed3\u6784\u8d62\u5f97\u6743\u5a01\u2014\u2014\u673a\u6784\u4e0e\u4f53\u7cfb\u662f\u4f60\u7684\u821e\u53f0\u3002',
        '\u6df1\u6c89\u5b64\u72ec\u7684\u667a\u6167\u662f\u4f60\u7684\u5929\u8d4b\u2014\u2014\u6d1e\u89c1\u5728\u9759\u9ed8\u4e2d\u5230\u6765\u3002',
        '\u4f60\u5438\u5f15\u5bfc\u5e08\u4e0e\u5e87\u62a4\u2014\u2014\u4ed6\u4eba\u5728\u4f60\u8eab\u4e0a\u6295\u5165\uff0c\u662f\u56e0\u4e3a\u4ed6\u4eec\u770b\u89c1\u4e86\u4f60\u7684\u6f5c\u529b\u3002',
      ],
      DECISION_LENS: [
        '\u4f60\u5927\u91cf\u53c2\u7167\u4ed6\u4eba\u2014\u2014\u540c\u4f34\u7684\u52a8\u5411\u3001\u9886\u57df\u7684\u671f\u5f85\u3001\u4f60\u7684\u5224\u65ad\u662f\u5426\u5f97\u5230\u8ba4\u53ef\u3002\u8fd9\u8ba9\u4f60\u5f02\u5e38\u5584\u4e8e\u8bfb\u61c2\u4e00\u4e2a\u573a\u5408\uff0c\u5374\u6709\u65f6\u8fdf\u8fdf\u4e0d\u4fe1\u4efb\u5c1a\u672a\u88ab\u9a8c\u8bc1\u7684\u65b9\u5411\u3002\u8b66\u60d5\uff1a\u56e0\u4e3a\u6ca1\u89c1\u8fc7\u522b\u4eba\u5148\u8d70\u8fd9\u4e00\u6b65\uff0c\u5c31\u63a8\u8fdf\u81ea\u5df1\u7684\u51b3\u5b9a\u3002',
        '\u4f60\u884c\u52a8\u8fc5\u901f\uff0c\u4fe1\u4efb\u76f4\u89c9\u2014\u2014\u8fd9\u5df2\u4e3a\u4f60\u6240\u7528\u3002\u98ce\u9669\u5728\u4e8e\u4f4e\u4f30\u4e86\u65e0\u6cd5\u64a4\u56de\u7684\u884c\u52a8\u7684\u4ee3\u4ef7\uff0c\u6216\u5728\u8be5\u4fdd\u6301\u8010\u5fc3\u65f6\u5374\u505a\u51fa\u4e86\u5927\u80c6\u7684\u5224\u65ad\u3002\u8b66\u60d5\uff1a\u628a\u8c28\u614e\u6807\u8bb0\u4e3a\u61e6\u5f31\uff0c\u800c\u4e8b\u5b9e\u4e0a\u90a3\u624d\u662f\u51c6\u786e\u7684\u8bfb\u53d6\u3002',
        '\u65b0\u7684\u53ef\u80fd\u6027\u603b\u6bd4\u73b0\u6709\u627f\u8bfa\u66f4\u6709\u751f\u547d\u529b\u2014\u2014\u4e0d\u662f\u56e0\u4e3a\u6d6e\u8e81\uff0c\u800c\u662f\u4f60\u7684\u601d\u7ef4\u5728\u9650\u5236\u4e2d\u771f\u7684\u80fd\u751f\u6210\u66f4\u597d\u7684\u9009\u9879\u3002\u9700\u8981\u6293\u4f4f\u7684\u6a21\u5f0f\u662f\uff1a\u6070\u5728\u505a\u51fa\u627f\u8bfa\u7684\u65f6\u523b\uff0c\u6d6e\u73b0\u65b0\u7684\u66ff\u4ee3\u65b9\u6848\u3002\u8b66\u60d5\uff1a\u628a\u5173\u95ed\u9009\u9879\u7684\u4e0d\u9002\uff0c\u8bef\u8bfb\u4e3a\u8fd9\u4e2a\u9009\u9879\u672c\u8eab\u4e0d\u5bf9\u3002',
        '\u4f60\u64c5\u957f\u770b\u51fa\u5e38\u89c4\u9009\u9879\u7684\u95ee\u9898\u6240\u5728\u3002\u8fd9\u662f\u771f\u6b63\u7684\u8d44\u4ea7\u2014\u2014\u9664\u975e\u5b83\u53d8\u6210\u4e86\u6bd4\u8d77\u505a\u51fa\u4e0d\u5b8c\u7f8e\u7684\u627f\u8bfa\uff0c\u66f4\u96be\u505c\u6b62\u5bfb\u627e\u66f4\u597d\u8def\u5f84\u7684\u4e60\u60ef\u3002\u8b66\u60d5\uff1a\u7528\u6279\u5224\u6027\u601d\u7ef4\u6765\u62d6\u5ef6\uff0c\u800c\u975e\u505a\u51fa\u51b3\u5b9a\u3002',
        '\u4f60\u5bf9\u673a\u9047\u654f\u611f\u2014\u2014\u4f60\u80fd\u8fc5\u901f\u53d1\u73b0\u4e0a\u884c\u7a7a\u95f4\u5e76\u81ea\u7136\u5730\u9760\u8fd1\u5b83\u3002\u7ed3\u6784\u6027\u7684\u76f2\u70b9\u662f\u4f4e\u4f30\u4e86\u90a3\u4e9b\u628a\u4f60\u62c9\u79bb\u6838\u5fc3\u65b9\u5411\u7684\u884c\u52a8\u7684\u4ee3\u4ef7\u3002\u8b66\u60d5\uff1a\u770b\u4f3c\u6269\u5f20\u3001\u5b9e\u4e3a\u5206\u6563\u6ce8\u610f\u529b\u7684\u51b3\u5b9a\u3002',
        '\u4f60\u6709\u957f\u8fdc\u7684\u773c\u5149\u548c\u771f\u6b63\u7684\u8010\u5fc3\u2014\u2014\u4f60\u80fd\u63a5\u53d7\u9700\u8981\u65f6\u95f4\u7684\u6295\u8d44\u3002\u9700\u8981\u89c2\u5bdf\u7684\u6a21\u5f0f\u6070\u6070\u76f8\u53cd\uff1a\u6709\u65f6\u770b\u4f3c\u8010\u5fc3\u8015\u8018\u7684\uff0c\u5b9e\u9645\u4e0a\u662f\u5728\u56de\u907f\u4e00\u4e2a\u65e9\u5c31\u8be5\u505a\u7684\u51b3\u5b9a\u3002\u8b66\u60d5\uff1a"\u65f6\u673a\u672a\u5230"\u6210\u4e3a\u6c38\u4e45\u7684\u59ff\u6001\u3002',
        '\u4f60\u5728\u963b\u529b\u4e2d\u78e8\u792c\u2014\u2014\u6709\u963b\u529b\u7684\u65f6\u5019\u4f60\u72b6\u6001\u6700\u597d\u3002\u98ce\u9669\u5728\u4e8e\u628a\u6bcf\u4e00\u4e2a\u51b3\u5b9a\u90fd\u6846\u67b6\u4e3a\u610f\u5fd7\u529b\u7684\u8003\u9a8c\uff0c\u8fd9\u8ba9\u4f60\u66f4\u96be\u533a\u5206\u5851\u9020\u4f60\u7684\u6469\u64e6\u4e0e\u53ea\u662f\u4e0d\u5bf9\u7684\u6469\u64e6\u3002\u8b66\u60d5\uff1a\u56e0\u4e3a\u79bb\u5f00\u611f\u89c9\u50cf\u8f93\uff0c\u800c\u7ee7\u7eed\u7559\u5728\u4e00\u4ef6\u8270\u96be\u7684\u4e8b\u60c5\u4e2d\u3002',
        '\u4f60\u4fe1\u4efb\u7ed3\u6784\u3001\u6d41\u7a0b\u548c\u7ecf\u8fc7\u9a8c\u8bc1\u7684\u5148\u4f8b\u3002\u8fd9\u8ba9\u4f60\u53ef\u9760\uff0c\u800c\u4e14\u5f80\u5f80\u662f\u5bf9\u7684\u3002\u7ed3\u6784\u6027\u6a21\u5f0f\u662f\uff1a\u4f60\u7684"\u8db3\u591f\u4fe1\u606f\u624d\u80fd\u51b3\u5b9a"\u7684\u95e8\u69db\uff0c\u9ad8\u4e8e\u5927\u591a\u6570\u60c5\u51b5\u5b9e\u9645\u9700\u8981\u7684\u3002\u8b66\u60d5\uff1a\u90a3\u4e2a\u5728\u5b9e\u8df5\u4e2d\u4f60\u5df2\u7ecf\u505a\u4e86\u3001\u4f46\u5728\u5f62\u5f0f\u4e0a\u8fd8\u6ca1\u6709\u786e\u8ba4\u7684\u51b3\u5b9a\u3002',
        '\u4f60\u76f8\u4fe1\u6df1\u5c42\u7684\u8ba4\u77e5\u800c\u975e\u8868\u9762\u7684\u8bc1\u636e\u2014\u2014\u4f60\u7684\u5185\u5728\u611f\u77e5\u5f80\u5f80\u662f\u51c6\u786e\u7684\u3002\u98ce\u9669\u5728\u4e8e\uff0c\u771f\u6b63\u7684\u6d1e\u89c1\u4e0e\u56de\u907f\u56f0\u96be\uff0c\u4ece\u5185\u90e8\u611f\u53d7\u8d77\u6765\u53ef\u80fd\u662f\u4e00\u6837\u7684\u3002\u8b66\u60d5\uff1a"\u6211\u8fd8\u6ca1\u51c6\u5907\u597d"\u6210\u4e3a"\u6211\u4e0d\u60f3\u505a\u9009\u62e9"\u7684\u63a9\u62a4\u3002',
        '\u5f53\u4f60\u611f\u5230\u88ab\u652f\u6301\u65f6\uff0c\u4f60\u505a\u51fa\u597d\u7684\u51b3\u5b9a\u2014\u2014\u4f60\u4e5f\u64c5\u957f\u4e3a\u597d\u51b3\u5b9a\u521b\u9020\u6761\u4ef6\u3002\u9700\u8981\u89c2\u5bdf\u7684\u6a21\u5f0f\u662f\uff1a\u8fc7\u5ea6\u548b\u8be2\u2014\u2014\u5f15\u5165\u8d85\u8fc7\u8fd9\u4e2a\u51b3\u5b9a\u5b9e\u9645\u6240\u9700\u7684\u66f4\u591a\u89c6\u89d2\u3002\u8b66\u60d5\uff1a\u66f4\u591a\u7684\u8f93\u5165\u6210\u4e3a\u4ee3\u66ff\u627f\u8bfa\u7684\u66ff\u4ee3\u54c1\u3002',
      ],
    },
  };

  window.appLang = localStorage.getItem('soulmap_lang') || 'en';

  function t(key) {
    return (I18N[window.appLang] || I18N.en)[key] || (I18N.en)[key] || key;
  }

  function applyLang() {
    document.documentElement.lang = window.appLang === 'zh' ? 'zh-Hans' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var val = t(el.dataset.i18n);
      if (val && typeof val === 'string') el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el) {
      var val = t(el.dataset.i18nPh);
      if (val) el.placeholder = val;
    });
    var btnEn = document.getElementById('lang-btn-en');
    var btnZh = document.getElementById('lang-btn-zh');
    if (btnEn) btnEn.classList.toggle('lang-btn--active', window.appLang === 'en');
    if (btnZh) btnZh.classList.toggle('lang-btn--active', window.appLang === 'zh');
  }

  function vaultQuoteText(entry) {
    if (window.appLang === 'zh' && entry.text_zh) return entry.text_zh;
    return entry.text || '';
  }

  function initLangSwitcher() {
    applyLang();
    function setLang(lang) {
      if (window.appLang === lang) return;
      window.appLang = lang;
      localStorage.setItem('soulmap_lang', lang);
      applyLang();
    }
    var btnEn = document.getElementById('lang-btn-en');
    var btnZh = document.getElementById('lang-btn-zh');
    if (btnEn) btnEn.addEventListener('click', function() { setLang('en'); });
    if (btnZh) btnZh.addEventListener('click', function() { setLang('zh'); });

    var btnLangSwitch = document.getElementById('btn-lang-switch');
    if (btnLangSwitch) {
      btnLangSwitch.addEventListener('click', function() {
        var next = window.appLang === 'en' ? 'zh' : 'en';
        var msg = window.appLang === 'en'
          ? 'Switching to Chinese will restart the session. Continue?'
          : '\u5207\u6362\u4e3a\u82f1\u6587\u5c06\u91cd\u65b0\u5f00\u59cb\u4f1a\u8bdd\u3002\u662f\u5426\u7ee7\u7eed\uff1f';
        if (confirm(msg)) {
          localStorage.setItem('soulmap_lang', next);
          window.location.reload();
        }
      });
    }
  }

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

  // Archetype names (used across scoring, narrative, and display)
  const TEN_GOD_ARCHETYPE = ['Mirror','Shadow','Muse','Maverick','Windfall','Harvest',
                              'Challenger','Architect','Mystic','Guardian'];

  // One-sentence brief for each archetype (used in Dominant Ten God badge)
  const TEN_GOD_BRIEF = [
    'You define yourself through peers — collaboration and competition are your forge.',       // Mirror
    'You take risks others won\'t — bold action is your edge and your blind spot.',            // Shadow
    'Creative output flows naturally from you — talent that looks effortless to others.',      // Muse
    'You break patterns and challenge norms — innovation lives here, alongside friction.',     // Maverick
    'Windfall and unexpected opportunity seek you — wealth arrives through unconventional paths.', // Windfall
    'You build wealth steadily through patience and relationship — trust compounds over time.',// Harvest
    'Pressure and competition forge you — you become most powerful when challenged.',          // Challenger
    'You earn authority through structure — institutions and systems are your domain.',        // Architect
    'Deep solitary wisdom is your gift — insight arrives in stillness and silence.',           // Mystic
    'You attract mentors and protection — others invest in you because they see your potential.', // Guardian
  ];

  // Decade period character — what this 10-year window is structurally asking for (behavioral, no jargon)
  const DECADE_CHARACTER = {
    architect: 'A decade for earning formal authority. The structures and institutions that once felt constraining become navigable — and then yours to shape. Moves toward recognition and consolidation are well-timed here.',
    harvest:   'A decade where patience pays visibly. What has been quietly built now compounds — relationships become resources, past effort yields. This is not the decade to plant entirely new seeds; it\'s the decade to harvest what\'s already in the ground.',
    windfall:  'An unconventional decade — the unexpected is the point. Unusual opportunities arrive through unusual doors. The instinct to normalize this period, to make it fit prior patterns, will cost you.',
    challenger:'A decade of productive pressure. Something is being forged in you, and the friction is the process. The people and circumstances that challenge you most are your real teachers here.',
    muse:      'A creative and expressive decade. Output — making, communicating, building things that carry your voice — gains real traction. The instinct to suppress or delay what wants to be expressed will be harder to justify now.',
    maverick:  'A decade for breaking patterns. What served you in the last chapter will not serve you here. The willingness to question received wisdom — including your own — is the core competency this period rewards.',
    guardian:  'A decade of deep support. Mentors, allies, and invisible protection are closer than usual. The instinct toward self-sufficiency may be worth questioning — letting others invest in you is itself a decision.',
    mystic:    'A quiet decade, but not an empty one. The visible surface slows down; depth increases. This is a decade for building invisible foundations — expertise, inner clarity, the kind of knowledge that can\'t be rushed.',
    mirror:    'A decade dominated by the people around you. Who you surround yourself with will shape you more than usual. This is a decade to choose your circle with real care — and to notice what you learn from those who reflect you back.',
    shadow:    'A decade that rewards precision over boldness. The unconventional move has higher stakes here. This is a decade to sharpen, consolidate, and be deliberate — not to overextend.',
  };

  // Decision Lens — structural decision pattern per dominant Ten God (indexed 0–9: Mirror Shadow Muse Maverick Windfall Harvest Challenger Architect Mystic Guardian)
  const DECISION_LENS = [
    'You calibrate against what peers are doing — great at reading a room, sometimes slow to trust what others haven\'t validated. Watch for: delaying decisions until you\'ve seen someone else make them first.',
    'You move fast and trust your instincts — the risk is underweighting what can\'t be undone. Watch for: framing caution as timidity when it\'s actually accurate.',
    'New possibilities feel more alive than current commitments — your mind generates better options under constraint. Watch for: surfacing alternatives at the exact moment of commitment.',
    'You spot what\'s wrong with the conventional option — a genuine asset, until searching becomes easier than deciding. Watch for: using critical thinking to defer rather than to decide.',
    'You\'re tuned for opportunity — you notice upside quickly and move toward it naturally. Watch for: decisions that look like expansion but are actually distraction.',
    'You have a long horizon and genuine patience — sometimes cultivation masks an overdue decision. Watch for: "not the right time" becoming a permanent posture.',
    'You sharpen through resistance — but not all friction is formative. Watch for: staying in something difficult because leaving feels like losing.',
    'You trust structure, process, and precedent — reliable and often right. Watch for: the decision you\'ve made in practice but haven\'t made in form.',
    'You trust deep knowing over surface evidence — and it\'s often accurate. Watch for: "I\'m not ready" as a cover for "I don\'t want to choose."',
    'You decide well when supported — skilled at building conditions for good decisions. Watch for: over-consulting past the point where input substitutes for commitment.',
  ];

  // Element → traditional affinity for wisdom vault matching
  const ELEMENT_TRADITION = { wood:'vedic', fire:'sufi', earth:'confucianism', metal:'stoicism', water:'daoism' };

  /** Simple Mulberry32 PRNG seeded with an integer */
  function seededRandom(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Fisher-Yates shuffle using a deterministic PRNG */
  function seededShuffle(arr, seed) {
    const rng = seededRandom(seed);
    const a   = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Returns a stable integer seed for today + current profile */
  function getDailySeed() {
    const str = (state.profileId || 'default') + new Date().toDateString();
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  /** Return today's BaZi day stem+branch using the same +49 offset as the birth engine */
  function getTodayBaZiDay() {
    const jdn = Math.floor(Date.now() / 86400000 + 2440587.5);
    const idx  = (jdn + 49) % 60;
    return { stemIdx: idx % 10, branchIdx: idx % 12 };
  }

  /** Compute the dominant Ten God across a chart (excluding self/day stem).
   *  Returns the Ten God index (0–9) with highest weighted presence. */
  function computeDominantTenGod(chart) {
    const dm = chart.dayPillar.stem;
    const scores = new Array(10).fill(0);

    // Stems: month gets 1.2× weight (most influential), year/hour get 1.0×
    const stemWeights = [
      { s: chart.yearPillar.stem,  w: 1.0 },
      { s: chart.monthPillar.stem, w: 1.2 },
      { s: chart.hourPillar.stem,  w: 1.0 },
    ];
    for (const { s, w } of stemWeights) {
      scores[getTenGod(dm, s)] += w;
    }

    // Hidden stems of all four branches
    const roleWeight = { main: 0.8, secondary: 0.5, residual: 0.25 };
    for (const pillar of [chart.yearPillar, chart.monthPillar, chart.dayPillar, chart.hourPillar]) {
      for (const hs of (HIDDEN_STEMS_ROLES[pillar.branch] || [])) {
        scores[getTenGod(dm, hs.s)] += (roleWeight[hs.r] || 0.25);
      }
    }

    // Skip 0 (Mirror/比肩) and 1 (Shadow/劫财) — they just mean "same element as DM"
    let best = 2, bestScore = scores[2];
    for (let i = 3; i < 10; i++) {
      if (scores[i] > bestScore) { best = i; bestScore = scores[i]; }
    }
    return best;
  }

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

  // English translations for spirit killer names (神煞)
  const SHEN_SHA_EN = {
    '驿马':   'Traveling Horse',
    '桃花':   'Peach Blossom',
    '天乙贵人': 'Heavenly Noble',
    '太极贵人': 'Supreme Noble',
    '月德合':  'Month Virtue',
    '天医':   'Heaven Doctor',
    '国印':   'Nation Seal',
  };

  // (DAYUN_ACCENT_COLORS removed — dayun card borders now uniformly psychic purple per 2-plate ink system)

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

  /** Exposed by initOracle() so activateProfile() can clear history on profile switch */
  let oracleApiReset = null;

  let state = {
    birthDate: '', shichen: 0, gender: 'male',
    occupation: '', relationship: '', currentConcern: '',
    chart: null, soulTypeIndex: 0, streak: 0,
    narrativeFromAPI: null,
    profileId: null,          // ID of the active profile
    profileName: '',          // display name of the active profile
    savedOracleItems: [],      // per-profile Oracle saves (not shared across profiles)
    savedVaultCitations: [],   // per-profile vault bookmark saves (not shared across profiles)
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
    // V2 key invalidates old jargon-heavy cached narratives from before 2026-02-27
    const daYunNarrativesV2 = {};
    if (state.chart && state.chart.daYun) {
      state.chart.daYun.forEach(d => {
        if (d.narrative) daYunNarrativesV2[d.label] = d.narrative;
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
      narrativeLang:       state.narrativeFromAPI ? (window.appLang || 'en') : null,
      narrativePillarsStr: (state.narrativeFromAPI && state.chart)
                             ? (state.chart.pillarsStr || null)
                             : null,
      daYunNarrativesV2:   Object.keys(daYunNarrativesV2).length ? daYunNarrativesV2 : null,
      savedOracleItems:    state.savedOracleItems || [],
      savedVaultCitations: state.savedVaultCitations || [],
    };
    if (idx >= 0) { profiles[idx] = profileData; } else { profiles.push(profileData); }
    saveProfiles(profiles);
    setActiveProfileId(state.profileId);
  }

  /** Load a profile object into state and re-render the app */
  function activateProfile(p) {
    const chart = calculateBaZi(p.birthDate, p.shichen);
    chart.daYun = calculateDaYun(chart, p.birthDate, p.gender || 'female');
    // Restore persisted cycle narratives (V2 key = behavioral language, post 2026-02-27)
    if (p.daYunNarrativesV2 && chart.daYun) {
      chart.daYun.forEach(d => {
        if (p.daYunNarrativesV2[d.label]) d.narrative = p.daYunNarrativesV2[d.label];
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
      narrativeFromAPI: (p.narrativeFromAPI && p.narrativePillarsStr && chart.pillarsStr === p.narrativePillarsStr
                          && (p.narrativeLang || 'en') === (window.appLang || 'en'))
                          ? p.narrativeFromAPI
                          : null,
      savedOracleItems: p.savedOracleItems || [],
      savedVaultCitations: p.savedVaultCitations || [],
    });
    setActiveProfileId(p.id);
    // Update header labels
    const nameEl = document.getElementById('profile-btn-name');
    if (nameEl) nameEl.textContent = p.name || 'My Chart';
    const typeEl = document.getElementById('app-user-type');
    if (typeEl) typeEl.textContent = (t('SOUL_TYPES')[chart.dayMaster] || {}).name || SOUL_TYPES[chart.dayMaster].name;
    // Re-curate "For You" now that state.chart is populated
    if (document.getElementById('wisdom-vault-list')) {
      renderWisdomVault(vaultFilterType, vaultFilterValue);
    }
    // Reset Oracle history for the new profile
    if (oracleApiReset) oracleApiReset(p.id);
  }

  /** One-time migration: move any 'saved' items from the global vault key
   *  into the active profile's savedOracleItems array.
   *  Runs once per browser; safe to call repeatedly (no-ops if nothing to migrate). */
  function migrateOrphanedSaves() {
    try {
      const raw = localStorage.getItem(WISDOM_VAULT_STORAGE_KEY);
      if (!raw) return;
      const all = JSON.parse(raw);

      // Migrate orphaned Oracle saves (tradition='saved', no isCitation flag) → savedOracleItems
      const oracleOrphans = all.filter(e => e.tradition === 'saved' && !e.isCitation);
      if (oracleOrphans.length) {
        state.savedOracleItems = (state.savedOracleItems || []).concat(oracleOrphans);
      }

      // Migrate orphaned vault bookmark saves (isCitation=true) → per-profile savedVaultCitations
      const vaultOrphans = all.filter(e => e.isCitation);
      if (vaultOrphans.length) {
        const existing = state.savedVaultCitations || [];
        const existingKeys = new Set(existing.map(a => a._vaultKey));
        const newOnes = vaultOrphans.filter(a => !existingKeys.has(a._vaultKey));
        state.savedVaultCitations = existing.concat(newOnes);
      }

      if (oracleOrphans.length || vaultOrphans.length) {
        saveCurrentProfile();
        // Purge all profile-specific entries from the global key — leave only oracle-extracted citations
        saveAdditions(all.filter(e => e.tradition !== 'saved' && !e.isCitation));
      }
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

    const baseChart = {
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
    baseChart.shenSha = getShenSha(baseChart);
    baseChart.dominantTenGod = computeDominantTenGod(baseChart);
    return baseChart;
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

    // ── SPIRIT KILLER (神煞) bonuses ─────────────────────────────
    // Check if the decade branch IS a special spirit position for this chart.
    const yearBr = chart.yearPillar.branch;
    const monBr  = chart.monthPillar.branch;
    const hasNoble    = (TIANYI_MAP[dm]  || []).includes(decade.branchIndex); // 天乙贵人
    const hasRomance  = TAOHUA_MAP[yearBr] === decade.branchIndex;             // 桃花
    const hasTravel   = YIMA_MAP[yearBr]   === decade.branchIndex;             // 驿马
    const hasHealer   = (monBr + 1) % 12  === decade.branchIndex;             // 天医

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
    // 神煞 spirit bonuses for love
    if (hasNoble)   love += 10; // 天乙贵人 → social grace, guardian figures
    if (hasRomance) love += 12; // 桃花 → magnetic attraction
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
    // 神煞 spirit bonuses for career
    if (hasNoble)  career += 8;  // 天乙贵人 → helpful patrons, doors open
    if (hasTravel) career += 10; // 驿马 → movement, opportunity, relocation luck
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
    // 神煞 spirit bonus for health
    if (hasHealer) health += 8; // 天医 → recovery support, vitality boost
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
    document.getElementById('btn-start').addEventListener('click', () => {
      showView('view-onboard');
      if (initOnboard._reset) initOnboard._reset(); // always start at Step 1
    });
  }

  // ─── 2-Step Onboarding Navigation ────────────────────────────────
  function initOnboardSteps() {
    let currentStep = 1;

    const step1El     = document.getElementById('onboard-step-1');
    const step2El     = document.getElementById('onboard-step-2');
    const dot1        = document.getElementById('prog-dot-1');
    const dot2        = document.getElementById('prog-dot-2');
    const navTitle    = document.getElementById('onboard-nav-title');
    const navCounter  = document.getElementById('onboard-nav-counter');
    const continueBtn = document.getElementById('btn-step1-continue');
    const TITLES      = ['Your Birth Chart', 'Life Context'];

    function goToStep(n) {
      const fromEl = currentStep === 1 ? step1El : step2El;
      const toEl   = n === 1 ? step1El : step2El;
      if (fromEl === toEl) return;

      // Animate exit
      fromEl.classList.add('onboard-step--exit');
      fromEl.addEventListener('animationend', () => {
        fromEl.classList.remove('onboard-step--active', 'onboard-step--exit');
      }, { once: true });

      // Animate enter (force reflow so animation triggers fresh)
      void toEl.offsetWidth;
      toEl.classList.add('onboard-step--active');

      // Update nav bar
      navTitle.textContent   = TITLES[n - 1];
      navCounter.textContent = n + ' of 2';
      navCounter.setAttribute('aria-label', 'Step ' + n + ' of 2');
      dot1.classList.toggle('onboard-progress-dot--active', n === 1);
      dot2.classList.toggle('onboard-progress-dot--active', n === 2);

      // Scroll view to top so step starts visible
      const view = document.getElementById('view-onboard');
      if (view) view.scrollTop = 0;

      currentStep = n;
    }

    // "Continue →" — validate Step 1 required fields before advancing
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        const form = document.getElementById('form-onboard');
        if (!form) return;
        const required1 = ['profileName', 'birthDate', 'shichen', 'gender'];
        let valid = true;
        required1.forEach(name => {
          const el   = form.elements[name];
          const cell = el && el.closest('.input-cell');
          if (cell) cell.classList.remove('input-cell--error');
          if (!el || !el.value.trim()) {
            valid = false;
            if (cell) cell.classList.add('input-cell--error');
          }
        });
        if (valid) {
          goToStep(2);
        } else {
          const first = step1El.querySelector('.input-cell--error');
          if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    // Clear error state when user interacts with a field
    const form = document.getElementById('form-onboard');
    if (form) {
      ['input', 'change'].forEach(evt => form.addEventListener(evt, e => {
        const cell = e.target.closest('.input-cell');
        if (cell) cell.classList.remove('input-cell--error');
      }));
    }

    return { currentStep: () => currentStep, goToStep };
  }

  // ─── Onboarding ──────────────────────────────────────────────────
  function initOnboard() {
    const steps = initOnboardSteps();

    // Expose reset so showView('view-onboard') callers can return to Step 1
    initOnboard._reset = () => steps.goToStep(1);

    // Back button: step-aware navigation
    document.getElementById('btn-back-landing').addEventListener('click', () => {
      if (steps.currentStep() === 2) {
        steps.goToStep(1);
        return;
      }
      // Step 1: exit onboarding entirely
      if (loadProfiles().length > 0 && state.chart) {
        showView('view-app');
      } else {
        showView('view-landing');
      }
    });

    // Form submit (Step 2 CTA)
    document.getElementById('form-onboard').addEventListener('submit', function (e) {
      e.preventDefault();
      const fd = new FormData(this);
      const email = (fd.get('email') || '').trim();
      const isNewProfile = !state.profileId;
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

      // Fire-and-forget email — only on first-time profile creation
      if (isNewProfile) {
        trackEvent('profile_created', { gender: fd.get('gender') || 'unknown' });
        if (email && email.includes('@')) {
          fetch('/api/collect-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name: (fd.get('profileName') || '').trim() }),
          }).catch(() => {});
        }
      }

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
      const currentSeasonProfile = currentDecade ? buildSeasonProfile(currentDecade, stemIdx) : null;
      const payload = {
        dayMaster:             STEMS[stemIdx] + ' (' + (STEM_NAMES_EN[stemIdx] || '') + ')',
        dayMasterMetaphor:     DAY_MASTER_METAPHORS[stemIdx] || '',
        pillarsStr:            chart.pillarsStr || '',
        elementBalance:        formatElementBalance(chart),
        dayMasterStrength:     chart.dayMasterStrength || 'Moderate',
        favorableElements:     (chart.favorableElements || []).map(
          e => e ? e[0].toUpperCase() + e.slice(1) : ''
        ).filter(Boolean),
        soulType:              (SOUL_TYPES[stemIdx] || {}).name || '',
        soulTypeTagline:       (SOUL_TYPES[stemIdx] || {}).tagline || '',
        luckPillarStr:         formatLuckPillar(currentDecade),
        annualPillarStr:       formatAnnualPillar(chart.annualPillar),
        occupation:            state.occupation   || '',
        relationship:          state.relationship || '',
        currentConcern:        state.currentConcern || '',
        dayMasterStemIdx:      stemIdx,
        currentSeasonProfile,
        lang:                  window.appLang || 'en',
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
    const tg = TEN_GOD_ARCHETYPE[ap.tenGod] || '';
    return `${STEM_ROMANIZATION[ap.stem]} ${BRANCH_ROMANIZATION[ap.branch]} — ${STEM_NAMES_EN[ap.stem]} ${BRANCH_ANIMALS[ap.branch]}${tg ? ', Ten God: ' + tg : ''} (year ${ap.year})`;
  }

  /** Build a structured season profile for the current luck decade.
   *  Returns stem + branch + hidden-stem Ten God breakdown for the narrative API. */
  function buildSeasonProfile(decade, dm) {
    if (!decade) return null;
    const hidden = (HIDDEN_STEMS_ROLES[decade.branchIndex] || []).map(hs => ({
      char:     STEMS[hs.s],
      tenGodEN: TEN_GOD_ARCHETYPE[getTenGod(dm, hs.s)] || '',
      role:     hs.r,
    }));
    return {
      stemChar:     STEMS[decade.stemIndex],
      stemTenGodEN: TEN_GOD_ARCHETYPE[getTenGod(dm, decade.stemIndex)] || '',
      branchChar:   BRANCHES[decade.branchIndex],
      hiddenThemes: hidden,
    };
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
    // Update reading card preview
    const previewEl = document.getElementById('reading-card-preview');
    if (previewEl) {
      const text = narrative.coreEssence || '';
      previewEl.textContent = text.length > 90 ? text.slice(0, 87) + '\u2026' : (text || t('reading_preview_fallback'));
    }
    // Sync card CTA state now that narrative has arrived
    updateReadingCardState();
  }

  async function buildChart() {
    const chart = calculateBaZi(state.birthDate, state.shichen);
    chart.daYun = calculateDaYun(chart, state.birthDate, state.gender);
    setState({ chart, soulTypeIndex: chart.dayMaster, narrativeFromAPI: null });
    saveCurrentProfile();
    const nameEl = document.getElementById('profile-btn-name');
    if (nameEl) nameEl.textContent = state.profileName || 'My Chart';
    document.getElementById('app-user-type').textContent = (t('SOUL_TYPES')[state.soulTypeIndex] || {}).name || SOUL_TYPES[state.soulTypeIndex].name;

    // Pre-render blueprint (view-app not visible yet)
    renderAppBlueprint();

    // Start narrative fetch in background — don't block the transition on it
    const narrativePromise = fetchNarrativeFromAPI(chart);

    // Show the splash phrase for a minimum of 2 seconds, then reveal the app
    await new Promise(resolve => setTimeout(resolve, 2000));

    generatingView.stop();
    showView('view-app');
    switchTab('blueprint');

    // Narrative arrives in the background — update the section when ready
    const narrative = await narrativePromise;
    if (narrative) {
      setState({ narrativeFromAPI: narrative });
      saveCurrentProfile();
      updateNarrativeSection(narrative);
    }
  }

  function runGeneration() {
    trackEvent('blueprint_generated');
    showView('view-generating');

    // Show a random marketing phrase for the brief loading window
    const phrases  = t('SPLASH_PHRASES');
    const phraseEl = document.getElementById('gen-splash-phrase');
    if (phraseEl) phraseEl.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    const splashEl = document.getElementById('gen-splash');
    const loadEl   = document.getElementById('gen-loading');
    if (splashEl) splashEl.hidden = false;
    if (loadEl)   loadEl.hidden   = true;

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

  // Update reading card visual state: pulsing CTA when unclaimed, calm when claimed
  function updateReadingCardState() {
    const card = document.getElementById('reading-card');
    if (!card) return;
    const claimed = !!(state.narrativeFromAPI && state.narrativeFromAPI.coreEssence);
    card.classList.toggle('reading-card--unclaimed', !claimed);
    const labelEl = card.querySelector('.reading-card-label');
    if (labelEl) {
      if (!claimed) {
        labelEl.innerHTML = t('bp_reading_card_label') + ' <span class="reading-card-badge">Personalized</span>';
      } else {
        labelEl.innerHTML = t('bp_reading_card_label') + ' <span class="reading-card-badge">Personalized</span>';
      }
    }
    const previewEl = document.getElementById('reading-card-preview');
    if (previewEl && !claimed) {
      previewEl.textContent = t('reading_preview_fallback');
    }
  }

  // Produce a clickable term-link label for the BaZi grid
  function termLabel(cn, en, termId) {
    return `<button class="term-link" data-term="${termId}" type="button"><span>${cn}</span><span class="bazi-label-en">${en}</span><span class="term-info">\u24d8</span></button>`;
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
        <span class="bazi-elem-tag bazi-elem-${d.stemEl}">${(t('ELEMENT_NAMES') || ELEMENT_NAMES)[d.stemEl]}</span>
      </div>`;
    }

    function branchCell(d) {
      return `<div class="bazi-cell">
        <span class="bazi-romanization">${BRANCH_ROMANIZATION[d.p.branch]}</span>
        <span class="bazi-char" style="color:${ELEMENT_HEX[d.branchEl]}">${BRANCHES[d.p.branch]}</span>
        <span class="bazi-elem-tag bazi-elem-${d.branchEl}">${(t('ELEMENT_NAMES') || ELEMENT_NAMES)[d.branchEl]}</span>
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
      return `<div class="bazi-cell bazi-cell-sha">${d.sha.map(s => {
        const en = SHEN_SHA_EN[s] || '';
        return `<span class="bazi-sha-tag">${s}${en ? `<span class="bazi-sha-en">${en}</span>` : ''}</span>`;
      }).join('')}</div>`;
    }

    const hasSha = pData.some(d => d.sha && d.sha.length > 0);

    const rows = [
      // Row 0 — header
      `<div class="bazi-row bazi-row-header bazi-row-core">
        <div class="bazi-label">${termLabel('日期', 'Pillar', 'four-pillars')}</div>
        ${PILLAR_LABELS_CN.map((cn, i) => `<div class="bazi-col-head${i===2?' bazi-day-head':''}">${cn}<span class="bazi-col-en">${(t('PILLAR_LABELS_EN') || PILLAR_LABELS_EN)[i]}</span></div>`).join('')}
      </div>`,

      // Row 1 — 主星 Ten God
      `<div class="bazi-row bazi-row-core">
        <div class="bazi-label">${termLabel('主星', '10 Gods', 'ten-gods')}</div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-tengod${i===2?' bazi-day':''}">${TEN_GOD_NAMES[d.tg]}<span class="bazi-tg-en">${(t('TEN_GOD_EN') || TEN_GOD_EN)[d.tg]}</span></div>`).join('')}
      </div>`,

      // Row 2 — 天干 Heavenly Stems
      `<div class="bazi-row bazi-row-core">
        <div class="bazi-label">${termLabel('天干', 'Stems', 'heavenly-stems')}</div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${stemCell(d).replace('<div class="bazi-cell">','<div class="bazi-cell">')}</div>`).join('')}
      </div>`,

      // Row 3 — 地支 Earthly Branches
      `<div class="bazi-row bazi-row-core">
        <div class="bazi-label">${termLabel('地支', 'Branches', 'earthly-branches')}</div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${branchCell(d)}</div>`).join('')}
      </div>`,

      // Row 4 — 藏干 Hidden Stems (first reference row — thick top border)
      `<div class="bazi-row bazi-row-ref bazi-row-ref-first">
        <div class="bazi-label">${termLabel('藏干', 'Hidden', 'hidden-stems')}</div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${hiddenCell(d)}</div>`).join('')}
      </div>`,

      // Row 5 — 副星 Sub Stars (ten gods of hidden stems)
      `<div class="bazi-row bazi-row-ref">
        <div class="bazi-label">${termLabel('副星', 'Sub Stars', 'sub-stars')}</div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${subStarCell(d)}</div>`).join('')}
      </div>`,

      // Row 6 — 星运 12 Growth Stage (stem in its branch)
      `<div class="bazi-row bazi-row-ref">
        <div class="bazi-label">${termLabel('星运', 'Stage', 'growth-stage')}</div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-small${i===2?' bazi-day':''}">${d.stage}</div>`).join('')}
      </div>`,

      // Row 7 — 自坐 Self-seat (day master in each branch)
      `<div class="bazi-row bazi-row-ref">
        <div class="bazi-label">${termLabel('自坐', 'Self', 'self-seat')}</div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-small${i===2?' bazi-day':''}">${d.selfSeat}</div>`).join('')}
      </div>`,

      // Row 8 — 空亡 Empty/Void
      `<div class="bazi-row bazi-row-ref">
        <div class="bazi-label">${termLabel('空亡', 'Void', 'void-emptiness')}</div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-small${i===2?' bazi-day':''}">${d.kongwang}</div>`).join('')}
      </div>`,

      // Row 9 — 纳音 Nayin (last row when no spirits)
      `<div class="bazi-row bazi-row-ref${hasSha ? '' : ' bazi-row-last'}">
        <div class="bazi-label">${termLabel('纳音', 'Nayin', 'nayin')}</div>
        ${pData.map((d, i) => `<div class="bazi-cell bazi-cell-small${i===2?' bazi-day':''}">${d.nayin}</div>`).join('')}
      </div>`,

      // Row 10 — 神煞 Spirit Killers (only shown when at least one pillar has sha)
      ...(hasSha ? [`<div class="bazi-row bazi-row-ref bazi-row-last">
        <div class="bazi-label">${termLabel('神煞', 'Spirits', 'spirit-killers')}</div>
        ${pData.map((d, i) => `<div class="${i===2?'bazi-day':''}">${shaCell(d)}</div>`).join('')}
      </div>`] : [])
    ];

    el.innerHTML = `<div class="bazi-grid">${rows.join('')}</div>`;

    // Wire the static toggle button — clone to clear any stale listeners
    const toggleBtn = document.getElementById('btn-bazi-ref-toggle');
    const grid      = el.querySelector('.bazi-grid');
    if (toggleBtn && grid) {
      const freshBtn = toggleBtn.cloneNode(true);
      toggleBtn.parentNode.replaceChild(freshBtn, toggleBtn);
      freshBtn.textContent = t('bp_show_details');
      grid.classList.remove('bazi-grid--expanded');
      freshBtn.addEventListener('click', () => {
        const expanded = grid.classList.toggle('bazi-grid--expanded');
        freshBtn.textContent = expanded ? t('bp_hide_details') : t('bp_show_details');
      });
    }
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
      const desc     = DAYUN_STEM_DESC[decade.stemIndex];
      const isSelected = _cycleDetailIdx !== null ? _cycleDetailIdx === i : decade.isCurrent;
      const classes  = ['dayun-card', decade.isCurrent ? 'dayun-card-active' : '', isSelected ? 'dayun-card-selected' : ''].filter(Boolean).join(' ');
      return `
        <div class="${classes}" data-decade-idx="${i}">
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
          <div class="dayun-tap-hint"><span class="dayun-tap-spark">✦</span><span class="dayun-tap-label"> Deep reading</span></div>
        </div>`;
    }).join('');

    // Event delegation for card taps → cycle detail panel
    if (!strip.dataset.clickWired) {
      strip.dataset.clickWired = '1';
      strip.addEventListener('click', e => {
        const card = e.target.closest('.dayun-card');
        if (!card) return;
        const idx = parseInt(card.dataset.decadeIdx, 10);
        if (!isNaN(idx)) showCycleDetail(idx);
      });
    }

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
    { key:'love',   label:'Love',   cn:'感情', color:'#E8372A' }, /* --arc-love: var(--color-vermillion) */
    { key:'wealth', label:'Wealth', cn:'财运', color:'#D4AF37' }, /* --arc-wealth: var(--color-gold) */
    { key:'career', label:'Career', cn:'事业', color:'#1A4DB5' }, /* --arc-career: var(--color-cyan) */
    { key:'health', label:'Health', cn:'健康', color:'#3A7D44' }, /* --arc-health: var(--color-cobalt) */
  ];

  let _cycleDetailIdx = null; // which season is currently open/selected

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

    // Column highlight group — first child so it renders behind all data
    const hlGroup = document.createElementNS(ns, 'g');
    hlGroup.setAttribute('id', 'arc-col-hl');
    svg.appendChild(hlGroup);

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

    // ── Assemble into section ────────────────────────────────────
    section.innerHTML = `
      <div class="arc-chart-header">
        <div class="arc-legend">${legendHtml}</div>
      </div>
      <div class="arc-chart-container" id="arc-svg-wrap"></div>
      <div id="cycle-detail-panel" class="cycle-detail-panel" style="display:none"></div>
    `;
    document.getElementById('arc-svg-wrap').appendChild(svg);

    // Highlight initially selected column (current decade or previously opened)
    const initSel = _cycleDetailIdx !== null ? _cycleDetailIdx : currentIdx;
    if (initSel >= 0) highlightChartColumn(initSel);
  }

  /** Update the gold column highlight in the arc SVG chart */
  function highlightChartColumn(idx) {
    const g = document.getElementById('arc-col-hl');
    if (!g || !state.chart || !state.chart.daYun) return;
    const n = state.chart.daYun.length;
    const VW = 500, VH = 200, PL = 28, PR = 12, PT = 16, PB = 38;
    const CW = VW - PL - PR;
    const xPos = PL + (n > 1 ? (idx / (n - 1)) * CW : CW / 2);
    const colW = Math.max(30, n > 1 ? CW / (n - 1) : CW);
    const ns2 = 'http://www.w3.org/2000/svg';
    g.innerHTML = '';
    const rect = document.createElementNS(ns2, 'rect');
    rect.setAttribute('x', String(xPos - colW / 2 + 1));
    rect.setAttribute('y', String(PT - 6));
    rect.setAttribute('width', String(colW - 2));
    rect.setAttribute('height', String(VH - PT - PB + 34));
    rect.setAttribute('fill', 'rgba(212,175,55,0.13)');
    rect.setAttribute('rx', '4');
    g.appendChild(rect);
  }

  // ─── Cycle Detail Panel ───────────────────────────────────────────
  function showCycleDetail(idx) {
    const panel = document.getElementById('cycle-detail-panel');
    if (!panel || !state.chart || !state.chart.daYun) return;
    const decade = state.chart.daYun[idx];
    if (!decade) return;

    // ── Selection state: update card strip + chart highlight ──────
    _cycleDetailIdx = idx;
    document.querySelectorAll('.dayun-card').forEach((card, i) => {
      card.classList.toggle('dayun-card-selected', i === idx);
    });
    highlightChartColumn(idx);

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

    // ── Narrative state machine ────────────────────────────────────
    const narrative = decade.narrative;
    const loadingPhrases = t('LOADING_PHRASES');
    const randomPhrase = loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)];

    const narrativeHtml = narrative
      ? `<div class="cycle-narrative">
          <p class="cycle-theme">"${narrative.theme}"</p>
          <p>${narrative.summary}</p>
          <div class="cycle-narrative-domains">
            <div><strong>💰 Wealth</strong><p>${narrative.wealthNote}</p></div>
            <div><strong>❤️ Love</strong><p>${narrative.relationshipsNote}</p></div>
            <div><strong>💼 Career</strong><p>${narrative.careerNote || narrative.wealthNote}</p></div>
            <div><strong>💪 Health</strong><p>${narrative.healthNote}</p></div>
          </div>
          <div class="cycle-lesson">
            <p><strong>Life Lesson:</strong> ${narrative.lifeLessonThisSeason}</p>
          </div>
        </div>`
      : decade._narrativeError
        ? `<div class="cycle-narrative-loading">
            <div class="cycle-gen-error">
              <p>${window.appLang === 'zh' ? '解读加载失败。' : 'Reading couldn\u2019t load.'}</p>
              <button class="btn-refresh btn-cycle-narrative" onclick="retrySeasonNarrative(${idx})">
                ${window.appLang === 'zh' ? '重试' : 'Try again'}
              </button>
            </div>
          </div>`
        : `<div class="cycle-narrative-loading cycle-narrative-generating">
            <p class="cycle-gen-phrase" id="cycle-gen-phrase">${randomPhrase}</p>
            <div class="cycle-gen-dots"><span></span><span></span><span></span></div>
            <p class="cycle-gen-sub">${window.appLang === 'zh' ? '正在推演大运规律…' : 'Consulting the ancient calendar\u2026'}</p>
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
          ${scoreBar('Love',   decade.love,   '#E8372A')}
          ${scoreBar('Wealth', decade.wealth, '#D4AF37')}
          ${scoreBar('Career', decade.career, '#1A4DB5')}
          ${scoreBar('Health', decade.health, '#3A7D44')}
        </div>
        <div class="cycle-season-desc">${DAYUN_STEM_DESC[decade.stemIndex] || ''}</div>
        ${narrativeHtml}
      </div>`;

    // Scroll into view
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // ── Auto-fetch narrative if not yet loaded ────────────────────
    if (!narrative && !decade._narrativeFetching && !decade._narrativeError) {
      decade._narrativeFetching = true;
      fetchCycleNarrative(idx);
    }
  }

  function retrySeasonNarrative(idx) {
    const decade = state.chart && state.chart.daYun && state.chart.daYun[idx];
    if (!decade) return;
    decade._narrativeError = false;
    decade._narrativeFetching = false;
    showCycleDetail(idx);
  }
  window.retrySeasonNarrative = retrySeasonNarrative;

  /** Fetch AI narrative for a specific decade cycle (auto-triggered on card open) */
  async function fetchCycleNarrative(idx) {
    const decade = state.chart && state.chart.daYun && state.chart.daYun[idx];
    if (!decade) return;

    // Cycle through loading phrases while waiting
    const phrases = t('LOADING_PHRASES');
    let pi = Math.floor(Math.random() * phrases.length);
    const phraseInterval = setInterval(() => {
      const el = document.getElementById('cycle-gen-phrase');
      if (el) {
        pi = (pi + 1) % phrases.length;
        el.style.transition = 'opacity 0.35s';
        el.style.opacity = '0';
        setTimeout(() => {
          const el2 = document.getElementById('cycle-gen-phrase');
          if (el2) { el2.textContent = phrases[pi]; el2.style.opacity = ''; }
        }, 360);
      } else {
        clearInterval(phraseInterval);
      }
    }, 3200);

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
        lang: window.appLang || 'en',
      };

      const res = await fetch('/api/cycle-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      decade.narrative = data;
      decade._narrativeFetching = false;

      // Persist to profile
      saveCurrentProfile();

      // Re-render panel with narrative
      clearInterval(phraseInterval);
      showCycleDetail(idx);
    } catch (err) {
      clearInterval(phraseInterval);
      decade._narrativeFetching = false;
      decade._narrativeError = true;
      showCycleDetail(idx);
      console.error('fetchCycleNarrative error:', err);
    }
  }
  // Expose for inline onclick
  window.fetchCycleNarrative = fetchCycleNarrative;

  // ─── Annual Year Scoring (流年) ───────────────────────────────────
  /** Score the current annual pillar across Wealth / Love / Career / Health */
  function scoreAnnualYear(chart) {
    const ap = chart.annualPillar;
    if (!ap) return null;
    const dm      = chart.dayPillar.stem;
    const useful  = chart.usefulGods  || [];
    const harmful = chart.harmfulGods || [];
    const gender  = state.gender || 'female';

    const stemTenGod  = getScoreTenGod(dm, ap.stem);
    const stemEl      = STEM_EL_NAME[ap.stem];
    const hiddenStems = (HIDDEN_STEMS_ROLES[ap.branch] || []).map(h => ({
      ...h, element: STEM_EL_NAME[h.s], tenGod: getScoreTenGod(dm, h.s),
    }));
    const mainHS      = hiddenStems[0] || { element: stemEl, tenGod: stemTenGod, r: 'main' };
    const twelveStage = getTwelveStageEn(dm, ap.branch);
    const interactions = findBranchInteractions(ap.branch, chart);
    const dayClash    = interactions.some(i => i.withPillar === 'day' && i.type === 'clash');

    // Spirit killers for annual branch
    const yearBr     = chart.yearPillar.branch;
    const monBr      = chart.monthPillar.branch;
    const hasNoble   = (TIANYI_MAP[dm]  || []).includes(ap.branch);
    const hasRomance = TAOHUA_MAP[yearBr] === ap.branch;
    const hasTravel  = YIMA_MAP[yearBr]   === ap.branch;
    const hasHealer  = (monBr + 1) % 12  === ap.branch;

    // Wealth
    let wealth = 50;
    if (stemTenGod === 'harvest' || stemTenGod === 'windfall') wealth += 12;
    if (stemTenGod === 'muse')   wealth += 8;
    if (useful.includes(stemEl))  wealth += 10;
    if (harmful.includes(stemEl)) wealth -= 8;
    for (const hs of hiddenStems) {
      if (hs.tenGod === 'harvest' || hs.tenGod === 'windfall') wealth += hs.r === 'main' ? 8 : 4;
      if (useful.includes(hs.element))  wealth += hs.r === 'main' ? 4 : 2;
      if (harmful.includes(hs.element)) wealth -= hs.r === 'main' ? 4 : 2;
    }
    if (dayClash) wealth -= 12;
    wealth = Math.max(5, Math.min(95, Math.round(wealth)));

    // Love
    let love = 50;
    const lBonus = { guardian:12, muse:10, architect:8, harvest:8, mirror:6,
                     mystic:-4, maverick:-10, challenger:-6, shadow:-4, windfall:2 };
    love += lBonus[stemTenGod] ?? 0;
    if (gender === 'female') { if (stemTenGod === 'architect') love += 6; }
    else                     { if (stemTenGod === 'harvest')   love += 6; }
    if (hasNoble)   love += 10;
    if (hasRomance) love += 12;
    if (dayClash)   love -= 18;
    love = Math.max(5, Math.min(95, Math.round(love)));

    // Career
    let career = 50;
    const cBonus = { architect:12, challenger:8, muse:8, maverick:5, windfall:4,
                     harvest:3, mirror:0, shadow:-8, guardian:2, mystic:4 };
    career += cBonus[stemTenGod] ?? 0;
    if (useful.includes(stemEl))  career += 8;
    if (harmful.includes(stemEl)) career -= 6;
    if (hasNoble)  career += 8;
    if (hasTravel) career += 10;
    career = Math.max(5, Math.min(95, Math.round(career)));

    // Health
    let health = 50;
    const hVit = { zenith:30, ascension:24, rising:18, awakening:14, waning:4, nurture:6,
                   initiation:-4, conception:-2, retreat:-10, stillness:-14, vault:-16, void:-20 };
    health += hVit[twelveStage] ?? 0;
    if (useful.includes(stemEl))  health += 8;
    if (harmful.includes(stemEl)) health -= 6;
    if (stemTenGod === 'guardian') health += 10;
    if (stemTenGod === 'mystic')   health += 6;
    if (mainHS.tenGod === 'guardian' || mainHS.tenGod === 'mystic') health += 4;
    if (hasHealer) health += 8;
    health = Math.max(5, Math.min(95, Math.round(health)));

    return { wealth, love, career, health, stemTenGod, twelveStage };
  }

  /** Render the 流年 "This Year" card in the Blueprint tab */
  function renderAnnualArc(chart) {
    const el = document.getElementById('annual-arc');
    if (!el) return;
    const scores = scoreAnnualYear(chart);
    if (!scores) { el.style.display = 'none'; return; }
    el.style.display = '';
    const ap = chart.annualPillar;
    const pillarCharsEl = document.getElementById('annual-pillar-chars');
    if (pillarCharsEl) pillarCharsEl.textContent = ap.stemChar + ap.branchChar;

    const domains = [
      { key:'wealth', label:'Wealth', color:'var(--color-gold)' },
      { key:'career', label:'Career', color:'var(--color-cobalt)' },
      { key:'love',   label:'Love',   color:'var(--color-vermillion)' },
      { key:'health', label:'Health', color:'var(--color-cyan)' },
    ];
    const rowEl = document.getElementById('annual-scores-row');
    if (rowEl) {
      rowEl.innerHTML = domains.map(d =>
        `<div class="annual-score-item">
          <div class="annual-score-label">${d.label}</div>
          <div class="annual-score-bar-wrap">
            <div class="annual-score-bar-fill" style="width:${scores[d.key]}%;background:${d.color}"></div>
          </div>
          <div class="annual-score-num">${scores[d.key]}</div>
        </div>`
      ).join('');
    }
    const ANNUAL_INSIGHTS = {
      architect: 'Architect energy opens formal recognition — push for structure and clarity this year.',
      harvest:   'Harvest star is active — patient effort compounds. Relationships become wealth channels.',
      windfall:  'Windfall stirs — stay open to unexpected opportunity outside your usual path.',
      challenger:'Challenger pressure forges you. Channel friction into output, not reaction.',
      muse:      'Muse energy flows — creative and expressive work gains real traction.',
      maverick:  'Maverick sparks disruption. Question what no longer fits; don\'t defend the old.',
      guardian:  'Guardian wraps this year in support. Lean on mentors — they will hold.',
      mystic:    'Mystic depth deepens. Quiet insight arrives. Protect your inner space.',
      mirror:    'Mirror energy brings peers into focus. Choose your circle with care.',
      shadow:    'Shadow year: watch for risk escalation. Bold moves carry real downside.',
    };
    const themeEl = document.getElementById('annual-theme');
    if (themeEl) {
      themeEl.textContent = (t('ANNUAL_INSIGHTS')[scores.stemTenGod] || t('ANNUAL_INSIGHTS')._default);
    }
  }

  // ─── Blueprint Reveal Gate ───────────────────────────────────────
  function initBlueprintReveal() {
    const dayunSection  = document.getElementById('dayun-section');
    const dayunDivider  = document.getElementById('dayun-divider');
    const energySection = document.getElementById('energy-charts-section');
    const energyDivider = document.getElementById('energy-divider');
    const revealWrap    = document.getElementById('reveal-seasons-wrap');
    if (!dayunSection || !energySection || !revealWrap) return;

    dayunSection.hidden  = true;
    energySection.hidden = true;
    if (dayunDivider)  dayunDivider.hidden  = true;
    if (energyDivider) energyDivider.hidden = true;
    revealWrap.hidden = false;

    // cloneNode wipes stale listeners — renderAppBlueprint() is called on every tab switch
    const oldBtn = revealWrap.querySelector('#btn-reveal-seasons');
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    newBtn.addEventListener('click', () => {
      haptic('medium');
      trackEvent('blueprint_revealed');
      dayunSection.hidden  = false;
      energySection.hidden = false;
      if (dayunDivider)  dayunDivider.hidden  = false;
      if (energyDivider) energyDivider.hidden = false;
      revealWrap.hidden = true;
      requestAnimationFrame(() => dayunSection.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    });
  }

  // ─── Main Blueprint Renderer ─────────────────────────────────────
  function renderAppBlueprint() {
    if (!state.chart) return;
    const soulType     = SOUL_TYPES[state.soulTypeIndex];
    const soulTypeI18n = t('SOUL_TYPES')[state.soulTypeIndex] || {};
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
      imgEl.src = '/personas/persona-' + soulType.slug + '.png';
      imgEl.alt = soulType.name;
    }
    setEl('detail-type-name', soulTypeI18n.name || soulType.name);
    setEl('detail-type-sub', soulType.sub);
    setEl('detail-tagline', soulTypeI18n.tagline || soulType.tagline);

    // Dominant Ten God badge
    const badgeEl = document.getElementById('dominant-ten-god-badge');
    if (badgeEl && state.chart.dominantTenGod != null) {
      const dtgIdx  = state.chart.dominantTenGod;
      const dtgName  = (t('TEN_GOD_ARCHETYPE')[dtgIdx] || TEN_GOD_ARCHETYPE[dtgIdx] || '');
      const dtgCN    = TEN_GOD_NAMES[dtgIdx] || '';
      const dtgBrief = (t('TEN_GOD_BRIEF')[dtgIdx]    || TEN_GOD_BRIEF[dtgIdx]    || '');
      badgeEl.innerHTML =
        `<button class="term-link" data-term="dominant-archetype" type="button" style="display:block;text-align:left;width:100%">` +
        `<span class="dtg-label">${t('dom_archetype_label')} <span class="term-info">\u24d8</span></span>` +
        `<span class="dtg-name">${dtgName} <span class="dtg-cn">${dtgCN}</span></span>` +
        `<span class="dtg-brief">${dtgBrief}</span>` +
        `</button>`;

      // Decision Lens — behavioral decision pattern from dominant archetype
      const lensEl    = document.getElementById('decision-lens');
      const lensItems = t('DECISION_LENS');
      if (lensEl && dtgIdx >= 0 && (lensItems[dtgIdx] || DECISION_LENS[dtgIdx])) {
        lensEl.innerHTML =
          `<span class="decision-lens-label">${t('decision_pattern_label')}</span>` +
          `<p class="decision-lens-text">${lensItems[dtgIdx] || DECISION_LENS[dtgIdx]}</p>`;
      }
    }

    // Meta
    setEl('detail-destiny-structure', t('bp_strength_label') + ': ' + getDayMasterStrength());
    const favEls = (state.chart.favorableElements || []).join(' · ');
    setEl('detail-favorable-elements', favEls || season);
    setEl('detail-zodiac', zodiac);

    // Element bars
    const barsEl = document.getElementById('detail-elements-bars');
    if (barsEl) {
      barsEl.innerHTML = Object.entries(balance).map(([k, v]) =>
        `<div class="element-row">
          <button class="term-link" data-term="element-balance" type="button" style="display:inline;font-size:inherit">${(t('ELEMENT_NAMES') || ELEMENT_NAMES)[k]}</button>
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
      // Update reading card preview with AI narrative
      const previewEl = document.getElementById('reading-card-preview');
      if (previewEl) {
        const text = na.coreEssence || '';
        previewEl.textContent = text.length > 90 ? text.slice(0, 87) + '\u2026' : (text || t('reading_preview_fallback'));
      }
    } else {
      // Show placeholder + static fallback
      if (placeholder) placeholder.style.display = '';
      if (n) {
        const coreEssence = 'Your core essence is ' + (n.shortName || soulType.name.replace(/^The /,'')) +
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
        // Update reading card preview with static fallback
        const previewEl = document.getElementById('reading-card-preview');
        if (previewEl) {
          const text = coreEssence || '';
          previewEl.textContent = text.length > 90 ? text.slice(0, 87) + '\u2026' : (text || t('reading_preview_fallback'));
        }
      }
    }

    // Concern block
    const concernSection = document.getElementById('section-concern');
    const concernEl      = document.getElementById('detail-concern');
    if (state.currentConcern && concernSection && concernEl && n) {
      const truncated  = state.currentConcern.length > 120 ? state.currentConcern.slice(0, 117) + '...' : state.currentConcern;
      concernEl.textContent = 'You shared: ' + truncated + ' — Your ' + soulType.element + ' nature is supported in ' + season + '. Trust your instincts.';
      concernSection.hidden = false;
    } else if (concernSection) {
      concernSection.hidden = true;
    }

    // Annual Arc (流年)
    renderAnnualArc(state.chart);

    // Life Seasons + Energy Charts (rendered but gated behind reveal button)
    renderDaYun();
    renderEnergyCharts();
    initBlueprintReveal();

    // Sync reading card visual state (pulsing CTA if no AI narrative yet)
    updateReadingCardState();
  }

  // ─── Tab Management ──────────────────────────────────────────────
  function switchTab(tabId) {
    haptic('light');
    trackEvent('tab_switched', { tab: tabId });
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
      title:    'What am I built for?',
      desc:     'Work that fits your actual nature',
      question: 'What kind of work environment, role, or path is most aligned with who I fundamentally am? What am I genuinely built for — and what tends to quietly drain me, even when it looks right on paper?',
    },
    {
      icon:     '◎',
      title:    'The relationship question',
      desc:     'Patterns in love and close connection',
      question: 'What are my real patterns in love and close relationships — what I need, what I tend to create, what I avoid or attract? Be honest with me about the recurring shape of things.',
    },
    {
      icon:     '◉',
      title:    '{year} — the current',
      desc:     'What this year is asking from you',
      question: 'What is {year} asking from me? Where is the current running, and where might I be swimming against it without knowing? What deserves the most of my attention and energy this year?',
    },
    {
      icon:     '◐',
      title:    'What I keep circling',
      desc:     'The thing you haven\'t resolved yet',
      question: 'There\'s something I keep returning to but haven\'t resolved. I want to understand what\'s actually underneath it — not just the surface version of the question. Help me see it more clearly.',
    },
    {
      icon:     '⚖',
      title:    'Is the timing right?',
      desc:     'A significant move, and when to make it',
      question: 'I\'m weighing something significant. I want to understand whether this is the right moment to move — or whether patience, preparation, or a different approach is the more intelligent choice right now.',
    },
    {
      icon:     '✦',
      title:    'The long game',
      desc:     'What this decade is actually building',
      question: 'What am I actually building across this decade — not just the year? What deserves my deepest investment right now, and what would I regret not having started?',
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
        lang:                window.appLang || 'en',
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
    const templatesEl = document.getElementById('oracle-templates');
    const sendBtn     = form ? form.querySelector('button[type="submit"]') : null;

    // Conversation history for multi-turn context (role/content pairs)
    const conversationHistory = [];

    // ── Per-profile localStorage key ──────────────────────────────
    function oracleKey() {
      return 'soulmap_oracle_' + (state.profileId || 'default');
    }

    // ── Load saved history for current profile ────────────────────
    function loadOracleHistory() {
      try {
        const raw = localStorage.getItem(oracleKey());
        if (!raw) return [];
        return JSON.parse(raw) || [];
      } catch (_) { return []; }
    }

    function saveOracleHistory() {
      try {
        localStorage.setItem(oracleKey(), JSON.stringify(conversationHistory.slice(-20)));
      } catch (_) {}
    }

    // ── Restore saved messages into DOM ───────────────────────────
    function restoreHistory(history) {
      conversationHistory.length = 0;
      if (!messages) return;
      // Clear any existing DOM messages
      messages.innerHTML = '';
      history.forEach(({ role, content }) => {
        conversationHistory.push({ role, content });
        const div = document.createElement('div');
        div.className = 'msg ' + role;
        if (role === 'assistant') div.innerHTML = renderMarkdown(content);
        else div.textContent = content;
        messages.appendChild(div);
      });
      if (history.length > 0) {
        if (placeholder) placeholder.style.display = 'none';
        if (templatesEl)  templatesEl.style.display  = 'none';
        messages.scrollTop = messages.scrollHeight;
      }
    }

    // ── Reset Oracle when profile changes ─────────────────────────
    oracleApiReset = function(newProfileId) {
      conversationHistory.length = 0;
      if (messages)    messages.innerHTML = '';
      if (placeholder) placeholder.style.display = '';
      if (templatesEl) templatesEl.style.display  = '';
      const warning = document.getElementById('oracle-leave-warning');
      if (warning) warning.hidden = true;
      // Load history for the new profile
      const newKey = 'soulmap_oracle_' + (newProfileId || 'default');
      try {
        const raw = localStorage.getItem(newKey);
        if (raw) restoreHistory(JSON.parse(raw) || []);
      } catch (_) {}
    };

    // ── Render deep-dive template cards ───────────────────────────
    if (templatesEl) {
      const year  = new Date().getFullYear();
      const label = document.createElement('p');
      label.className = 'oracle-templates-label';
      label.textContent = t('oracle_templates_header');
      templatesEl.appendChild(label);

      const grid = document.createElement('div');
      grid.className = 'oracle-templates-grid';

      t('ORACLE_TEMPLATES').forEach(tmpl => {
        const btn   = document.createElement('button');
        btn.type    = 'button';
        btn.className = 'oracle-template-card';
        const title    = tmpl.title.replace('{year}', year);
        const question = tmpl.question.replace(/\{year\}/g, year);
        btn.innerHTML =
          '<span class="oracle-ai-badge">\u26a1 Ask AI</span>' +
          '<span class="oracle-template-icon">'  + tmpl.icon  + '</span>' +
          '<span class="oracle-template-title">' + title   + '</span>' +
          '<span class="oracle-template-desc">'  + tmpl.desc  + '</span>';
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

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;

      trackEvent('oracle_submitted', { question_length: q.length });

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

      // Typing indicator with cycling marketing phrase
      const typing = document.createElement('div');
      typing.className = 'msg assistant typing';
      const _phrases = t('LOADING_PHRASES');
      let _pi = Math.floor(Math.random() * _phrases.length);
      typing.innerHTML = `
        <p class="typing-phrase">${_phrases[_pi]}</p>
        <div class="typing-dots"><span></span><span></span><span></span></div>`;
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;

      // Cycle through phrases while waiting
      const _typingInterval = setInterval(() => {
        const el = typing.querySelector('.typing-phrase');
        if (el && typing.parentNode) {
          el.style.opacity = '0';
          setTimeout(() => {
            if (el.parentNode) {
              _pi = (_pi + 1) % _phrases.length;
              el.textContent = _phrases[_pi];
              el.style.opacity = '';
            }
          }, 350);
        } else {
          clearInterval(_typingInterval);
        }
      }, 3200);

      try {
        const answer = await fetchOracleAnswer(q, conversationHistory);

        // Remove typing indicator + stop phrase cycling
        clearInterval(_typingInterval);
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
        saveOracleHistory(); // persist to localStorage

        // Parse any classical citations into the Wisdom Vault
        const parsed = parseCitationFromMessage(answer);
        if (parsed) addCitationToVault(parsed);

      } catch (err) {
        clearInterval(_typingInterval);
        typing.remove();
        const errMsg = document.createElement('div');
        errMsg.className = 'msg assistant error';
        errMsg.textContent = t('oracle_error');
        messages.appendChild(errMsg);
        messages.scrollTop = messages.scrollHeight;
        console.warn('[SoulMap] Oracle API failed:', err);
      } finally {
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
      }
    });

    // ── Load history for the current profile on startup ───────────
    const saved = loadOracleHistory();
    if (saved.length > 0) restoreHistory(saved);
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
      .concat(getStoredAdditions())                  // oracle-extracted classical citations (global)
      .concat(state.savedVaultCitations || [])       // per-profile vault bookmark saves
      .concat(state.savedOracleItems || []);          // per-profile Oracle saves
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

  // Captions for when a quote scores via useful gods — "this tradition speaks the language of what fortifies you"
  const WHY_CAPTIONS_USEFUL = {
    metal: {
      chinese:  'Metal precision finds its home in the I Ching — each line a cut toward clarity.',
      stoicism: 'Stoicism was built for Metal\'s path: discipline, refinement, the unnecessary stripped away.',
      islam:    'Islamic tradition on purification speaks to Metal\'s practice of becoming more exact.',
    },
    water: {
      daoism:   'Daoism flows from the same source as Water — yielding, deep, impossible to stop.',
      sufi:     'The Sufi poets are Water\'s people: love as the deepest current, the self dissolved.',
      buddhism: 'Buddhism\'s teaching on non-grasping mirrors Water\'s native state — nothing held, everything flowing.',
    },
    wood: {
      buddhism:     'Wood grows toward light; Buddhism illuminates the path without forcing the direction.',
      confucianism: 'Confucian cultivation is Wood\'s process — upward, purposeful, becoming who you\'re meant to be.',
      vedic:        'Vedic dharma speaks to Wood\'s mission: the specific path you were born to walk.',
    },
    fire: {
      stoicism:     'Stoicism is how Fire sustains without burning out — passion focused into practical wisdom.',
      greek:        'Greek philosophy asks Fire\'s question: how to live fully and love what you love.',
      christianity: 'Christian love theology speaks to Fire\'s gift — warmth that transforms everything it touches.',
    },
    earth: {
      confucianism: 'Confucian virtue is Earth made conscious — showing up reliably, building trust over time.',
      judaism:      'Jewish covenant wisdom speaks to Earth\'s gift: faithful presence, day after day.',
      vedic:        'Karma yoga is Earth\'s native language — devoted, steady action without attachment to outcome.',
    },
  };

  // Captions for when a quote scores via day master identity — "this tradition speaks to who you are"
  const WHY_CAPTIONS_IDENTITY = {
    water: {
      daoism:   'As Water, Daoism is your native language — the tradition that names what you already know.',
      sufi:     'Sufi depth speaks to Water\'s inner world: the boundless beneath the calm surface.',
      buddhism: 'Buddhism\'s teaching on flow and impermanence mirrors Water\'s experience of the world.',
    },
    wood: {
      buddhism:     'Wood\'s upward nature meets its reflection in Buddhism — conscious growth toward light.',
      confucianism: 'Confucian self-cultivation is Wood\'s process: growing into who you\'re meant to be.',
      vedic:        'The Vedic tradition speaks to Wood\'s dharma — the purposeful path, lived fully.',
    },
    fire: {
      stoicism:     'Fire\'s intensity finds form in Stoicism — warmth without burning, passion with discipline.',
      greek:        'Fire asks Greek philosophy\'s central question: how to live the good life, fully lit.',
      christianity: 'The Christian tradition speaks Fire\'s language — love as transformative force.',
    },
    earth: {
      confucianism: 'Earth\'s stability finds its highest expression in Confucian virtue — rootedness as gift.',
      judaism:      'Jewish wisdom speaks to Earth\'s deepest knowing: reliable presence is its own power.',
      vedic:        'Earth finds its path in the Vedic tradition — steady, grounded, devoted action.',
    },
    metal: {
      chinese:  'Metal\'s discernment meets the I Ching: precision in reading what each moment requires.',
      stoicism: 'Stoicism speaks Metal\'s language — cut away what doesn\'t serve, refine what remains.',
      islam:    'Islamic discipline resonates with Metal\'s path of purification and exactness.',
    },
  };

  function curateForYou(vault, chart) {
    const nonSaved = vault.filter(x => x.tradition !== 'saved');
    if (!chart || !chart.elementBalance) return nonSaved.slice(0, 18);

    // Useful gods: primary signal — traditions aligned with what fortifies the chart
    const usefulGods = (chart.usefulGods || []).map(e => e.toLowerCase());
    const dmEl       = (chart.dayMasterEl || '').toLowerCase();

    // Current decade element: tertiary signal — what's active right now
    const currentDecade = (chart.daYun || []).find(d => d.isCurrent);
    const seasonEl      = currentDecade ? STEM_EL_NAME[currentDecade.stemIndex] : null;

    // Score each item: useful gods (+4 each), day master identity (+2), current decade (+1)
    const scored = nonSaved.map(item => {
      let score = 0;
      // Tier 1: useful gods — traditions that speak the language of what empowers you
      for (const el of usefulGods) {
        if (ELEMENT_TRADITION_AFFINITY[el]?.includes(item.tradition)) score += 4;
      }
      // Tier 2: day master identity resonance — traditions that speak to who you ARE
      if (ELEMENT_TRADITION_AFFINITY[dmEl]?.includes(item.tradition)) score += 2;
      // Tier 3: current decade element — what's active and alive right now
      if (seasonEl && ELEMENT_TRADITION_AFFINITY[seasonEl]?.includes(item.tradition)) score += 1;

      // Determine caption: first useful-god match gives the reason; fall back to DM identity
      let why = null;
      for (const el of usefulGods) {
        if (ELEMENT_TRADITION_AFFINITY[el]?.includes(item.tradition)) {
          why = WHY_CAPTIONS_USEFUL[el]?.[item.tradition] || null;
          break; // first useful god match sets the tone
        }
      }
      if (!why && ELEMENT_TRADITION_AFFINITY[dmEl]?.includes(item.tradition)) {
        why = WHY_CAPTIONS_IDENTITY[dmEl]?.[item.tradition] || null;
      }

      return { ...item, _score: score, _why: why };
    }).sort((a, b) => b._score - a._score);

    // Shuffle within each score tier using a deterministic daily seed (stable across tab switches)
    const dailySeed = getDailySeed();
    const tiers = {};
    for (const item of scored) {
      (tiers[item._score] = tiers[item._score] || []).push(item);
    }
    const sortedByScore = [];
    for (const score of Object.keys(tiers).sort((a, b) => b - a)) {
      const shuffled = seededShuffle(tiers[score], dailySeed + Number(score));
      sortedByScore.push(...shuffled);
    }

    // Diversity cap: max 5 quotes per tradition so at least 2-3 traditions always appear
    const tradCount = {};
    const diverse   = [];
    for (const item of sortedByScore) {
      if ((tradCount[item.tradition] || 0) < 5) {
        tradCount[item.tradition] = (tradCount[item.tradition] || 0) + 1;
        diverse.push(item);
        if (diverse.length >= 18) break;
      }
    }
    return diverse;
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

    if (document.getElementById('wisdom-vault-list')) renderWisdomVault(vaultFilterType, vaultFilterValue);
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

  // ── Theme display names ──────────────────────────────────────────
  const THEME_LABELS = {
    healing:   'Healing & Renewal',
    courage:   'Courage & Strength',
    clarity:   'Clarity & Truth',
    love:      'Love & Belonging',
    purpose:   'Purpose & Calling',
    stillness: 'Stillness & Peace',
    resilience:'Resilience & Endurance',
    change:    'Change & Letting Go',
  };

  // ── Save / unsave classical vault quotes ─────────────────────────
  function _vaultKey(item) {
    return (item.source || '') + '|' + (item.text || '').slice(0, 60);
  }
  function isVaultQuoteSaved(item) {
    const key = _vaultKey(item);
    return (state.savedVaultCitations || []).some(a => a._vaultKey === key);
  }
  function saveVaultQuote(item) {
    if (isVaultQuoteSaved(item)) return;
    const citations = [...(state.savedVaultCitations || [])];
    citations.push({ ...item, tradition: 'saved', isCitation: true, _vaultKey: _vaultKey(item), _savedFrom: item.tradition, savedAt: Date.now() });
    state.savedVaultCitations = citations;
    saveCurrentProfile();
  }
  function unsaveVaultQuote(item) {
    const key = _vaultKey(item);
    state.savedVaultCitations = (state.savedVaultCitations || []).filter(a => a._vaultKey !== key);
    saveCurrentProfile();
  }

  // ── Vault current filter state ───────────────────────────────────
  let vaultFilterType  = 'theme';
  let vaultFilterValue = 'all';

  function renderWisdomVault(filterType, filterValue) {
    vaultFilterType  = filterType  || 'theme';
    vaultFilterValue = filterValue || 'all';

    const list  = document.getElementById('wisdom-vault-list');
    if (!list) return;
    const vault = getWisdomVault();
    let items;

    if (vaultFilterType === 'theme' && vaultFilterValue === 'all') {
      items = curateForYou(vault, state.chart || null);
    } else if (vaultFilterType === 'theme') {
      items = vault.filter(x => x.theme === vaultFilterValue && x.tradition !== 'saved');
    } else {
      // tradition filter (including 'saved')
      items = vault.filter(x => x.tradition === vaultFilterValue);
    }

    list.innerHTML = items.map((x, idx) => {
      // ── Saved Oracle responses ───────────────────────────────────
      if (x.tradition === 'saved' && !x.isCitation) {
        return `<div class="vault-card vault-card--oracle">
          <div class="vault-card-header">
            <span class="vault-badge vault-badge--tradition">saved</span>
          </div>
          <p class="vault-card-question">${escapeHtml(x.author || '')}</p>
          <div class="oracle-saved-body">${renderMarkdown(x.text)}</div>
        </div>`;
      }

      // ── Saved classical citations ────────────────────────────────
      const tradition = x.isCitation ? (x._savedFrom || 'saved') : x.tradition;
      const theme     = x.theme || '';
      const saved     = isVaultQuoteSaved(x);
      const whyHtml   = x._why ? `<div class="vault-why">${escapeHtml(x._why)}</div>` : '';
      const themeLabel = theme ? `<span class="vault-badge vault-badge--theme">${escapeHtml(t('THEME_LABELS')[theme] || theme)}</span>` : '';

      return `<div class="vault-card" data-vault-idx="${idx}" role="button" tabindex="0">
        <div class="vault-card-header">
          <span class="vault-badge vault-badge--tradition">${escapeHtml(tradition)}</span>
          ${themeLabel}
          <button class="vault-save-btn ${saved ? 'vault-save-btn--saved' : ''}" data-vault-idx="${idx}" aria-label="${saved ? 'Unsave quote' : 'Save quote'}" title="${saved ? 'Remove from saved' : 'Save quote'}">
            ${saved ? '&#9993;' : '&#9993;'}
          </button>
        </div>
        <p class="vault-card-text">${escapeHtml(vaultQuoteText(x))}</p>
        <div class="vault-card-source">${escapeHtml(x.source)}${x.author ? ' — ' + escapeHtml(x.author) : ''}</div>
        ${whyHtml}
      </div>`;
    }).join('') || `<p class="vault-empty">No entries yet in this category.</p>`;

    // store rendered items for modal access
    list._vaultItems = items;

    // wire up card clicks → modal
    list.querySelectorAll('.vault-card[data-vault-idx]').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.vault-save-btn')) return; // don't open modal on save btn click
        const idx = parseInt(card.dataset.vaultIdx, 10);
        openVaultModal(items[idx]);
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });

    // wire up save buttons
    list.querySelectorAll('.vault-save-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx  = parseInt(btn.dataset.vaultIdx, 10);
        const item = items[idx];
        if (isVaultQuoteSaved(item)) {
          unsaveVaultQuote(item);
          btn.classList.remove('vault-save-btn--saved');
          btn.setAttribute('aria-label', 'Save quote');
          btn.setAttribute('title', 'Save quote');
        } else {
          saveVaultQuote(item);
          btn.classList.add('vault-save-btn--saved');
          btn.setAttribute('aria-label', 'Remove from saved');
          btn.setAttribute('title', 'Remove from saved');
          // brief pulse animation
          btn.classList.add('vault-save-btn--pulse');
          setTimeout(() => btn.classList.remove('vault-save-btn--pulse'), 400);
        }
      });
    });
  }

  // ── Modal ────────────────────────────────────────────────────────
  let _modalItem = null;

  function openVaultModal(item) {
    haptic('light');
    trackEvent('vault_card_opened', { tradition: item.tradition || 'saved' });
    _modalItem = item;
    const modal     = document.getElementById('vault-modal');
    const tradition = item.isCitation ? (item._savedFrom || 'saved') : (item.tradition || '');
    const theme     = item.theme || '';

    document.getElementById('vm-tradition').textContent = tradition;
    document.getElementById('vm-theme').textContent     = t('THEME_LABELS')[theme] || theme;
    document.getElementById('vm-quote').textContent     = vaultQuoteText(item);
    document.getElementById('vm-source').textContent    = (item.source || '') + (item.author ? ' — ' + item.author : '');

    const whyEl = document.getElementById('vm-why');
    if (item._why) { whyEl.textContent = item._why; whyEl.hidden = false; }
    else           { whyEl.textContent = ''; whyEl.hidden = true; }

    // Sync save button state
    const saveBtn = document.getElementById('vm-save');
    _updateModalSaveBtn(saveBtn, item);

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.vault-modal-close').focus();
  }

  function closeVaultModal() {
    const modal = document.getElementById('vault-modal');
    if (modal.hidden) return;
    if (modal.classList.contains('vault-modal-overlay--closing')) return;

    modal.classList.add('vault-modal-overlay--closing');
    modal.addEventListener('animationend', function handler(e) {
      if (e.target !== modal) return;   // ignore child card animation bubbling up
      modal.removeEventListener('animationend', handler);
      modal.classList.remove('vault-modal-overlay--closing');
      modal.hidden = true;
      document.body.style.overflow = '';
      _modalItem = null;
    });
  }

  function _updateModalSaveBtn(btn, item) {
    const saved = isVaultQuoteSaved(item);
    btn.textContent = saved ? '✓ Saved' : '🔖 Save';
    btn.classList.toggle('vault-modal-save--saved', saved);
  }

  function _setupSwipeDismiss(card, overlay) {
    let startY = 0, currentDY = 0, isDragging = false;

    card.addEventListener('touchstart', e => {
      if (card.scrollTop > 2) return;        // don't interfere when card is scrolled
      startY = e.touches[0].clientY;
      isDragging = true;
      currentDY = 0;
      card.style.animation = 'none';         // free transform from entry keyframe
    }, { passive: true });

    card.addEventListener('touchmove', e => {
      if (!isDragging) return;
      const dy = e.touches[0].clientY - startY;
      if (dy < 0) {                          // upward drag — hand back to scroll
        isDragging = false;
        card.style.transform = '';
        card.style.animation = '';
        overlay.style.opacity = '';
        return;
      }
      currentDY = dy;
      card.style.transform = `translateY(${dy}px)`;
      overlay.style.opacity = Math.max(0, 1 - dy / 200);
    }, { passive: true });

    card.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      if (currentDY > 80) {
        card.style.transform = '';
        card.style.animation = '';
        overlay.style.opacity = '';
        closeVaultModal();
      } else {
        // snap back with spring
        card.style.transition = `transform 0.4s var(--spring-bounce)`;
        card.style.transform = 'translateY(0)';
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.opacity = '1';
        card.addEventListener('transitionend', function cleanup() {
          card.removeEventListener('transitionend', cleanup);
          card.style.transition = '';
          card.style.transform = '';
          card.style.animation = '';
          overlay.style.transition = '';
          overlay.style.opacity = '';
        });
      }
    }, { passive: true });
  }

  function initVaultModal() {
    const modal   = document.getElementById('vault-modal');
    const closeBtn = document.getElementById('vault-modal') && document.querySelector('.vault-modal-close');
    if (!modal) return;

    modal.addEventListener('click', e => { if (e.target === modal) closeVaultModal(); });
    document.querySelector('.vault-modal-close').addEventListener('click', closeVaultModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeVaultModal(); });

    document.getElementById('vm-save').addEventListener('click', () => {
      if (!_modalItem) return;
      haptic('medium');
      if (isVaultQuoteSaved(_modalItem)) unsaveVaultQuote(_modalItem);
      else saveVaultQuote(_modalItem);
      _updateModalSaveBtn(document.getElementById('vm-save'), _modalItem);
      // refresh save button in card list
      renderWisdomVault(vaultFilterType, vaultFilterValue);
    });

    document.getElementById('vm-copy').addEventListener('click', () => {
      if (!_modalItem) return;
      const text = `"${vaultQuoteText(_modalItem)}" — ${_modalItem.source || ''}`;
      navigator.clipboard.writeText(text).catch(() => {});
      const btn = document.getElementById('vm-copy');
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });

    _setupSwipeDismiss(modal.querySelector('.vault-modal-card'), modal);
  }

  // ─── Vault filter pill data ───────────────────────────────────────
  const VAULT_THEME_PILLS = [
    { value: 'healing',    label: 'Healing' },
    { value: 'courage',    label: 'Courage' },
    { value: 'clarity',    label: 'Clarity' },
    { value: 'love',       label: 'Love' },
    { value: 'purpose',    label: 'Purpose' },
    { value: 'stillness',  label: 'Stillness' },
    { value: 'resilience', label: 'Resilience' },
    { value: 'change',     label: 'Change' },
  ];
  const VAULT_TRADITION_PILLS = [
    { value: 'daoism',       label: 'Daoism' },
    { value: 'buddhism',     label: 'Buddhism' },
    { value: 'stoicism',     label: 'Stoicism' },
    { value: 'christianity', label: 'Christianity' },
    { value: 'judaism',      label: 'Judaism' },
    { value: 'islam',        label: 'Islam' },
    { value: 'confucianism', label: 'Confucianism' },
    { value: 'sufi',         label: 'Sufi' },
    { value: 'greek',        label: 'Greek' },
    { value: 'vedic',        label: 'Vedic' },
    { value: 'chinese',      label: 'I Ching' },
    { value: 'saved',        label: 'Saved' },
  ];

  function renderVaultPills(container, pills, filterType, activeValue) {
    container.innerHTML = pills.map(p =>
      `<button class="vault-filter-btn${p.value === activeValue ? ' active' : ''}"
        data-filter-type="${filterType}" data-filter-value="${p.value}"
        type="button">${p.label}</button>`
    ).join('');
  }

  function initWisdomVault() {
    renderWisdomVault('theme', 'all');
    initVaultModal();

    const segControl = document.getElementById('vault-seg-control');
    const pillsWrap  = document.getElementById('vault-filter-pills');
    if (!segControl || !pillsWrap) return;

    // Segmented tab switching
    segControl.addEventListener('click', function(e) {
      const btn = e.target.closest('.vault-seg-btn');
      if (!btn) return;
      segControl.querySelectorAll('.vault-seg-btn').forEach(b => b.classList.remove('vault-seg-btn--active'));
      btn.classList.add('vault-seg-btn--active');
      haptic('light');
      const seg = btn.dataset.seg;
      trackEvent('vault_filter_changed', { segment: seg });
      if (seg === 'foryou') {
        pillsWrap.hidden = true;
        pillsWrap.innerHTML = '';
        renderWisdomVault('theme', 'all');
      } else if (seg === 'theme') {
        pillsWrap.hidden = false;
        var themePills = t('VAULT_THEME_PILLS');
        renderVaultPills(pillsWrap, themePills, 'theme', themePills[0].value);
        renderWisdomVault('theme', themePills[0].value);
      } else if (seg === 'tradition') {
        pillsWrap.hidden = false;
        var tradPills = t('VAULT_TRADITION_PILLS');
        renderVaultPills(pillsWrap, tradPills, 'tradition', tradPills[0].value);
        renderWisdomVault('tradition', tradPills[0].value);
      }
    });

    // Event delegation for dynamically injected pills
    pillsWrap.addEventListener('click', function(e) {
      const btn = e.target.closest('.vault-filter-btn');
      if (!btn) return;
      pillsWrap.querySelectorAll('.vault-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      haptic('light');
      renderWisdomVault(btn.dataset.filterType, btn.dataset.filterValue);
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
    const today  = new Date();
    const seed   = today.getDate() + today.getMonth() * 31;
    const vault  = getWisdomVault();

    // ── Day-matched BaZi personalization ─────────────────────────
    const todayDay    = getTodayBaZiDay();
    const todayStemEl = STEM_EL_NAME[todayDay.stemIdx];
    const stemChar    = STEMS[todayDay.stemIdx];
    const branchChar  = BRANCHES[todayDay.branchIdx];
    const pillarStr   = stemChar + branchChar;

    // Date line: "Mon Feb 26 2026 · 丙午"
    document.getElementById('spark-date').textContent = today.toDateString() + ' · ' + pillarStr;

    // Day affinity text — behavioral, no element names surfaced to user
    const DAY_AFFINITY_TEXT = {
      wood:  { favor:   'An expansive day. Good for reaching out, starting new threads, making contact.',
               counter: 'The day\'s growing energy runs against your grain. Consolidate more than you reach today.',
               neutral: 'A moderate, forward-moving day. Incremental progress lands well.' },
      fire:  { favor:   'High-charged energy today. Bold moves and direct expression land well.',
               counter: 'Intense energy today that works against your natural mode. Channel it into output, not friction.',
               neutral: 'Warm energy. Steady, expressive movement forward.' },
      earth: { favor:   'A grounding day. Good for consolidating, organizing, and building steadily.',
               counter: 'The day favors staying put in ways that feel constraining. Work with the slower pace.',
               neutral: 'A methodical day. Careful, detailed work suits this energy.' },
      metal: { favor:   'A clarifying day. Good for finishing, deciding, and making precise moves.',
               counter: 'Cutting energy today that works against your rhythm. Better to observe than to close.',
               neutral: 'A day for discernment. Precision over force.' },
      water: { favor:   'A deep, receptive day. Good for reflection, research, letting understanding settle.',
               counter: 'Still, inward energy that runs counter to what you need. Conserve rather than push.',
               neutral: 'A quieter day. Trust what surfaces in stillness.' },
    };

    // Affinity line — only if chart is loaded
    const affinityEl = document.getElementById('spark-affinity');
    if (affinityEl) {
      if (state.chart && todayStemEl) {
        const useful  = state.chart.usefulGods  || [];
        const harmful = state.chart.harmfulGods || [];
        const dayTexts = DAY_AFFINITY_TEXT[todayStemEl];
        let msg = '';
        if (dayTexts) {
          const quality = useful.includes(todayStemEl) ? 'favor'
                        : harmful.includes(todayStemEl) ? 'counter'
                        : 'neutral';
          msg = dayTexts[quality];
        }
        if (msg) {
          affinityEl.textContent = msg;
          affinityEl.style.display = '';
        } else {
          affinityEl.style.display = 'none';
        }
      } else {
        affinityEl.style.display = 'none';
      }
    }

    // Quote: prefer tradition matched to today's stem element; fall back to seed
    let q = null;
    if (todayStemEl) {
      const targetTradition = ELEMENT_TRADITION[todayStemEl];
      const matched = vault.filter(e => e.tradition === targetTradition);
      if (matched.length > 0) q = matched[seed % matched.length];
    }
    if (!q) q = vault[seed % vault.length];

    document.getElementById('spark-text').innerHTML =
      `<strong>${q.source}${q.author ? ' — ' + q.author : ''}</strong>` +
      `<p style="margin-top:0.5rem;opacity:0.85">${vaultQuoteText(q)}</p>`;
    var prompts   = t('SPARK_PROMPTS');
    var practices = t('SPARK_PRACTICES');
    document.getElementById('spark-prompt').textContent   = prompts[seed % prompts.length];
    document.getElementById('spark-practice').textContent = practices[seed % practices.length];
    try {
      const saved = localStorage.getItem('soulmap_streak');
      if (saved) state.streak = parseInt(saved, 10);
      document.getElementById('spark-streak').textContent = t('spark_streak').replace('{n}', state.streak);
    } catch (_) {}
    document.getElementById('btn-spark-done').addEventListener('click', () => {
      haptic('medium');
      trackEvent('spark_completed');
      state.streak++;
      try { localStorage.setItem('soulmap_streak', String(state.streak)); } catch (_) {}
      document.getElementById('spark-streak').textContent = t('spark_streak').replace('{n}', state.streak);
      document.getElementById('btn-spark-done').textContent = t('spark_done_complete');
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
    document.getElementById('meditation-list').innerHTML = t('MEDITATIONS').map(m =>
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

  // ─── Reading Sheet ────────────────────────────────────────────────
  function initReadingSheet() {
    const overlay  = document.getElementById('reading-sheet-overlay');
    const card     = document.getElementById('reading-card');
    const closeBtn = document.getElementById('btn-close-reading-sheet');
    if (!overlay || !card) return;

    function open() {
      haptic('light');
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
    }

    function close() {
      overlay.classList.add('reading-sheet-overlay--closing');
      overlay.addEventListener('animationend', () => {
        overlay.classList.remove('reading-sheet-overlay--closing');
        overlay.hidden = true;
        document.body.style.overflow = '';
      }, { once: true });
    }

    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    closeBtn?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
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
        if (initOnboard._reset) initOnboard._reset(); // always start at Step 1
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
    set('email',       state.email || '');
  }

  // ─── BaZi Glossary ────────────────────────────────────────────
  const GLOSSARY = {
    'four-pillars':     { cn: '四柱',   en: 'Four Pillars',          body: 'Your Four Pillars are the core of a BaZi chart — four units of time (Year, Month, Day, Hour), each with a Heavenly Stem and Earthly Branch. Together they form your eight characters (八字). Ancient scholars believed this blueprint encodes your elemental nature, relationships, timing, and life path.' },
    'day-master':       { cn: '日主',   en: 'Day Master',             body: 'Your Day Master is the Heavenly Stem of your Day Pillar — it represents you. It describes your fundamental nature: how you think, feel, and engage with the world. All other elements in your chart are interpreted in relation to how they support, challenge, or transform your Day Master.' },
    'ten-gods':         { cn: '十神',   en: 'Ten Gods',               body: 'The Ten Gods describe how every other element in your chart relates to your Day Master. Each of the ten relationships — Companion, Rob Wealth, Eating God, Hurting Officer, Indirect/Direct Wealth, Seven Killings, Direct Officer, Indirect/Direct Resource — carries its own theme around creativity, power, money, or relationships.' },
    'heavenly-stems':   { cn: '天干',   en: 'Heavenly Stems',         body: 'Heavenly Stems are the ten primary energies of BaZi — the Yang and Yin expressions of each of the five elements (Wood, Fire, Earth, Metal, Water). They appear at the top of each pillar, representing the visible and active surface of that period\'s energy. Your Day Stem is your Day Master — the most personal of all.' },
    'earthly-branches': { cn: '地支',   en: 'Earthly Branches',       body: 'Earthly Branches are the twelve cyclical phases of time, corresponding to the twelve zodiac animals. They hold complex energy packages including primary and hidden stems, encoding how elemental energy matures, peaks, and transforms. Branches reveal the deeper, more hidden aspects of each pillar.' },
    'hidden-stems':     { cn: '藏干',   en: 'Hidden Stems',           body: 'Hidden Stems are the sub-elements concealed within each Earthly Branch. While the Branch shows one visible energy, these hidden roots reveal additional layers — secondary motivations or latent talents. Some BaZi masters consider hidden stems the most important part of the chart, because they describe what\'s actually driving your visible personality.' },
    'sub-stars':        { cn: '副星',   en: 'Sub Stars',              body: 'Sub Stars apply the Ten God framework to the Hidden Stems within each Branch. They represent secondary energetic themes — less obvious than your main Ten Gods but still active. Sub Stars often reveal talents or patterns that emerge in close relationships or under specific life pressures.' },
    'growth-stage':     { cn: '星运',   en: 'Twelve Growth Stages',   body: 'The Twelve Growth Stages describe the life cycle of elemental energy — from birth through growth, peak, decline, and rest. Applied to your pillars, they reveal whether each element in your chart is flourishing or receding. A strong stage means that energy is readily available to you; a weak stage means it operates quietly in the background.' },
    'self-seat':        { cn: '自坐',   en: 'Self-Seat',              body: 'Self-Seat applies the Twelve Growth Stages to your Day Master specifically — showing how your core element sits within each Branch in your chart. A strong self-seat means that pillar\'s period feels natural and energizing for you. A weak self-seat can indicate a chapter where you\'re working against your grain.' },
    'void-emptiness':   { cn: '空亡',   en: 'Void / Empty',           body: 'Void marks certain Branches as "empty" relative to a given pair of Stems. When a pillar falls in void, its energy is weakened — like potential that doesn\'t fully manifest. Voids often indicate areas where effort slips away or takes longer to materialize. Some masters read them as spiritual openings: less worldly attachment, more inner clarity.' },
    'nayin':            { cn: '纳音',   en: 'Nayin',                  body: 'Nayin is an ancient layer of BaZi that assigns each stem-branch pair a material metaphor — like "Sea Gold," "Thunder Fire," or "Mountain Head Earth." These 30 archetypes describe the deeper resonance of a period, showing how cosmic energy interacts with the physical world. Nayin was more central in classical texts and adds texture to timing interpretations.' },
    'spirit-killers':   { cn: '神煞',   en: 'Spirit Stars',           body: 'Spirit Stars are special markers derived from combinations of stems and branches. They carry archetypal meanings: 天乙贵人 (Heavenly Noble) signals divine protection and helpful people, 桃花 (Peach Blossom) marks romantic magnetism, 驿马 (Traveling Horse) signals movement and career change. These stars amplify certain energies and events within your chart.' },
    'life-seasons':     { cn: '大运',   en: 'Life Seasons',           body: 'Life Seasons are 10-year periods of luck energy that overlay your natal chart like changing weather. Each decade activates a new stem and branch, shifting which elements are energized in your life and what themes come forward. Unlike your fixed natal chart, the Life Seasons show how your chart evolves as you move through different chapters.' },
    'annual-arc':       { cn: '流年',   en: 'Annual Arc',             body: 'The Annual Arc shows the current year\'s stem and branch energy overlaid onto your chart. Each calendar year brings a specific elemental flavor that interacts with your natal chart and current Life Season. Your four domain scores (Wealth, Career, Love, Health) show where this year\'s energy is most harmonious or challenging for your particular chart.' },
    'element-balance':  { cn: '五行',   en: 'Five Element Balance',   body: 'Your element balance shows how much Wood, Fire, Earth, Metal, and Water appear across your four pillars. Because your Day Master has a specific element, some elements nourish it while others drain or control it. The balance reveals which energies are naturally strong in your life — and which ones trigger growth or challenge when they appear in timing cycles.' },
    'soul-type':        { cn: '日主原型', en: 'Soul Type',            body: 'Your Soul Type translates your Day Master element into a living archetype with its own name and story. Each of the ten Day Masters has a signature way of engaging with the world — for example, Yang Wood is "The Architect," direct in growth and vision, while Yin Water is "The Mystic," fluid and introspective. Your Soul Type is the most accessible translation of your core energetic identity.' },
    'dominant-archetype':{ cn: '主星原型', en: 'Dominant Archetype',  body: 'Your Dominant Archetype is the Ten God that appears most powerfully in your chart. While you have all ten relationships in some form, the dominant one shapes how you naturally operate — it\'s the energetic role you step into most comfortably. A dominant Direct Officer type tends toward structure and responsibility; a dominant Eating God type is driven by creativity and self-expression.' },
    'zodiac':            { cn: '西方星座', en: 'Western Zodiac',       body: 'Your Western zodiac sign is determined by the position of the Sun at the moment of your birth. While BaZi uses the Chinese lunar calendar and elemental cycles, your Sun sign adds a complementary lens — describing how your core identity radiates outward and how you tend to be seen by others.' },
  };

  function initGlossaryModal() {
    const modal    = document.getElementById('glossary-modal');
    if (!modal) return;
    const closeBtn = document.getElementById('glossary-modal-close');

    function open(termId) {
      const entry = GLOSSARY[termId];
      if (!entry) return;
      haptic('light');
      document.getElementById('gm-cn').textContent   = entry.cn;
      document.getElementById('gm-en').textContent   = entry.en;
      document.getElementById('gm-body').textContent = entry.body;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
    }

    function close() {
      modal.classList.add('vault-modal-overlay--closing');
      modal.addEventListener('animationend', () => {
        modal.classList.remove('vault-modal-overlay--closing');
        modal.hidden = true;
        document.body.style.overflow = '';
      }, { once: true });
    }

    // Delegated click — catches any [data-term] anywhere in the document
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-term]');
      if (el) { e.stopPropagation(); open(el.dataset.term); }
    });

    closeBtn?.addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
  }

  // ─── Generating View (Brand Splash + Loading Interstitial) ──────

  const SPLASH_PHRASES = [
    'Let humans be humans.',
    'Your life terrain could be mapped.',
    'We are here with different missions. What\u2019s yours?',
    'The oldest astrology that ever existed.',
    'Finally someone actually knows you.',
    '518,400 unique persona patterns \u2014 not 12, not 16.',
    'Help you find your passion and strength.',
    'This is what clarity looks like.',
  ];

  const LOADING_PHRASES = [
    'Let humans be humans.',
    'Your life terrain could be mapped.',
    'We are here with different missions. What\u2019s yours?',
    'The oldest astrology that ever existed.',
    'Finally someone actually knows you.',
    '518,400 unique persona patterns \u2014 not 12, not 16.',
    'Help you find your passion and strength.',
    'This is what clarity looks like.',
  ];

  function initGeneratingView() {
    let phraseTimer = null;
    let splashIdx   = 0;
    let loadingIdx  = 0;

    function retriggerAnim(el) {
      el.style.animation = 'none';
      void el.offsetWidth; // force reflow
      el.style.animation  = '';
    }

    function startSplash(name) {
      splashIdx = 0;
      const splashEl = document.getElementById('gen-splash');
      const loadEl   = document.getElementById('gen-loading');
      const ctaBtn   = document.getElementById('btn-gen-cta');
      if (!splashEl) return;
      splashEl.hidden = false;
      if (loadEl)  loadEl.hidden  = true;
      if (ctaBtn)  ctaBtn.hidden  = true;
      cycleSplash();
    }

    function cycleSplash() {
      clearTimeout(phraseTimer);
      const el     = document.getElementById('gen-splash-phrase');
      const ctaBtn = document.getElementById('btn-gen-cta');
      if (!el) return;
      retriggerAnim(el);
      var sp = t('SPLASH_PHRASES');
      el.textContent = sp[splashIdx % sp.length];
      splashIdx++;
      // After first phrase completes: reveal CTA, then keep cycling phrases
      if (splashIdx === 1) {
        phraseTimer = setTimeout(() => {
          if (ctaBtn) ctaBtn.hidden = false;
          phraseTimer = setTimeout(cycleSplash, 3500);
        }, 3500);
      } else {
        phraseTimer = setTimeout(cycleSplash, 3500);
      }
    }

    function startLoading(name) {
      clearTimeout(phraseTimer);
      loadingIdx = 0;
      const splashEl = document.getElementById('gen-splash');
      const loadEl   = document.getElementById('gen-loading');
      const forEl    = document.getElementById('generating-for');
      if (splashEl) splashEl.hidden = true;
      if (loadEl)   loadEl.hidden   = false;
      if (forEl)    forEl.textContent = name
        ? t('loading_for_name').replace('{name}', name)
        : t('loading_generic');
      cycleLoading();
    }

    function cycleLoading() {
      clearTimeout(phraseTimer);
      const el = document.getElementById('generating-phrase');
      if (!el) return;
      retriggerAnim(el);
      var lp = t('LOADING_PHRASES');
      el.textContent = lp[loadingIdx % lp.length];
      loadingIdx++;
      phraseTimer = setTimeout(cycleLoading, 2600);
    }

    function stop() { clearTimeout(phraseTimer); }

    return { startSplash, startLoading, stop };
  }

  const generatingView = initGeneratingView(); // module-level — must init before init()

  // ─── Init ────────────────────────────────────────────────────────
  // Defensive wrapper — one crashing module must not block all others
  function safeInit(fn) {
    try { fn(); } catch (e) { console.error('[init] ' + fn.name + ' failed:', e); }
  }

  function init() {
    initLangSwitcher();
    safeInit(initLanding);
    safeInit(initOnboard);
    safeInit(initTabs);
    safeInit(initOracle);
    safeInit(initWisdomVault);
    safeInit(initSpark);
    safeInit(initStillPoint);
    safeInit(initRefreshNarrative);
    safeInit(initProfileSwitcher);
    safeInit(initReadingSheet);
    safeInit(initGlossaryModal);

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
      // Auto-fetch narrative if missing (e.g. language changed since last session)
      if (state.chart && !state.narrativeFromAPI) {
        fetchNarrativeFromAPI(state.chart).then(narrative => {
          if (narrative) {
            setState({ narrativeFromAPI: narrative });
            saveCurrentProfile();
            updateNarrativeSection(narrative);
          }
        });
      }
    }
    // else: stay on view-landing (default)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
