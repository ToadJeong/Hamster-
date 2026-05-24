import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Hamster, paletteForSpecies } from '@/components/Hamster';
import { GENUS_ORDER, GENUS_INFO, genusForSlug, type GenusKey } from '@/lib/genus';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import type { Species } from '@hamster/shared';

export const revalidate = 60;

type Row = Pick<Species, 'id' | 'slug' | 'name_ko' | 'name_en' | 'summary' | 'image_url'>;

export default async function SpeciesIndex({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createSupabaseServerClient();
  const t = makeT(getLocale());
  const q = (searchParams.q ?? '').trim();

  let query = supabase
    .from('species')
    .select('id, slug, name_ko, name_en, summary, image_url')
    .order('name_ko', { ascending: true });
  if (q) {
    query = query.or(`name_ko.ilike.%${q}%,name_en.ilike.%${q}%,summary.ilike.%${q}%`);
  }
  const { data, error } = await query;
  const list = (data as Row[]) ?? [];

  // genus별 그룹화 + 각 종의 대표(base) 모프
  const byGenus = new Map<GenusKey, Row[]>();
  for (const r of list) {
    const g = genusForSlug(r.slug, r.name_ko);
    if (!byGenus.has(g)) byGenus.set(g, []);
    byGenus.get(g)!.push(r);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('species.title')}</h1>
          <p className="mt-1 text-sm text-cocoa-300">
            {t('species.subtitle')}
          </p>
        </div>
        <form className="hidden md:block">
          <input type="search" name="q" defaultValue={q} placeholder={t('species.searchPlaceholder')} className="input w-64" />
        </form>
      </div>

      {error && (
        <div className="card text-center text-sm text-cocoa-300">{t('species.preparing')}</div>
      )}

      {q ? (
        // 검색 결과: 모프 카드를 평면으로
        list.length === 0 ? (
          <div className="card text-center text-cocoa-300">{t('species.noResult').replace('{q}', q)}</div>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {list.map((s) => (
              <Link key={s.id} href={`/species/${s.slug}`}
                className="group flex items-center gap-3.5 rounded-2xl border border-cream-200/80 bg-white/95 p-3 shadow-softer transition hover:-translate-y-0.5 hover:border-peach-200 hover:shadow-soft">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-100 ring-1 ring-cream-200">
                  {s.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image_url} alt={s.name_ko} className="h-full w-full object-cover" />
                  ) : (
                    <Hamster palette={paletteForSpecies(s.slug, s.name_ko)} className="h-full w-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-cocoa-500 group-hover:text-peach-500">{s.name_ko}</h3>
                  <p className="mt-0.5 line-clamp-1 text-[13px] text-cocoa-400">{s.summary}</p>
                  <p className="mt-0.5 text-[11px] text-mint-400">{GENUS_INFO[genusForSlug(s.slug, s.name_ko)].name_ko}</p>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        // 5종 메인 카드
        <div className="grid gap-3 sm:grid-cols-2">
          {GENUS_ORDER.map((g) => {
            const info = GENUS_INFO[g];
            const morphs = byGenus.get(g) ?? [];
            const count = morphs.length;
            return (
              <Link key={g} href={`/species/${info.baseSlug}`}
                className="group flex gap-4 rounded-3xl border border-cream-200/80 bg-white/95 p-4 shadow-softer transition hover:-translate-y-0.5 hover:border-peach-200 hover:shadow-soft sm:p-5">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-cream-200">
                  <Hamster palette={info.palette} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <h2 className="truncate font-display text-lg font-bold text-cocoa-500 group-hover:text-peach-500">{info.name_ko}</h2>
                    {count > 0 && <span className="shrink-0 rounded-full bg-peach-50 px-1.5 py-0.5 text-[11px] font-bold text-peach-500">{t('species.morphCount').replace('{n}', String(count))}</span>}
                  </div>
                  <p className="text-[11px] italic text-cocoa-300">{info.name_en} · {info.scientific}</p>
                  <p className="mt-1.5 line-clamp-3 text-[13px] text-cocoa-400">{info.blurb}</p>
                  <span className="mt-1.5 inline-block text-xs font-semibold text-peach-500">{t('species.viewMorphs')}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
