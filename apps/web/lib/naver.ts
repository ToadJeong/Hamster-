/**
 * 네이버 쇼핑 검색 API 연동 (서버 전용).
 *
 * 환경변수(시크릿) — Vercel/Supabase 환경변수에만 넣고 절대 클라이언트로 노출하지 않음:
 *   NAVER_CLIENT_ID      네이버 개발자센터 애플리케이션 Client ID
 *   NAVER_CLIENT_SECRET  네이버 개발자센터 애플리케이션 Client Secret
 *
 * 키가 없으면 빈 배열을 돌려주어, 연동 전에도 빌드/페이지가 깨지지 않는다.
 * 네이버 검색 API는 "정확도(sim)" 정렬만 지원하므로 카테고리 대표 검색어의
 * 인기/대표 상품을 노출한다. (실시간 판매량 랭킹 자체는 API가 제공하지 않음)
 */

import type { ProductCategory } from '@hamster/shared';

export type NaverProduct = {
  title: string;
  link: string;
  image: string;
  price: number | null;
  mallName: string;
  brand: string;
  productId: string;
};

const QUERY_BY_CATEGORY: Record<ProductCategory, string> = {
  cage: '햄스터 케이지',
  food: '햄스터 사료 간식',
  wheel: '햄스터 휠 쳇바퀴',
  bedding: '햄스터 베딩 깔짚',
  toy: '햄스터 장난감',
  sand: '햄스터 목욕모래',
  etc: '햄스터 용품',
};

export function isNaverConfigured(): boolean {
  return !!(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

export async function fetchNaverShopping(
  category: ProductCategory,
  display = 10,
): Promise<NaverProduct[]> {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return [];

  const query = QUERY_BY_CATEGORY[category] ?? QUERY_BY_CATEGORY.etc;
  const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=${display}&sort=sim`;

  try {
    const res = await fetch(url, {
      headers: { 'X-Naver-Client-Id': id, 'X-Naver-Client-Secret': secret },
      // 쇼핑 결과는 자주 변하지 않으므로 1시간 캐시 (네이버 일일 호출 한도 보호)
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: any[] };
    return (data.items ?? []).map((it) => ({
      title: stripTags(String(it.title ?? '')),
      link: String(it.link ?? ''),
      image: String(it.image ?? ''),
      price: it.lprice ? Number(it.lprice) : null,
      mallName: String(it.mallName ?? ''),
      brand: String(it.brand ?? ''),
      productId: String(it.productId ?? ''),
    }));
  } catch {
    return [];
  }
}
