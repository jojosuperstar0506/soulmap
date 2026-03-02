import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface CycleRequestBody {
  lang?: string;
  chart?: {
    dayMaster?: string;
    dayMasterEl?: string;
    strength?: string;
    usefulGods?: string[];
    harmfulGods?: string[];
    gender?: string;
    dayBranch?: string;
    monthBranch?: string;
  };
  cycle?: {
    pillar?: string;
    stemTenGod?: string;
    twelveStage?: string;
    ageRange?: string;
    years?: string;
    wealth?: number;
    love?: number;
    mind?: number;
    health?: number;
    interactions?: string[];
  };
}

const DAY_MASTER_METAPHORS: Record<string, string> = {
  '甲': 'Ancient Oak', '乙': 'Willow', '丙': 'Sun', '丁': 'Candlelight',
  '戊': 'Mountain', '己': 'Garden Soil', '庚': 'Sword', '辛': 'Gemstone',
  '壬': 'Ocean', '癸': 'Mist',
};

// Behavioral period character descriptions — used as internal context, never surfaced as labels
const PERIOD_CHARACTER: Record<string, string> = {
  mirror:     'a decade of peer-level energy — collaboration, comparison, and self-definition through others',
  shadow:     'a decade of bold, instinctive energy — fast moves, unconventional choices, and testing limits',
  muse:       'a creative and expressive decade — output flows, communication lands, and making things gains traction',
  maverick:   'an unconventional, pattern-breaking decade — what no longer fits becomes impossible to ignore',
  windfall:   'a decade of outward reach and opportunity — possibility arrives through unexpected doors',
  harvest:    'a decade where past effort compounds — patience pays, relationships become resources, and quiet work becomes visible',
  challenger: 'a decade of productive pressure — friction is formative, and resistance clarifies what you are actually made of',
  architect:  'a decade for earning formal authority — structure, consolidation, and recognition of what has been built',
  mystic:     'a quiet, receiving decade — depth increases, inner foundations are laid, and invisible growth accumulates',
  guardian:   'a decade of support and protection — mentors and allies are closer than usual, and receiving well is the work',
};

// Vitality level descriptors — used as internal context only
const VITALITY_LEVEL: Record<string, string> = {
  awakening:   'emerging and building — energy is fresh, directional, and ready to grow',
  initiation:  'raw and unrefined — intense but not yet focused, best channeled rather than held back',
  rising:      'growing and confident — capability is increasing, readiness is real',
  ascension:   'focused and strong — the body and will are aligned, peak readiness',
  zenith:      'at maximum — full presence, full output, nothing held in reserve',
  waning:      'stable but cooling — sustainable, steady, no excess to burn',
  retreat:     'reduced — conservation is wise; quality of effort matters more than quantity',
  stillness:   'very low — a quiet, restorative register; forcing output costs more than it returns',
  vault:       'latent — energy is stored below the surface, not absent; depth before motion',
  void:        'minimal — rest and receptivity, not force, is the correct response',
  conception:  'new seeds forming — the next chapter is taking shape in ways not yet visible',
  nurture:     'gentle recovery — conditions are being prepared, the ground is softening',
};

