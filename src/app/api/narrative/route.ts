import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Read the system prompt once at module load time */
function getSystemPrompt(): string {
  try {
    const promptPath = path.join(process.cwd(), 'src', 'content', 'soul-system-prompt.md');
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (e) {
    console.error('[narrative] Could not read system prompt:', e);
    return 'You are SoulMap, a BaZi (Eight Characters) life blueprint interpreter. Answer with warmth, depth, and grounding in classical Chinese metaphysics.';
  }
}

interface NarrativeRequestBody {
  dayMaster?: string;
  dayMasterMetaphor?: string;
  pillarsStr?: string;
  elementBalance?: string;
  dayMasterStrength?: string;
  favorableElements?: string[];
  soulType?: string;
  soulTypeTagline?: string;
  luckPillarStr?: string;
  annualPillarStr?: string;
  occupation?: string;
  relationship?: string;
  currentConcern?: string;
  dayMasterStemIdx?: number;
}

function buildUserMessage(body: NarrativeRequestBody): string {
  const fav = (body.favorableElements || []).join(', ') || 'not specified';
  const lines = [
    'Generate a BaZi blueprint narrative for this person.',
    '',
    `Day Master: ${body.dayMaster || 'unknown'} — known as the ${body.dayMasterMetaphor || ''}`,
    `Day Master Strength: ${body.dayMasterStrength || 'Moderate'}`,
    `Four Pillars: ${body.pillarsStr || 'not provided'}`,
    `Element Balance: ${body.elementBalance || 'not provided'}`,
    `Favorable Elements: ${fav}`,
    `Soul Type: ${body.soulType || 'not provided'} — ${body.soulTypeTagline || ''}`,
    `Current Life Season (大运): ${body.luckPillarStr || 'not available'}`,
    `Current Year Energy (流年): ${body.annualPillarStr || 'not available'}`,
    `Occupation: ${body.occupation || 'not specified'}`,
    `Relationship Status: ${body.relationship || 'not specified'}`,
    `Current Concern: ${body.currentConcern || 'not specified'}`,
    '',
    'Return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with exactly these fields:',
    '{',
    '  "coreEssence": "Three paragraphs. ¶1: open with their elemental metaphor name (Ancient Oak / Mist / Sword etc) as the first thing named — describe their Day Master as lived experience, not a label. ¶2: what makes THIS chart unique — reference exact element balance percentages and the tension between them. ¶3: how this shapes daily life texture.",',
    '  "season": "2–3 sentences on their current 大运 luck pillar. What elemental energy dominates this decade? What is being activated, tested, or gifted right now?",',
    '  "work": "3–4 sentences. Must reference the current life season and how it interacts with their career path. Use actual element percentages. End with a concrete implication.",',
    '  "love": "3–4 sentences. Reference current life season if relevant. What does their Day Master feel like to partners? What pattern do they keep repeating?",',
    '  "growth": "3–4 sentences. Reference current year energy (流年) if relevant. What is this configuration teaching them?",',
    '  "classicalQuote": "OPTIONAL — include ONLY if a classical passage fits naturally. Paraphrase, do not fabricate a direct quote.",',
    '  "classicalSource": "OPTIONAL — only if classicalQuote present."',
    '}',
    '',
    'SPECIFICITY MANDATE: Before finalizing, test each sentence: could it apply word-for-word to any person of this Day Master type? If yes, rewrite it — anchor it to specific percentages, the current luck pillar, or a specific pillar combination.',
    '',
    'Classical sources to prefer (when they fit the day master): 《滴天髓》《穷通宝鉴》《子平真诠》《三命通会》《渊海子平》《神峰通考》《千里命稿》',
  ];
  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const body: NarrativeRequestBody = await req.json();

    const systemPrompt = getSystemPrompt();
    const userMessage  = buildUserMessage(body);

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2000,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    });

    // Extract text content
    const textBlock = message.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text in model response' }, { status: 500 });
    }

    // Parse JSON — handle potential markdown code fences
    const raw   = textBlock.text.trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('[narrative] Could not find JSON in response:', raw.slice(0, 200));
      return NextResponse.json({ error: 'Model did not return JSON' }, { status: 500 });
    }

    const narrative = JSON.parse(match[0]);

    // Validate required fields
    if (!narrative.coreEssence || !narrative.work || !narrative.love || !narrative.growth || !narrative.season) {
      return NextResponse.json({ error: 'Incomplete narrative from model' }, { status: 500 });
    }

    return NextResponse.json(narrative);

  } catch (err: unknown) {
    console.error('[narrative] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
