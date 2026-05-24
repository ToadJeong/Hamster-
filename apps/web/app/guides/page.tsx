import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GuideCard } from '@/components/GuideCard';
import { EmptyState } from '@/components/EmptyState';
import type { GuideWithCounts, Species } from '@hamster/shared';

export const revalidate = 30;

export default async function GuidesIndex({
  searchParams,
}: {
  searchParams: { species?: string };
}) {
  const supabase = createSupabaseServerClient();
  const speciesSlug = searchParams.species;

  // 종 필터 옵션
  const { data: speciesList } = await supabase
    .from('species')
    .select('slug, name_ko')
    .order('name_ko', { ascending: true });

  let query = supabase
    .from('guides_with_counts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (speciesSlug) {
    query = query.eq('species_slug', speciesSlug);
  }

  const { data, error } = await query;
  const guides = (data as GuideWithCounts[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">📖 사육 가이드</h1>
          <p className="mt-1 text-sm text-cocoa-300">햄집사들이 직접 쓴 사육법, 팁, 경험담</p>
        </div>
        <Link href="/guides/new" className="btn-primary text-sm">✏️ 가이드 쓰기</Link>
      </div>

      {error && (
        <div className="card text-center text-sm text-cocoa-300">
          📖 가이드를 준비하고 있어요. 잠시 후 다시 와 주세요!
        </div>
      )}

      {/* 종 필터 */}
      <div className="flex flex-wrap gap-2 rounded-cute border border-cream-200 bg-white p-3">
        <Link
          href="/guides"
          className={
            'badge ' + (!speciesSlug ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')
          }
        >
          전체
        </Link>
        {(speciesList as Pick<Species,'slug'|'name_ko'>[] ?? []).map((s) => (
          <Link
            key={s.slug}
            href={`/guides?species=${s.slug}`}
            className={
              'badge ' +
              (speciesSlug === s.slug ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')
            }
          >
            #{s.name_ko}
          </Link>
        ))}
      </div>

      {guides.length === 0 ? (
        <EmptyState
          title="아직 가이드가 없어요"
          description="사육 노하우·꿀팁·경험담을 가장 먼저 나눠보세요!"
          action={<Link href="/guides/new" className="btn-primary text-sm">가이드 쓰기</Link>}
          kind="teddy"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {guides.map((g) => <GuideCard key={g.id} guide={g} />)}
        </div>
      )}
    </div>
  );
}
