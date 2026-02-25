import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic();

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
  pillarsStr?: string;
  elementBalance?: string;
  dayMasterStrength?: string;
  favorableElements?: string[];
  soulType?: string;
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
    `Day Master: ${body.dayMaster || 'unknown'}`,
    `Day Master Strength: ${body.dayMasterStrength || 'Moderate'}`,
    `Four Pillars: ${body.pillarsStr || 'not provided'}`,
    `Element Balance: ${body.elementBalance || 'not provided'}`,
    `Favorable Elements: ${fav}`,
    `Soul Type: ${body.soulType || 'not provided'}`,
    `Occupation: ${body.occupation || 'not specified'}`,
    `Relationship Status: ${body.relationship || 'not specified'}`,
    `Current Concern: ${body.currentConcern || 'not specified'}`,
    '',
    'Return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with exactly these fields:',
    '{',
    '  "coreEssence": "One rich paragraph describing who they are — their day master energy, soul type, and how their element balance shapes their nature.",',
    '  "classicalQuote": "One short excerpt or well-known paraphrase from a classical 八字 text in English. Should directly relate to their day master or dominant element.",',
    '  "classicalSource": "Source attribution e.g. 《滴天髓》 (Ditian Sui). Omit if uncertain.",',
    '  "work": "1–2 sentences on career and work energy for this chart.",',
    '  "love": "1–2 sentences on relationships and connection for this chart.",',
    '  "growth": "1–2 sentences on the core personal growth edge for this chart."',
    '}',
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
      model:      'claude-sonnet-4-5',
      max_tokens: 1200,
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
    if (!narrative.coreEssence || !narrative.work || !narrative.love || !narrative.growth) {
      return NextResponse.json({ error: 'Incomplete narrative from model' }, { status: 500 });
    }

    return NextResponse.json(narrative);

  } catch (err: unknown) {
    console.error('[narrative] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
