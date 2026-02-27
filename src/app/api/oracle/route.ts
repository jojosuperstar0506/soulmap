import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getSystemPrompt(): string {
  try {
    const promptPath = path.join(process.cwd(), 'src', 'content', 'soul-system-prompt.md');
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (e) {
    console.error('[oracle] Could not read system prompt:', e);
    return 'You are SoulMap, a BaZi (Eight Characters) life blueprint interpreter. Answer with warmth, depth, and grounding in classical Chinese metaphysics.';
  }
}

interface ChartContext {
  dayMaster?: string;
  dayMasterMetaphor?: string;
  pillarsStr?: string;
  elementBalance?: string;
  dayMasterStrength?: string;
  favorableElements?: string[];
  soulType?: string;
  luckPillarStr?: string;
  annualPillarStr?: string;
  occupation?: string;
  relationship?: string;
  currentConcern?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface OracleRequestBody {
  question: string;
  chartContext?: ChartContext;
  conversationHistory?: Message[];
  lang?: string;
}

function buildSystemPrompt(base: string, ctx?: ChartContext, lang?: string): string {
  const fav = (ctx?.favorableElements || []).join(', ') || 'not specified';
  const chartBlock = ctx ? [
    '',
    '---',
    'CHART CONTEXT FOR THIS SESSION:',
    `Day Master: ${ctx.dayMaster || 'unknown'} — known as the ${ctx.dayMasterMetaphor || ''}`,
    `Day Master Strength: ${ctx.dayMasterStrength || 'Moderate'}`,
    `Four Pillars: ${ctx.pillarsStr || 'not provided'}`,
    `Element Balance: ${ctx.elementBalance || 'not provided'}`,
    `Favorable Elements: ${fav}`,
    `Soul Type: ${ctx.soulType || 'not provided'}`,
    `Current Life Season (大运): ${ctx.luckPillarStr || 'not available'}`,
    `Current Year Energy (流年): ${ctx.annualPillarStr || 'not available'}`,
    `Occupation: ${ctx.occupation || 'not specified'}`,
    `Relationship Status: ${ctx.relationship || 'not specified'}`,
    `Current Concern: ${ctx.currentConcern || 'not specified'}`,
    '---',
    `This person is in the life season: ${ctx.luckPillarStr || 'not available'}. Reference this season when their question touches timing or current circumstances.`,
    `The current year energy is: ${ctx.annualPillarStr || 'not available'}. Mention this when the question involves current-year decisions.`,
    '',
    'You are answering their specific question. Be direct, warm, grounded. Use the elemental metaphor name (Ancient Oak / Mist / Sword) — not type labels. Reference specific chart data when naturally relevant. Classical reference only when it fits naturally.',
  ].join('\n') : '';

  const langInstruction = lang === 'zh'
    ? '\n\nIMPORTANT: Always respond in Simplified Chinese (简体中文), regardless of the language used in the question.'
    : '';
  return base + chartBlock + langInstruction;
}

export async function POST(req: NextRequest) {
  try {
    const body: OracleRequestBody = await req.json();

    if (!body.question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(getSystemPrompt(), body.chartContext, body.lang);

    // Build message list: conversation history + new question
    const history: Message[] = (body.conversationHistory || []).slice(-10); // cap at 10 previous turns
    const messages = [
      ...history,
      { role: 'user' as const, content: body.question.trim() },
    ];

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 800,
      system:     systemPrompt,
      messages,
    });

    const textBlock = message.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text in model response' }, { status: 500 });
    }

    return NextResponse.json({ answer: textBlock.text });

  } catch (err: unknown) {
    console.error('[oracle] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
