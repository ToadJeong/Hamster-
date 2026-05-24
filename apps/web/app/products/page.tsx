import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/EmptyState';
import { NaverPopular } from '@/components/NaverPopular';
import { fetchNaverShopping } from '@/lib/naver';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import { PRODUCT_CATEGORY_LABEL, type ProductCategory } from '@hamster/shared';

export const revalidate = 20;

export default async function ProductsIndex({
  searchParams,
}: {
  searchParams: { c?: ProductCategory };
}) {
  const supabase = createSupabaseServerClient();
  const t = makeT(getLocale());
  const cat = searchParams.c;

  let q = supabase.from('product_posts_feed').select('*').order('created_at', { ascending: false }).limit(60);
  if (cat) q = q.eq('category', cat);

  // 우리 커뮤니티 인기(추천수 상위) + 네이버 쇼핑 실시간 인기를 병렬 조회
  let topQ = supabase.from('product_posts_feed').select('*').order('like_count', { ascending: false }).limit(6);
  if (cat) topQ = topQ.eq('category', cat);

  const [{ data, error }, { data: topData }, naverItems] = await Promise.all([
    q,
    topQ,
    fetchNaverShopping(cat ?? 'etc'),
  ]);
  const items = (data as any[]) ?? [];
  const topPicks = ((topData as any[]) ?? []).filter((p) => (p.like_count ?? 0) > 0);
  const naverLabel = cat ? PRODUCT_CATEGORY_LABEL[cat].label : t('products.naverDefault');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('products.title')}</h1>
          <p className="mt-1 text-sm text-cocoa-300">{t('products.subtitle')}</p>
        </div>
        <Link href="/products/new" className="btn-primary text-sm">{t('products.recommend')}</Link>
      </header>

      {/* 실시간 인기 상품 (네이버 쇼핑) — 키 미설정 시 자동으로 숨김 */}
      <NaverPopular items={naverItems} label={naverLabel} />

      {/* 햄집사 추천 TOP (우리 커뮤니티 추천수 상위) */}
      {topPicks.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="font-display text-base font-bold text-cocoa-500">{t('products.topPicks')}</h2>
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1.5">
            {topPicks.map((p, i) => {
              const m = PRODUCT_CATEGORY_LABEL[p.category as ProductCategory] ?? PRODUCT_CATEGORY_LABEL.etc;
              return (
                <Link key={p.id} href={`/products/${p.id}`}
                  className="group relative w-36 shrink-0 snap-start overflow-hidden rounded-2xl border border-cream-200/80 bg-white shadow-softer transition hover:-translate-y-0.5 hover:border-peach-200 hover:shadow-soft">
                  <div className="relative grid aspect-square place-items-center bg-cream-100 text-3xl">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : m.emoji}
                    {i < 3 && (
                      <span className="absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-lilac-400 text-[11px] font-bold text-white shadow-soft">{i + 1}</span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="line-clamp-2 min-h-[32px] text-[12px] font-medium leading-4 text-cocoa-500 group-hover:text-peach-500">{p.title}</p>
                    <p className="mt-1 text-[11px] text-cocoa-300">👍 {p.like_count}{p.price && <span className="ml-1 font-bold text-peach-500">{p.price}</span>}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2 rounded-cute border border-cream-200 bg-white p-3">
        <Link href="/products" scroll={false} className={'badge ' + (!cat ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>{t('common.all')}</Link>
        {(Object.keys(PRODUCT_CATEGORY_LABEL) as ProductCategory[]).map((k) => {
          const m = PRODUCT_CATEGORY_LABEL[k];
          return (
            <Link key={k} href={`/products?c=${k}`} scroll={false}
              className={'badge ' + (cat === k ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>
              {m.emoji} {m.label}
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="card text-center text-sm text-cocoa-300">{t('products.preparing')}</div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title={t('products.emptyTitle')}
          description={t('products.emptyDesc')}
          action={<Link href="/products/new" className="btn-primary text-sm">{t('products.emptyAction')}</Link>}
          kind="campbell"
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((p: any) => {
            const m = PRODUCT_CATEGORY_LABEL[p.category as ProductCategory] ?? PRODUCT_CATEGORY_LABEL.etc;
            return (
              <li key={p.id}>
                <Link href={`/products/${p.id}`} className="group flex gap-3.5 rounded-2xl border border-cream-200/80 bg-white/95 p-3.5 shadow-softer transition hover:-translate-y-0.5 hover:border-peach-200 hover:shadow-soft sm:p-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream-100 text-xl ring-1 ring-cream-200">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                    ) : m.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-cream-100 px-1.5 py-0.5 text-[11px] font-bold text-cocoa-500">{m.emoji} {m.label}</span>
                      {p.price && <span className="rounded-md bg-peach-50 px-1.5 py-0.5 text-[11px] font-bold text-peach-500">{p.price}</span>}
                    </div>
                    <h3 className="line-clamp-1 font-bold text-cocoa-500 group-hover:text-peach-500">{p.title}</h3>
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-cocoa-400">{p.description}</p>
                    <div className="mt-1.5 text-[11px] text-cocoa-300">
                      <span className="font-medium text-cocoa-400">{p.author_username ?? t('common.anonymous')}</span> · {formatDate(p.created_at)} · 👍 {p.like_count ?? 0}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
