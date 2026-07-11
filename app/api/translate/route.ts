import { NextRequest, NextResponse } from 'next/server';

const LIBRE_URL = (process.env.LIBRE_TRANSLATE_URL ?? 'https://translate.terraprint.co').replace(/\/$/, '');
const LIBRE_KEY = process.env.LIBRE_TRANSLATE_KEY ?? '';

async function callLibre(q: string | string[], source: string, target: string) {
  const body: Record<string, unknown> = { q, source, target, format: 'text' };
  if (LIBRE_KEY) body.api_key = LIBRE_KEY;

  const res = await fetch(`${LIBRE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`LibreTranslate returned ${res.status}`);
  return res.json() as Promise<unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const { q, source = 'th', target } = (await req.json()) as {
      q: string | string[];
      source?: string;
      target: string;
    };

    if (!q || !target) {
      return NextResponse.json({ error: 'Missing q or target' }, { status: 400 });
    }

    if (Array.isArray(q)) {
      // Try native batch first — supported in LibreTranslate >= 1.3
      try {
        const data = await callLibre(q, source, target);

        if (Array.isArray(data)) {
          // [{ translatedText: "..." }, ...]
          return NextResponse.json({
            translatedText: (data as { translatedText: string }[]).map((d) => d.translatedText),
          });
        }
        if (
          data &&
          typeof data === 'object' &&
          'translatedText' in data &&
          Array.isArray((data as { translatedText: unknown }).translatedText)
        ) {
          return NextResponse.json(data);
        }
        throw new Error('Unexpected batch response format');
      } catch {
        // Fallback: translate each string individually in parallel
        const results = await Promise.all(
          q.map(async (text) => {
            try {
              const d = await callLibre(text, source, target);
              return (d as { translatedText: string }).translatedText ?? text;
            } catch {
              return text;
            }
          }),
        );
        return NextResponse.json({ translatedText: results });
      }
    }

    // Single string
    const data = await callLibre(q, source, target);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
