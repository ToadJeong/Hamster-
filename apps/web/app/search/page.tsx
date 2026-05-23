import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GuideCard } from '@/components/GuideCard';
import type { GuideWithCounts, Species } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const supabase = createSupabaseServerClient();

  let speciesMatches: Pick<Species,'id'|'slug'|'name_ko'|'name_en'|'summary'|'image_url'>[] = [];
  let guideMatches: GuideWithCounts[] = [];

  if (q) {
    const [s, g] = await Promise.all([
      supabase
        .from('species')
        .select('id, slug, name_ko, name_en, summary, image_url')
        .or(`name_ko.ilike.%${q}%,name_en.ilike.%${q}%,scientific_name.ilike.%${q}%,summary.ilike.%${q}%,description.ilike.%${q}%`)
        .order('name_ko'),
      supabase
        .from('guides_with_counts')
        .select('*')
        .or(`title.ilike.%${q}%,body.ilike.%${q}%,author_username.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);
    speciesMatches = (s.data as any) ?? [];
    guideMatches = (g.data as any) ?? [];
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-cocoa-500">통합 검색</h1>
        <form className="mt-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="햄스터 종, 가이드 제목·내용, 작성자로 검색"
            className="input"
            autoFocus
          />
        </form>
        {q && (
          <p className="mt-2 text-sm text-cocoa-300">
            “{q}” 검색 결과 · 도감 {speciesMatches.length}건 · 가이드 {guideMatches.length}건
          </p>
        )}
      </header>

      {!q ? (
        <div className="card text-center text-cocoa-300">
          검색어를 입력해 주세요. (예: 골든, 케이지, 사육)
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 font-display text-xl font-bold text-cocoa-500">
              도감 · {speciesMatches.length}건
            </h2>
            {speciesMatches.length === 0 ? (
              <div className="card text-center text-cocoa-300">일치하는 종이 없어요.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {speciesMatches.map((s) => (
                  <Link
                    key={s.id}
                    href={`/species/${s.slug}`}
                    className="card flex gap-4 transition hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cream-100 text-2xl">
                      {s.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                      ) : '🐹'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-cocoa-500">{s.name_ko}</h3>
                      {s.name_en && <p className="text-xs text-cocoa-300">{s.name_en}</p>}
                      <p className="mt-1 line-clamp-2 text-sm text-cocoa-400">{s.summary}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-bold text-cocoa-500">
              가이드 · {guideMatches.length}건
            </h2>
            {guideMatches.length === 0 ? (
              <div className="card text-center text-cocoa-300">일치하는 가이드가 없어요.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {guideMatches.map((g) => <GuideCard key={g.id} guide={g} />)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
