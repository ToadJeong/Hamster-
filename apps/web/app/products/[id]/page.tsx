import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { PRODUCT_CATEGORY_LABEL, type ProductCategory } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function ProductDetail({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('product_posts_feed').select('*').eq('id', params.id).maybeSingle();
  if (error || !data) notFound();
  const p = data as any;
  const m = PRODUCT_CATEGORY_LABEL[p.category as ProductCategory] ?? PRODUCT_CATEGORY_LABEL.etc;

  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <Link href="/products" className="text-sm text-cocoa-300 hover:text-peach-500">← 상품 추천</Link>

      {p.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image_url} alt="" className="max-h-80 w-full rounded-cute object-contain bg-cream-50" />
      )}

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="badge bg-cream-100 text-cocoa-500">{m.emoji} {m.label}</span>
          {p.price && <span className="badge bg-peach-100 text-peach-500">{p.price}</span>}
        </div>
        <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{p.title}</h1>
        <div className="flex items-center gap-2 text-sm text-cocoa-300">
          <span>{p.author_username ?? '익명'} · {formatDate(p.created_at)} · 👍 {p.like_count ?? 0}</span>
        </div>
      </header>

      {p.url && (
        <a href={p.url} target="_blank" rel="noopener noreferrer"
           className="btn-primary inline-flex w-full justify-center sm:w-auto">
          🔗 상품 보러 가기
        </a>
      )}

      <div className="prose-soft whitespace-pre-line text-[15px]">{p.description}</div>

      <p className="text-xs text-cocoa-300">
        ⚠ 외부 링크는 판매처 정보이며 햄랜드와 무관해요. 구매 전 가격·후기를 꼭 확인하세요.
      </p>
    </article>
  );
}
