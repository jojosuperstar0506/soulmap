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
  pillarsStr?: string;
  elementBalance?: string;
  dayMasterStrength?: string;
  favorableElements?: string[];
  soulType?: string;
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
}

function buildSystemPrompt(base: string, ctx?: ChartContext): string {
  const fav = (ctx?.favorableElements || []).join(', ') || 'not specified';
  const chartBlock = ctx ? [
    '',
    '---',
    'CHART CONTEXT FOR THIS SESSION:',
    `Day Master: ${ctx.dayMaster || 'unknown'}`,
    `Day Master Strength: ${ctx.dayMasterStrength || 'Moderate'}`,
    `Four Pillars: ${ctx.pillarsStr || 'not provided'}`,
    `Element Balance: ${ctx.elementBalance || 'not provided'}`,
    `Favorable Elements: ${fav}`,
    `Soul Type: ${ctx.soulType || 'not provided'}`,
    `Occupation: ${ctx.occupation || 'not specified'}`,
    `Relationship Status: ${ctx.relationship || 'not specified'}`,
    `Current Concern: ${ctx.currentConcern || 'not specified'}`,
    '---',
    'You are answering this person\'s specific question about their chart and life. Be direct, warm, and grounded in classical BaZi wisdom. Answer in 2–4 paragraphs. Reference their specific chart details when naturally relevant. Include a classical text quote (《滴天髓》《穷通宝鉴》《子平真诠》or similar) only when it fits the question naturally — do not force it.',
  ].join('\n') : '';

  return base + chartBlock;
}

export async function POST(req: NextRequest) {
  try {
    const body: OracleRequestBody = await req.json();

    if (!body.question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(getSystemPrompt(), body.chartContext);

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
