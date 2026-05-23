import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GuideCard } from '@/components/GuideCard';
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
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa-500">사육 가이드</h1>
          <p className="mt-1 text-sm text-cocoa-300">햄집사들이 직접 쓴 사육법, 팁, 경험담</p>
        </div>
        <Link href="/guides/new" className="btn-primary">✏️ 가이드 쓰기</Link>
      </div>

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

      {error && (
        <div className="card text-red-500">불러오는 중 오류: {error.message}</div>
      )}

      {guides.length === 0 ? (
        <div className="card text-center text-cocoa-300">
          아직 가이드가 없어요. 첫 가이드를 작성해 보세요!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {guides.map((g) => <GuideCard key={g.id} guide={g} />)}
        </div>
      )}
    </div>
  );
}
