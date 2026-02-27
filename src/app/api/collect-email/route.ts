import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Invalid email' }, { status: 400 });
    }

    const audienceId = process.env.RESEND_AUDIENCE_ID;
    const apiKey     = process.env.RESEND_API_KEY;
    if (!audienceId || !apiKey) {
      console.warn('[collect-email] Missing RESEND env vars — skipping');
      return NextResponse.json({ ok: true, skipped: true });
    }

    const res = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          first_name: (name || '').trim().split(' ')[0] || '',
          unsubscribed: false,
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('[collect-email] Resend error:', res.status, body);
      // Still return 200 — never surface backend errors to the user
      return NextResponse.json({ ok: true, warning: 'Resend error' });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[collect-email] Unexpected error:', err);
    return NextResponse.json({ ok: true, warning: 'Unexpected error' });
  }
}
