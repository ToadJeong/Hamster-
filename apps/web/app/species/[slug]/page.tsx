import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GuideCard } from '@/components/GuideCard';
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

      <header className="overflow-hidden rounded-cute bg-gradient-to-br from-cream-100 to-peach-100 p-6 md:p-8">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="grid aspect-square w-32 shrink-0 place-items-center rounded-cute bg-white text-6xl shadow-softer md:w-44">
            {s.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image_url} alt={s.name_ko} className="h-full w-full rounded-cute object-cover" />
            ) : (
              '🐹'
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold text-cocoa-500 md:text-4xl">{s.name_ko}</h1>
            <p className="mt-1 text-cocoa-400">
              {s.name_en}
              {s.scientific_name && <span className="ml-2 italic">· {s.scientific_name}</span>}
            </p>
            <p className="mt-3 text-cocoa-500">{s.summary}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Fact label="크기" value={s.size_cm} />
          <Fact label="수명" value={s.lifespan_years} />
          <Fact label="성격" value={s.temperament} />
          <Fact label="원산지" value={s.origin} />
        </dl>
      </header>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-cocoa-500">소개</h2>
        <p className="prose-soft whitespace-pre-line">{s.description}</p>
      </section>

      {s.care_tips && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold text-cocoa-500">사육 팁</h2>
          <div className="card whitespace-pre-line prose-soft bg-mint-50">{s.care_tips}</div>
        </section>
      )}

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
          <div className="card text-center text-cocoa-300">
            아직 이 종에 대한 가이드가 없어요. 첫 가이드를 작성해 보세요!
          </div>
        )}
      </section>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-white/70 p-3">
      <dt className="text-xs text-cocoa-300">{label}</dt>
      <dd className="font-medium text-cocoa-500">{value ?? '—'}</dd>
    </div>
  );
}
