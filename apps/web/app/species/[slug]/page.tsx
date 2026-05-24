import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GuideCard } from '@/components/GuideCard';
import { CorrectionButton } from '@/components/CorrectionButton';
import { HamsterIllustration, visualForSpecies } from '@/components/HamsterIllustration';
import { EmptyState } from '@/components/EmptyState';
import type { Species, GuideWithCounts } from '@hamster/shared';

export const revalidate = 60;

export default async function SpeciesDetail({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServerClient();

  const { data: species } = await supabase
    .from('species')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!species) notFound();
  const s = species as Species;

  const { data: relatedGuides } = await supabase
    .from('guides_with_counts')
    .select('*')
    .eq('species_id', s.id)
    .order('created_at', { ascending: false })
    .limit(6);

  return (
    <article className="space-y-8">
      <Link href="/species" className="text-sm text-cocoa-300 hover:text-peach-500">
        ← 도감으로
      </Link>

      <header className="overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-cream-100 via-peach-50 to-lilac-100 p-6 shadow-soft md:p-8">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="aspect-square w-28 shrink-0 overflow-hidden rounded-3xl bg-white shadow-soft ring-4 ring-white/70 md:w-40">
            {s.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image_url} alt={s.name_ko} className="h-full w-full object-cover" />
            ) : (
              <HamsterIllustration visual={visualForSpecies(s.slug, s.name_ko)} className="h-full w-full" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl md:text-4xl">{s.name_ko}</h1>
            <p className="mt-1 text-sm text-cocoa-400">
              {s.name_en}
              {s.scientific_name && <span className="ml-1.5 italic text-cocoa-300">· {s.scientific_name}</span>}
            </p>
            <p className="mt-2.5 text-cocoa-500">{s.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent('햄스터 ' + s.name_ko)}`}
                target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm"
              >📸 사진 보기</a>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(s.name_ko + ' 햄스터 분양')}`}
                target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm"
              >🔍 정보 더 찾기</a>
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-2.5 text-sm md:grid-cols-4">
          <Fact label="크기" value={s.size_cm} />
          <Fact label="수명" value={s.lifespan_years} />
          <Fact label="성격" value={s.temperament} />
          <Fact label="원산지" value={s.origin} />
        </dl>
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-cocoa-500">
          <span className="h-4 w-1.5 rounded-full bg-peach-400" aria-hidden />소개
        </h2>
        <div className="prose-soft whitespace-pre-line rounded-cute border border-cream-200/80 bg-white/80 p-5">{s.description}</div>
      </section>

      {s.care_tips && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-cocoa-500">
            <span className="h-4 w-1.5 rounded-full bg-mint-400" aria-hidden />사육 팁
          </h2>
          <div className="card whitespace-pre-line prose-soft border-mint-200 bg-mint-50">{s.care_tips}</div>
        </section>
      )}

      {/* 정보 제보 */}
      <div className="flex items-center justify-between rounded-cute border border-cream-200 bg-cream-50 px-4 py-3">
        <p className="text-sm text-cocoa-400">정보가 정확하지 않나요? 햄집사님의 제보로 더 정확해져요.</p>
        <CorrectionButton targetType="species" targetId={s.id} targetSlug={s.slug} targetName={s.name_ko} />
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold text-cocoa-500">관련 가이드</h2>
          <Link
            href={`/guides/new?species=${s.slug}`}
            className="text-sm font-medium text-peach-500 hover:underline"
          >
            이 종으로 가이드 쓰기 →
          </Link>
        </div>
        {relatedGuides && relatedGuides.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {(relatedGuides as GuideWithCounts[]).map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="아직 이 종의 가이드가 없어요"
            description="이 종을 키우는 노하우를 가장 먼저 남겨보세요!"
            action={<Link href={`/guides/new?species=${s.slug}`} className="btn-primary text-sm">가이드 쓰기</Link>}
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