function buildCyclePrompt(body: CycleRequestBody): string {
  const langInstruction = body.lang === 'zh'
    ? '\n\nIMPORTANT: Respond entirely in Simplified Chinese (简体中文). All JSON field values must be in Chinese. Use natural, warm prose.'
    : '';
  const { chart = {}, cycle = {} } = body;
  const dmMetaphor     = DAY_MASTER_METAPHORS[chart.dayMaster || ''] || chart.dayMaster || 'unknown';
  const periodChar     = PERIOD_CHARACTER[cycle.stemTenGod || ''] || cycle.stemTenGod || '—';
  const vitalityDesc   = VITALITY_LEVEL[cycle.twelveStage || ''] || cycle.twelveStage || '—';
  const nourishing     = (chart.usefulGods || []).join(', ')  || 'none specified';
  const draining       = (chart.harmfulGods || []).join(', ') || 'none specified';
  const pressures      = (cycle.interactions || []).join('; ') || 'none';

  return `You are SoulMap's Life Season narrative engine. Your job is to write a personal, behaviorally grounded reading for one decade of this person's life. The chart data below is your private compass — your output must read like a wise friend speaking about their life, not a chart reader explaining their BaZi.

INTERNAL CONTEXT (use this to understand the decade — do NOT name these terms in your output):
- Person's nature metaphor: ${dmMetaphor}
- Body constitution: ${chart.strength || 'balanced'}
- Nourishing energies this period: ${nourishing}
- Draining energies this period: ${draining}
- Gender: ${chart.gender || 'not specified'}
- Relational energy in the chart: ${chart.dayBranch || '?'}

THIS DECADE (${cycle.ageRange || '?'}, ${cycle.years || '?'}):
- Period character: ${periodChar}
- Vitality level: ${vitalityDesc}
- Dynamic pressures active: ${pressures}

SCORES (calibrate tone — low = demanding, not terrible):
- Love: ${cycle.love ?? '?'}/100
- Wealth: ${cycle.wealth ?? '?'}/100
- Health: ${cycle.health ?? '?'}/100
- Mind: ${cycle.mind ?? '?'}/100

INSTRUCTIONS:
Generate a JSON object with EXACTLY these fields. Be concise — short sentences land harder than long ones.

{
  "seasonName": A 2-4 word poetic name for this decade that captures its felt quality (e.g. "The Quiet Decade", "The Building Years", "The Pressure Season") — do NOT use any BaZi term names,
  "theme": One sentence, max 12 words. What is this decade fundamentally asking for or offering?,
  "summary": 2-3 sentences. Describe the decade's quality behaviorally — what kind of energy is available, what it tends to ask for, what it naturally builds toward. Warm and direct. You may use the person's nature metaphor (${dmMetaphor}) once if it fits naturally.,
  "wealthNote": 1-2 sentences. How do money and professional momentum move this decade — steady income, creative opportunity, speculative gains, career recognition, or consolidation? Calibrate to the score (${cycle.wealth ?? '?'}/100).,
  "relationshipsNote": 1-2 sentences. What is the quality of connection and intimacy this decade? What does love ask for or offer? Calibrate to the score (${cycle.love ?? '?'}/100).,
  "healthNote": 1-2 sentences. What is the vitality quality and what does the body need? Calibrate to the score (${cycle.health ?? '?'}/100).,
  "mentalNote": 1-2 sentences. What is the inner weather this decade — clarity, restlessness, peace, pressure, expansion, contraction? What does the mind need? Calibrate to the score (${cycle.mind ?? '?'}/100).,
  "lifeLessonThisSeason": 1 sentence. What does life keep teaching through this configuration?,
  "growthEdge": 1 sentence. Where is the useful discomfort?,
  "shadowWork": 1 sentence. What unconscious pattern tends to surface this decade?
}

STRICT OUTPUT RULES — these apply to every word you write:
- Do NOT use: Day Master, Ten God, stem, branch, twelve-stage, pillar, element balance, harmful elements, useful elements, marriage palace, spouse star, or any Chinese characters
- Do NOT name any BaZi archetype labels (no "Mystic", "Guardian", "Harvest star", "Challenger", etc.) — describe the quality without naming the system
- The chart data is your compass; your words are for living, not for explaining a chart
- Keep each section to the sentence count specified — brevity is the point

Return ONLY the JSON object, no other text.` + langInstruction;
}

export async function POST(req: NextRequest) {
  try {
    const body: CycleRequestBody = await req.json();

    const userMessage = buildCyclePrompt(body);

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 900,
      messages:   [{ role: 'user', content: userMessage }],
    });

    const textBlock = message.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text in model response' }, { status: 500 });
    }

    const raw   = textBlock.text.trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('[cycle-narrative] No JSON in response:', raw.slice(0, 300));
      return NextResponse.json({ error: 'Model did not return JSON' }, { status: 500 });
    }

    const narrative = JSON.parse(match[0]);

    // Validate minimum required fields
    if (!narrative.theme || !narrative.summary) {
      return NextResponse.json({ error: 'Incomplete narrative from model' }, { status: 500 });
    }

    return NextResponse.json(narrative);

  } catch (err: unknown) {
    console.error('[cycle-narrative] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
