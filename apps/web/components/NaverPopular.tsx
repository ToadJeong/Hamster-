import type { NaverProduct } from '@/lib/naver';

/** 네이버 쇼핑 인기 상품 가로 스크롤 행 (서버 렌더 / 데이터 없으면 렌더 안 함) */
export function NaverPopular({ items, label }: { items: NaverProduct[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-base font-bold text-cocoa-500">🛒 실시간 인기 상품</h2>
        <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-bold text-mint-400">{label}</span>
        <span className="ml-auto text-[11px] text-cocoa-300">네이버 쇼핑</span>
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1.5">
        {items.map((it, i) => (
          <a
            key={it.productId || it.link || i}
            href={it.link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group relative w-36 shrink-0 snap-start overflow-hidden rounded-2xl border border-cream-200/80 bg-white shadow-softer transition hover:-translate-y-0.5 hover:border-peach-200 hover:shadow-soft"
          >
            <div className="relative aspect-square bg-cream-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
              {i < 3 && (
                <span className="absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-peach-400 text-[11px] font-bold text-white shadow-soft">
                  {i + 1}
                </span>
              )}
            </div>
            <div className="p-2">
              <p className="line-clamp-2 min-h-[32px] text-[12px] font-medium leading-4 text-cocoa-500 group-hover:text-peach-500">{it.title}</p>
              <p className="mt-1 text-[13px] font-bold text-peach-500">
                {it.price != null ? `₩${it.price.toLocaleString('ko-KR')}` : '가격문의'}
              </p>
              {it.mallName && <p className="truncate text-[10px] text-cocoa-300">{it.mallName}</p>}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
