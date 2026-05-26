import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import { MemorialStar } from '@/components/MemorialStar';

export const dynamic = 'force-dynamic';

type Row = {
  id: string; owner_id: string; name: string; species_label: string | null; emoji: string;
  photo_url: string | null; born_at: string | null; passed_at: string | null;
  message: string | null; hidden: boolean; tribute_count: number; comment_count: number;
};

function period(m: Row): string {
  return [m.born_at, m.passed_at].filter(Boolean).join('  ~  ');
}

export default async function MemorialPage() {
  const supabase = createSupabaseServerClient();
  const t = makeT(getLocale());
  const { data: { user } } = await supabase.auth.getUser();

  // 공개(hidden=false) + 내가 올린 숨김글은 나에게만 보임
  let query = supabase
    .from('memorials_feed')
    .select('id, owner_id, name, species_label, emoji, photo_url, born_at, passed_at, message, hidden, tribute_count, comment_count')
    .order('created_at', { ascending: false })
    .limit(200);
  query = user ? query.or(`hidden.eq.false,owner_id.eq.${user.id}`) : query.eq('hidden', false);
  const { data } = await query;
  const list = (data as Row[]) ?? [];
  const orbit = list.filter((m) => !m.hidden).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* 별나라 하늘 — 원형으로 둥실둥실 */}
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-b from-lilac-100 via-peach-50 to-cream-100 px-5 py-8 text-center shadow-soft">
        <div className="pointer-events-none absolute inset-0 select-none text-base opacity-70">
          <span className="absolute left-[8%] top-[14%]">✨</span>
          <span className="absolute right-[10%] top-[12%]">⭐</span>
          <span className="absolute left-[14%] bottom-[14%]">💫</span>
          <span className="absolute right-[16%] bottom-[18%]">✨</span>
        </div>

        <div className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72">
          {/* 가운데 별 (반짝임, 고정) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="star-twinkle block"><MemorialStar className="h-24 w-24 sm:h-28 sm:w-28" /></span>
          </div>
          {/* 별을 중심으로 공전하는 주민들 */}
          {orbit.length > 0 && (
            <div className="orbit-ring absolute inset-0">
              {orbit.map((m, i) => {
                const angle = (360 / orbit.length) * i;
                const radius = orbit.length === 1 ? 0 : 104;
                return (
                  <div
                    key={m.id}
                    className="absolute left-1/2 top-1/2"
                    style={{ transform: `rotate(${angle}deg) translateY(-${radius}px)` }}
                  >
                    <div style={{ transform: `translate(-50%, -50%) rotate(${-angle}deg)` }}>
                      <Link href={`/memorial/${m.id}`} title={m.name} className="orbit-counter block">
                        <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-white text-xl shadow-soft ring-2 ring-white/80 transition hover:ring-peach-200 sm:h-14 sm:w-14">
                          {m.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : m.emoji}
                        </span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('mem.title')}</h1>
        <p className="mt-1 text-sm text-cocoa-400">{t('mem.subtitle')}</p>
        <div className="mt-5">
          <Link href="/memorial/new" className="btn-primary">{t('mem.register')}</Link>
        </div>
      </section>

      {/* 주민 리스트 */}
      <section className="space-y-2.5">
        <h2 className="font-display text-lg font-bold text-cocoa-500">{t('mem.residents')} {list.filter((m) => !m.hidden).length}</h2>
        {list.length === 0 ? (
          <div className="card text-center text-cocoa-300">{t('mem.empty')}</div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.map((m) => (
              <li key={m.id}>
                <Link href={`/memorial/${m.id}`} className={'card flex gap-3.5 transition hover:-translate-y-0.5 hover:shadow-soft ' + (m.hidden ? 'opacity-60' : '')}>
                  <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-lilac-50 text-3xl ring-1 ring-cream-200">
                    {m.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : m.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-cocoa-500">
                      {m.name}
                      {m.species_label && <span className="ml-1 text-xs font-normal text-mint-400">#{m.species_label}</span>}
                      {m.hidden && <span className="ml-1 rounded-full bg-cocoa-100 px-1.5 text-[10px] font-medium text-cocoa-400">{t('mem.hiddenBadge')}</span>}
                    </p>
                    {period(m) && <p className="text-[11px] text-cocoa-300">⭐ {period(m)}</p>}
                    {m.message && <p className="mt-0.5 line-clamp-2 text-[13px] text-cocoa-400">{m.message}</p>}
                    <p className="mt-1 text-[11px] text-cocoa-300">🌟 {m.tribute_count} · 💌 {m.comment_count}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
