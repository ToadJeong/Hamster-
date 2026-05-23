import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa-500">햄스터 도감</h1>
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

      {error && <div className="card text-red-500">불러오는 중 오류가 발생했어요: {error.message}</div>}

      {/* 초성 인덱스 점프 바 */}
      {!q && groups.length > 0 && (
        <nav className="flex flex-wrap gap-2 rounded-cute border border-cream-200 bg-white p-3">
          {groups.map(({ key }) => (
            <a key={key} href={`#sec-${key}`} className="badge hover:bg-peach-100 hover:text-peach-500">
              {key}
            </a>
          ))}
        </nav>
      )}

      {groups.length === 0 ? (
        <div className="card text-center text-cocoa-300">검색 결과가 없어요.</div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ key, items }) => (
            <section key={key} id={`sec-${key}`}>
              <h2 className="mb-3 font-display text-xl font-bold text-cocoa-500">{key}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((s) => (
                  <Link
                    key={s.id}
                    href={`/species/${s.slug}`}
                    className="card flex gap-4 transition hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-cream-100 text-3xl">
                      {s.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image_url} alt={s.name_ko} className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        '🐹'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-semibold text-cocoa-500">{s.name_ko}</h3>
                        {s.name_en && <span className="text-xs text-cocoa-300">{s.name_en}</span>}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-cocoa-400">{s.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1 text-xs">
                        {s.size_cm && <span className="badge">📏 {s.size_cm}</span>}
                        {s.temperament && <span className="badge">💗 {s.temperament}</span>}
                      </div>
                    </div>
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
