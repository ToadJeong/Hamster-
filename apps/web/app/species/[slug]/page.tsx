import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GuideCard } from '@/components/GuideCard';
import { CorrectionButton } from '@/components/CorrectionButton';
import { Hamster, paletteForSpecies } from '@/components/Hamster';
import { EmptyState } from '@/components/EmptyState';
import { GENUS_INFO, genusForSlug, morphLabel } from '@/lib/genus';
import type { Species, GuideWithCounts } from '@hamster/shared';

export const revalidate = 60;

export default async function SpeciesDetail({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServerClient();

  // 모든 종을 가져와 genus로 묶는다 (행이 적어 한 번에 조회)
  const { data: all } = await supabase
    .from('species')
    .select('id, slug, name_ko, name_en, scientific_name, size_cm, lifespan_years, temperament, origin, summary, description, care_tips, image_url')
    .order('name_ko');
  const rows = (all as Species[]) ?? [];

  const landed = rows.find((r) => r.slug === params.slug);
  if (!landed) notFound();

  const genus = genusForSlug(landed.slug, landed.name_ko);
  const info = GENUS_INFO[genus];
  const morphs = rows.filter((r) => genusForSlug(r.slug, r.name_ko) === genus);
  const base = rows.find((r) => r.slug === info.baseSlug) ?? landed;

  // 이 종(모든 모프)과 연결된 가이드
  const morphIds = morphs.map((m) => m.id);
  const { data: relatedGuides } = await supabase
    .from('guides_with_counts')
    .select('*')
    .in('species_id', morphIds.length ? morphIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })
    .limit(6);

  return (
    <article className="space-y-8">
      <Link href="/species" className="text-sm text-cocoa-300 hover:text-peach-500">← 도감으로</Link>

      <header className="overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-cream-100 via-peach-50 to-lilac-100 p-6 shadow-soft md:p-8">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="aspect-square w-28 shrink-0 overflow-hidden rounded-3xl bg-white shadow-soft ring-4 ring-white/70 md:w-40">
            {base.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={base.image_url} alt={info.name_ko} className="h-full w-full object-cover" />
            ) : (
              <Hamster palette={info.palette} className="h-full w-full" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl md:text-4xl">{info.name_ko}</h1>
            <p className="mt-1 text-sm text-cocoa-400">
              {info.name_en}
              <span className="ml-1.5 italic text-cocoa-300">· {info.scientific}</span>
            </p>
            <p className="mt-2.5 text-cocoa-500">{base.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(info.name_ko)}`}
                target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">📸 사진 보기</a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(info.name_ko + ' 특징 사육')}`}
                target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">🔍 정보 더 찾기</a>
              <a href={`https://namu.wiki/Search?q=${encodeURIComponent(info.name_ko)}`}
                target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">📚 백과사전</a>
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-2.5 text-sm md:grid-cols-4">
          <Fact label="크기" value={base.size_cm} />
          <Fact label="수명" value={base.lifespan_years} />
          <Fact label="성격" value={base.temperament} />
          <Fact label="원산지" value={base.origin} />
        </dl>
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-cocoa-500">
          <span className="h-4 w-1.5 rounded-full bg-peach-400" aria-hidden />소개
        </h2>
        <div className="prose-soft whitespace-pre-line rounded-cute border border-cream-200/80 bg-white/80 p-5">{base.description}</div>
      </section>

      {base.care_tips && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-cocoa-500">
            <span className="h-4 w-1.5 rounded-full bg-mint-400" aria-hidden />사육 팁
          </h2>
          <div className="card whitespace-pre-line prose-soft border-mint-200 bg-mint-50">{base.care_tips}</div>
        </section>
      )}

      {/* 모프(색·특징) 표 */}
      {morphs.length > 1 && (
        <section>
          <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-bold text-cocoa-500">
            <span className="h-4 w-1.5 rounded-full bg-lilac-400" aria-hidden />색·특징 모프 {morphs.length}
          </h2>
          <p className="mb-3 text-sm text-cocoa-300">같은 {info.name_ko} 안에서 색이나 털·무늬로 구분되는 모프예요. 사육법은 종 기준과 동일해요.</p>
          <ul className="space-y-2.5">
            {morphs.map((m) => (
              <li key={m.id}>
                <details className="group rounded-2xl border border-cream-200/80 bg-white/95 p-3.5 shadow-softer [&_summary]:list-none" {...(m.slug === landed.slug ? { open: true } : {})}>
                  <summary className="flex cursor-pointer items-center gap-3.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-100 ring-1 ring-cream-200">
                      {m.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.image_url} alt={m.name_ko} className="h-full w-full object-cover" />
                      ) : (
                        <Hamster palette={paletteForSpecies(m.slug, m.name_ko)} className="h-full w-full" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-cocoa-500">{morphLabel(m.name_ko)}</h3>
                      <p className="line-clamp-1 text-[13px] text-cocoa-400">{m.summary}</p>
                    </div>
                    <span className="shrink-0 text-cocoa-300 transition group-open:rotate-180">⌄</span>
                  </summary>
                  <div className="mt-3 border-t border-cream-200 pt-3 text-[14px] leading-6 text-cocoa-500">
                    {m.slug === base.slug ? (
                      <p className="text-cocoa-400">이 종을 대표하는 기본 모프예요. 자세한 내용은 위 ‘소개’와 ‘사육 팁’을 참고하세요.</p>
                    ) : (
                      <p className="whitespace-pre-line">{m.description || m.summary}</p>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-center justify-between rounded-cute border border-cream-200 bg-cream-50 px-4 py-3">
        <p className="text-sm text-cocoa-400">정보가 정확하지 않나요? 햄집사님의 제보로 더 정확해져요.</p>
        <CorrectionButton targetType="species" targetId={base.id} targetSlug={base.slug} targetName={info.name_ko} />
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold text-cocoa-500">관련 가이드</h2>
          <Link href={`/guides/new?species=${base.slug}`} className="text-sm font-medium text-peach-500 hover:underline">
            이 종으로 가이드 쓰기 →
          </Link>
        </div>
        {relatedGuides && relatedGuides.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {(relatedGuides as GuideWithCounts[]).map((g) => <GuideCard key={g.id} guide={g} />)}
          </div>
        ) : (
          <EmptyState
            title="아직 이 종의 가이드가 없어요"
            description="이 종을 키우는 노하우를 가장 먼저 남겨보세요!"
            action={<Link href={`/guides/new?species=${base.slug}`} className="btn-primary text-sm">가이드 쓰기</Link>}
          />
        )}
      </section>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-white/80 p-3 text-center shadow-softer">
      <dt className="text-[11px] font-medium text-cocoa-300">{label}</dt>
      <dd className="mt-0.5 font-bold text-cocoa-500">{value ?? '—'}</dd>
    </div>
  );
}
