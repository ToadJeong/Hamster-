import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { PRODUCT_CATEGORY_LABEL, type ProductCategory } from '@hamster/shared';

export const revalidate = 20;

export default async function ProductsIndex({
  searchParams,
}: {
  searchParams: { c?: ProductCategory };
}) {
  const supabase = createSupabaseServerClient();
  const cat = searchParams.c;

  let q = supabase.from('product_posts_feed').select('*').order('created_at', { ascending: false }).limit(60);
  if (cat) q = q.eq('category', cat);
  const { data, error } = await q;
  const items = (data as any[]) ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">🛍 상품 추천</h1>
          <p className="mt-1 text-sm text-cocoa-300">햄집사들이 직접 써보고 추천하는 용품. 링크를 올리면 미리보기로 보여줘요.</p>
        </div>
        <Link href="/products/new" className="btn-primary text-sm">✏️ 상품 추천하기</Link>
      </header>

      <div className="flex flex-wrap gap-2 rounded-cute border border-cream-200 bg-white p-3">
        <Link href="/products" className={'badge ' + (!cat ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>전체</Link>
        {(Object.keys(PRODUCT_CATEGORY_LABEL) as ProductCategory[]).map((k) => {
          const m = PRODUCT_CATEGORY_LABEL[k];
          return (
            <Link key={k} href={`/products?c=${k}`}
              className={'badge ' + (cat === k ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>
              {m.emoji} {m.label}
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="card text-center text-sm text-cocoa-300">🛍 상품 게시판을 준비하고 있어요. 잠시 후 다시 와 주세요!</div>
      )}

      {items.length === 0 ? (
        <div className="card text-center text-cocoa-300">아직 추천 상품이 없어요. 첫 상품을 추천해 주세요!</div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((p: any) => {
            const m = PRODUCT_CATEGORY_LABEL[p.category as ProductCategory] ?? PRODUCT_CATEGORY_LABEL.etc;
            return (
              <li key={p.id}>
                <Link href={`/products/${p.id}`} className="card flex gap-3 transition hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream-100 text-2xl">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                    ) : m.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="badge bg-cream-100 text-cocoa-500">{m.emoji} {m.label}</span>
                      {p.price && <span className="badge bg-peach-100 text-peach-500">{p.price}</span>}
                    </div>
                    <h3 className="line-clamp-1 font-semibold text-cocoa-500">{p.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-cocoa-300">{p.description}</p>
                    <div className="mt-1 text-xs text-cocoa-300">
                      {p.author_username ?? '익명'} · {formatDate(p.created_at)} · 👍 {p.like_count ?? 0}
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
