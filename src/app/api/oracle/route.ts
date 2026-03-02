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

function buildSystemPrompt(base: string, ctx?: ChartContext, lang?: string, turnCount?: number): string {
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
    '',
    'You are answering their specific question. The chart tells you WHO this person is — use it as your silent foundation for understanding them. But your response should be about their LIFE and SITUATION, not about chart data. Don\'t structure your answer around elements and cycles. Structure it around their actual question, their real circumstances, and what they need to hear. The chart is like a doctor\'s lab work — it informs everything, but you talk about the patient\'s life, not the numbers.',
    '',
    'Use the elemental metaphor name (Ancient Oak / Mist / Sword) where it fits naturally — once, not as a repeated anchor. NEVER say "your chart", "your Day Master", "your element balance", "favorable elements", "useful gods", or name any Ten God. The chart is your silent compass — what you speak about is their life, their choices, their path.',
    '',
    'When their question contains an unresolved decision, internally classify it: Threshold (they have been avoiding making it), Timing (they have decided to act but are asking when), Resource (how to allocate energy, attention, or money), Identity (who they are becoming), or Relational (entering, changing, or ending a connection). Let this classification shape your response — surface timing quality for Timing decisions, surface the structural pattern bias for Threshold decisions.',
  ].join('\n') : '';

  const isFollowUp = (turnCount || 0) >= 1;
  const conversationBlock = isFollowUp ? [
    '',
    '---',
    `CONVERSATION MODE — ACTIVE (turn ${(turnCount || 0) + 1} of an ongoing conversation)`,
    '',
    'This person has already received their initial reading. You are now continuing a conversation, NOT delivering a new reading.',
    '',
    'CONVERSATION MODE RULES (override Reading Framework and Self-Check for follow-ups):',
    '',
    '1. DO NOT repeat information already covered in prior turns. Their Day Master identity, element balance, life season, and year energy were already introduced. Reference them only when directly relevant to the new question — and then briefly, as a callback ("the Mountain steadiness we talked about"), not a re-explanation.',
    '',
    '2. SPEAK CONVERSATIONALLY, not in reading format. No markdown headings (no ##, ###). No numbered sections. No star ratings. Write as a warm, knowledgeable friend continuing a conversation — short paragraphs, natural rhythm, occasional questions back to them.',
    '',
    '3. BUILD ON PRIOR CONTEXT. Reference what they said earlier. Notice emotional shifts. If they asked about career before and now ask about relationships, connect the threads. If they seem anxious, acknowledge that before diving into analysis.',
    '',
    '4. MATCH DEPTH TO QUESTION. Simple question → concise answer (2-3 short paragraphs). Deep or emotional question → fuller response. Do not pad short answers with chart review.',
    '',
    '5. END WITH WEIGHT, NOT A QUESTION. Do not end responses with reflective questions ("What does that feel like for you?"). End with something that lands — an insight they can sit with, a reframe that shifts their perspective, or a concrete action. The last sentence should feel like a closing statement, not an opening for therapy.',
    '',
    '6. PROGRESSIVE DEPTH on repeat topics. Do NOT re-serve the same structural insight. If they asked about career before and are asking again, go UNDERNEATH — name the pattern in their asking ("You keep coming back to this — and I think the real question isn\'t about career, it\'s about..."), challenge an assumption, or offer a perspective they haven\'t considered. First pass = landscape. Second pass = what\'s really driving this.',
    '',
    '7. VARY YOUR ANGLE on repeat domains. The chart data is the same every time — so your angle must change. Approach the same topic from a completely different lens each time: strategic → emotional → identity → timing → relational → practical. If last time you talked about what they\'re good at, this time talk about what they\'re avoiding, or what the real cost of staying is, or what this decision looks like in 5 years.',
    '',
    '8. REFRAME when the real question is different from the stated one. "You asked about whether to switch jobs, but I think the real question is whether you have permission to want more." This is the single most powerful move — it makes people feel genuinely understood.',
    '',
    '9. SELF-CHECK FOR FOLLOW-UPS (replaces the full 6-point check):',
    '   - Did I avoid repeating chart basics already covered?',
    '   - Does my response build on what came before, not start from scratch?',
    '   - Did I match the emotional register of their question?',
    '   - Am I talking about their life, or about their chart? (Chart stays silent.)',
    '   - Does it end with weight — an insight, a reframe, or a concrete action? (Not a question.)',
    '',
  ].join('\n') : '';

  const langInstruction = lang === 'zh'
    ? '\n\nIMPORTANT: Always respond in Simplified Chinese (简体中文), regardless of the language used in the question.'
    : '';
  return base + chartBlock + conversationBlock + langInstruction;
}

export async function POST(req: NextRequest) {
  try {
    const body: OracleRequestBody = await req.json();

    if (!body.question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Build message list: conversation history + new question
    const history: Message[] = (body.conversationHistory || []).slice(-10); // cap at 10 previous turns
    const turnCount = history.filter(m => m.role === 'assistant').length;

    const systemPrompt = buildSystemPrompt(getSystemPrompt(), body.chartContext, body.lang, turnCount);

    const messages = [
      ...history,
      { role: 'user' as const, content: body.question.trim() },
    ];

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1200,
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
