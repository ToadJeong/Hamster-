import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/site-settings';
import { GuideCard } from '@/components/GuideCard';
import { HomeSearchBar } from '@/components/HomeSearchBar';
import type { GuideWithCounts, Species } from '@hamster/shared';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const settings = await getSiteSettings();

  const [{ data: speciesPreview }, { data: latestGuides }] = await Promise.all([
    supabase
      .from('species')
      .select('id, slug, name_ko, summary, image_url')
      .order('name_ko', { ascending: true })
      .limit(6),
    supabase
      .from('guides_with_counts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  return (
    <div className="space-y-12">
      {/* 사이트 공지 */}
      {settings['site.notice'] && (
        <div className="rounded-cute border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-cocoa-500">
          📢 {settings['site.notice']}
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-cute bg-gradient-to-br from-peach-100 via-cream-100 to-lilac-100 p-8 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <p className="badge mb-3">🐹 햄집사들의 커뮤니티</p>
          <h1 className="font-display text-3xl font-bold leading-tight text-cocoa-500 md:text-5xl">
            우리집 햄스터,<br />이름은 알지만 <span className="text-peach-500">종</span>은 모르셨나요?
          </h1>
          <p className="mt-4 text-cocoa-400 md:text-lg">
            한국에서 분양·사육되는 햄스터를 가나다순으로 정리한 도감과,
            <br className="hidden md:block" />
            햄집사들이 직접 쓴 사육 가이드를 만나보세요.
          </p>
          <div className="mt-6">
            <HomeSearchBar />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/species" className="btn-primary">도감 보러가기</Link>
            <Link href="/guides" className="btn-secondary">가이드 둘러보기</Link>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 text-[160px] opacity-20 md:text-[220px]">
          🐹
        </div>
      </section>

      {/* 도감 미리보기 */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-cocoa-500">햄스터 도감</h2>
            <p className="text-sm text-cocoa-300">한국에서 키우는 햄스터 30여 종을 가나다순으로</p>
          </div>
          <Link href="/species" className="text-sm font-medium text-peach-500 hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {(speciesPreview as Pick<Species,'id'|'slug'|'name_ko'|'summary'|'image_url'>[] ?? []).map((s) => (
            <Link
              key={s.id}
              href={`/species/${s.slug}`}
              className="card group transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="mb-3 grid aspect-square place-items-center rounded-2xl bg-cream-100 text-5xl">
                {s.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image_url} alt={s.name_ko} className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  '🐹'
                )}
              </div>
              <h3 className="font-semibold text-cocoa-500 group-hover:text-peach-500">{s.name_ko}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-cocoa-300">{s.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 최신 가이드 */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-cocoa-500">최신 가이드</h2>
            <p className="text-sm text-cocoa-300">햄집사들이 직접 쓴 사육 노하우</p>
          </div>
          <Link href="/guides" className="text-sm font-medium text-peach-500 hover:underline">
            전체 보기 →
          </Link>
        </div>
        {latestGuides && latestGuides.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {(latestGuides as GuideWithCounts[]).map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        ) : (
          <div className="card text-center text-cocoa-300">
            아직 가이드가 없어요. 첫 번째 가이드를 작성해 보세요!
          </div>
        )}
      </section>
    </div>
  );
}
