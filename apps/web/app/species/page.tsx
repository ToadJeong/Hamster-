import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Hamster, paletteForSpecies } from '@/components/Hamster';
import type { Species } from '@hamster/shared';

export const revalidate = 60;

export default async function SpeciesIndex({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createSupabaseServerClient();
  const q = (searchParams.q ?? '').trim();

  let query = supabase
    .from('species')
    .select('id, slug, name_ko, name_en, summary, image_url, temperament, size_cm')
    .order('name_ko', { ascending: true });

  if (q) {
    query = query.or(`name_ko.ilike.%${q}%,name_en.ilike.%${q}%,summary.ilike.%${q}%`);
  }

  const { data, error } = await query;

  const list = (data as Array<Pick<Species,'id'|'slug'|'name_ko'|'name_en'|'summary'|'image_url'|'temperament'|'size_cm'>>) ?? [];

  // 가나다순 한국어 초성으로 그룹화
  const groups = groupByInitial(list);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">🐹 햄스터 도감</h1>
          <p className="mt-1 text-sm text-cocoa-300">
            한국에서 분양·사육되는 햄스터 {list.length}종을 가나다순으로 정리했어요.
          </p>
        </div>
        <form className="hidden md:block">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="이름으로 검색"
            className="input w-64"
          />
        </form>
      </div>

      {error && (
        <div className="card text-center text-sm text-cocoa-300">
          🐹 도감을 준비하고 있어요. 잠시 후 다시 와 주세요!
        </div>
      )}

      {/* 초성 인덱스 점프 바 */}
      {!q && groups.length > 0 && (
        <nav className="sticky top-[57px] z-10 -mx-1 flex flex-wrap gap-1.5 rounded-2xl border border-cream-200 bg-white/90 px-2.5 py-2 backdrop-blur md:top-[61px]">
          {groups.map(({ key }) => (
            <a key={key} href={`#sec-${key}`}
              className="grid h-7 min-w-7 place-items-center rounded-lg px-2 text-sm font-bold text-cocoa-400 transition hover:bg-peach-100 hover:text-peach-500">
              {key}
            </a>
          ))}
        </nav>
      )}

      {groups.length === 0 ? (
        <div className="card text-center text-cocoa-300">검색 결과가 없어요.</div>
      ) : (
        <div className="space-y-7">
          {groups.map(({ key, items }) => (
            <section key={key} id={`sec-${key}`} className="scroll-mt-28">
              <h2 className="mb-2.5 flex items-center gap-2 font-display text-lg font-bold text-cocoa-500">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-peach-100 text-sm text-peach-500">{key}</span>
              </h2>
              <div className="grid gap-2.5 md:grid-cols-2">
                {items.map((s) => (
                  <Link
                    key={s.id}
                    href={`/species/${s.slug}`}
                    className="group flex items-center gap-3.5 rounded-2xl border border-cream-200/80 bg-white/95 p-3 shadow-softer transition hover:-translate-y-0.5 hover:border-peach-200 hover:shadow-soft"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-100 ring-1 ring-cream-200">
                      {s.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image_url} alt={s.name_ko} className="h-full w-full object-cover" />
                      ) : (
                        <Hamster palette={paletteForSpecies(s.slug, s.name_ko)} className="h-full w-full" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <h3 className="truncate font-bold text-cocoa-500 group-hover:text-peach-500">{s.name_ko}</h3>
                        {s.name_en && <span className="truncate text-[11px] text-cocoa-300">{s.name_en}</span>}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[13px] text-cocoa-400">{s.summary}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-cocoa-300">
                        {s.size_cm && <span>{s.size_cm}</span>}
                        {s.size_cm && s.temperament && <span className="text-cream-300">·</span>}
                        {s.temperament && <span>{s.temperament}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 text-cream-300 transition group-hover:text-peach-400">›</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// 한글 초성 추출
function getInitial(name: string): string {
  const ch = name.charCodeAt(0);
  // 한글 음절 영역 (가–힣)
  if (ch >= 0xac00 && ch <= 0xd7a3) {
    const choseongIndex = Math.floor((ch - 0xac00) / 588);
    const CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    return CHOSEONG[choseongIndex];
  }
  return '#';
}

function groupByInitial<T extends { name_ko: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = getInitial(it.name_ko);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(it);
  }
  // 한글 자음 순서대로 정렬
  const order = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ','#'];
  return order
    .filter((k) => map.has(k))
    .map((k) => ({ key: k, items: map.get(k)! }));
}
