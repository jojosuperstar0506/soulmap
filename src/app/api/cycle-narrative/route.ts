import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface CycleRequestBody {
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
    career?: number;
    health?: number;
    interactions?: string[];
  };
}

const DAY_MASTER_METAPHORS: Record<string, string> = {
  '甲': 'Ancient Oak', '乙': 'Willow', '丙': 'Sun', '丁': 'Candlelight',
  '戊': 'Mountain', '己': 'Garden Soil', '庚': 'Sword', '辛': 'Gemstone',
  '壬': 'Ocean', '癸': 'Mist',
};

const TEN_GOD_NAMES: Record<string, string> = {
  mirror: 'Mirror (比肩)', shadow: 'Shadow (劫财)', muse: 'Muse (食神)',
  maverick: 'Maverick (伤官)', windfall: 'Windfall (偏财)', harvest: 'Harvest (正财)',
  challenger: 'Challenger (七杀)', architect: 'Architect (正官)',
  mystic: 'Mystic (偏印)', guardian: 'Guardian (正印)',
};

const STAGE_LABELS: Record<string, string> = {
  awakening: 'Awakening (长生)', initiation: 'Initiation (沐浴)',
  rising: 'Rising (冠带)', ascension: 'Ascension (临官)',
  zenith: 'Zenith (帝旺)', waning: 'Waning (衰)',
  retreat: 'Retreat (病)', stillness: 'Stillness (死)',
  vault: 'Vault (墓)', void: 'Void (绝)',
  conception: 'Conception (胎)', nurture: 'Nurture (养)',
};

function buildCyclePrompt(body: CycleRequestBody): string {
  const { chart = {}, cycle = {} } = body;
  const dmMetaphor = DAY_MASTER_METAPHORS[chart.dayMaster || ''] || chart.dayMaster || 'unknown';
  const tenGodLabel = TEN_GOD_NAMES[cycle.stemTenGod || ''] || cycle.stemTenGod || '—';
  const stageLabel  = STAGE_LABELS[cycle.twelveStage || ''] || cycle.twelveStage || '—';
  const useful  = (chart.usefulGods || []).join(', ')  || 'none specified';
  const harmful = (chart.harmfulGods || []).join(', ') || 'none specified';
  const ints    = (cycle.interactions || []).join('; ') || 'none';

  return `You are SoulMap's Life Season narrative engine. Generate a rich, personal reading for ONE decade of this person's life.

PERSON:
- Day Master: ${chart.dayMaster || '?'} (${dmMetaphor})
- Body strength: ${chart.strength || 'balanced'}
- Useful elements: ${useful}
- Harmful elements: ${harmful}
- Gender: ${chart.gender || 'not specified'}
- Day Branch (marriage palace): ${chart.dayBranch || '?'}

THIS LIFE SEASON: ${cycle.pillar || '?'}
- Age range: ${cycle.ageRange || '?'} (${cycle.years || '?'})
- Stem Ten God: ${tenGodLabel}
- Twelve-Stage vitality: ${stageLabel}
- Branch interactions with natal chart: ${ints}

COMPUTED SCORES (0-100):
- Love: ${cycle.love ?? '?'}/100
- Wealth: ${cycle.wealth ?? '?'}/100
- Career: ${cycle.career ?? '?'}/100
- Health: ${cycle.health ?? '?'}/100

INSTRUCTIONS:
Generate a JSON object with EXACTLY these fields:
{
  "seasonName": "The [TenGod] Season" using the English Ten God name,
  "theme": one compelling sentence (max 10 words) capturing this decade's essence,
  "summary": 3-5 sentence paragraph. Be vivid and personal. Reference specific elements by English name (Ancient Oak, Mist, Guardian, etc.). Explain how the stem energy, branch energy, and twelve-stage position combine to create this decade's feel. Speak warmly to the person.,
  "wealthNote": 3-4 sentences. Be specific about wealth type (steady/sporadic/strained) and WHY based on the Ten God. Reference body strength and whether the Day Master can hold wealth.,
  "relationshipsNote": 3-4 sentences. Reference the day branch (marriage palace) and any interactions. Mention gender-specific spouse star if relevant.,
  "healthNote": 3-4 sentences. Lead with the Twelve-Stage position. Explain what it means for vitality. Name which domain gets pressure based on element imbalances.,
  "lifeLessonThisSeason": 1-2 sentences. What is the universe teaching through this configuration?,
  "growthEdge": 1-2 sentences. Where is the discomfort that produces growth?,
  "shadowWork": 1-2 sentences. What unconscious pattern surfaces this decade?
}

TONE: Warm, direct, insightful — like a wise friend. Never catastrophize. If scores are low, frame as "demanding" not "terrible." Always point toward what this season builds for the future.

Return ONLY the JSON object, no other text.`;
}

export async function POST(req: NextRequest) {
  try {
    const body: CycleRequestBody = await req.json();

    const userMessage = buildCyclePrompt(body);

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1500,
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
