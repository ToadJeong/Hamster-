import { NextResponse } from 'next/server';

/**
 * 링크 미리보기: 주어진 URL의 OpenGraph 메타(title/image/description)를 추출.
 * 상품 추천 글 작성 시 "미리보기 가져오기"에 사용.
 */
export const dynamic = 'force-dynamic';

function pick(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decode(m[1].trim());
  }
  return null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) return NextResponse.json({ error: 'url required' }, { status: 400 });

  let u: URL;
  try {
    u = new URL(target);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return NextResponse.json({ error: 'unsupported protocol' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(u.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HamlandBot/1.0)' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return NextResponse.json({ error: `fetch failed (${res.status})` }, { status: 200 });

    // 최대 512KB만 읽음
    const reader = res.body?.getReader();
    let html = '';
    if (reader) {
      const decoder = new TextDecoder();
      let total = 0;
      while (total < 512 * 1024) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        html += decoder.decode(value, { stream: true });
        if (html.includes('</head>')) break; // head만 있으면 충분
      }
      reader.cancel().catch(() => {});
    } else {
      html = await res.text();
    }

    const title = pick(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]);
    const image = pick(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    ]);
    const description = pick(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    ]);

    return NextResponse.json({
      title: title ?? null,
      image: image ? new URL(image, u).toString() : null,
      description: description ?? null,
      site: u.hostname,
    });
  } catch {
    return NextResponse.json({ error: 'preview unavailable' }, { status: 200 });
  }
}
