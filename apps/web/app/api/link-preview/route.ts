import { NextResponse } from 'next/server';

/**
 * 링크 미리보기: 주어진 URL의 OpenGraph/Twitter 메타(title/image/description)를 추출.
 * 상품 추천 글 작성 시 "미리보기 가져오기"에 사용.
 * 일부 사이트(네이버 스마트스토어 등)는 봇 차단/JS 렌더로 실패할 수 있어,
 * 실패해도 링크는 저장되고 제목/설명은 직접 입력할 수 있다.
 */
export const dynamic = 'force-dynamic';

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(Number(n)); } catch { return ''; } })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch { return ''; } });
}

/** property/name 둘 다, content 가 앞/뒤 어느 쪽이든 매칭 */
function meta(html: string, key: string): string | null {
  const k = key.replace(/[:]/g, '\\:');
  const res = [
    new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${k}["'][^>]*?content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*?(?:property|name|itemprop)=["']${k}["']`, 'i'),
  ];
  for (const re of res) {
    const m = html.match(re);
    if (m?.[1]) return decode(m[1].trim());
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) return NextResponse.json({ error: 'url required' }, { status: 400 });

  let u: URL;
  try { u = new URL(target); } catch { return NextResponse.json({ error: 'invalid url' }, { status: 400 }); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return NextResponse.json({ error: 'unsupported protocol' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(u.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
        'Referer': u.origin + '/',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return NextResponse.json({ error: `fetch failed (${res.status})` }, { status: 200 });

    // 최대 1MB 읽되, </head>가 보이면 멈춤
    const reader = res.body?.getReader();
    let html = '';
    if (reader) {
      const decoder = new TextDecoder();
      let total = 0;
      while (total < 1024 * 1024) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        html += decoder.decode(value, { stream: true });
        if (/<\/head>/i.test(html)) break;
      }
      reader.cancel().catch(() => {});
    } else {
      html = await res.text();
    }

    const title =
      meta(html, 'og:title') ?? meta(html, 'twitter:title') ??
      (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ? decode(html.match(/<title[^>]*>([^<]+)<\/title>/i)![1].trim()) : null);
    const image =
      meta(html, 'og:image') ?? meta(html, 'twitter:image') ?? meta(html, 'twitter:image:src') ?? meta(html, 'image');
    const description =
      meta(html, 'og:description') ?? meta(html, 'twitter:description') ?? meta(html, 'description');

    if (!title && !image && !description) {
      return NextResponse.json({ error: 'no metadata' }, { status: 200 });
    }

    return NextResponse.json({
      title: title ?? null,
      image: image ? new URL(image, u).toString() : null,
      description: description ?? null,
      site: u.hostname.replace(/^www\./, ''),
    });
  } catch {
    return NextResponse.json({ error: 'preview unavailable' }, { status: 200 });
  }
}
