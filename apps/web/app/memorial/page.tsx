import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

type Row = {
  id: string; name: string; species_label: string | null; emoji: string;
  photo_url: string | null; born_at: string | null; passed_at: string | null;
  message: string | null; tribute_count: number; comment_count: number;
};

function period(m: Row): string {
  return [m.born_at, m.passed_at].filter(Boolean).join('  ~  ');
}

export default async function MemorialPage() {
  const supabase = createSupabaseServerClient();
  const t = makeT(getLocale());
  const { data } = await supabase
    .from('memorials_feed')
    .select('id, name, species_label, emoji, photo_url, born_at, passed_at, message, tribute_count, comment_count')
    .order('created_at', { ascending: false })
    .limit(200);
  const list = (data as Row[]) ?? [];

  return (
    <div className="space-y-6">
      {/* 별나라 하늘 */}
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-b from-lilac-100 via-peach-50 to-cream-100 px-5 py-9 text-center shadow-soft">
        <div className="pointer-events-none absolute inset-0 select-none text-base opacity-70">
          <span className="absolute left-[8%] top-[18%]">✨</span>
          <span className="absolute right-[12%] top-[12%]">⭐</span>
          <span className="absolute left-[22%] top-[60%]">💫</span>
          <span className="absolute right-[18%] top-[55%]">✨</span>
          <span className="absolute left-[46%] top-[8%]">⭐</span>
        </div>
        <div className="text-6xl">🌟</div>
        <h1 className="mt-2 font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('mem.title')}</h1>
        <p className="mt-1 text-sm text-cocoa-400">{t('mem.subtitle')}</p>

        {list.length > 0 && (
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            {list.slice(0, 18).map((m) => (
              <Link key={m.id} href={`/memorial/${m.id}`} className="group flex w-16 flex-col items-center gap-1">
                <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-white text-2xl shadow-soft ring-2 ring-white/80 transition group-hover:-translate-y-1">
                  {m.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                  ) : m.emoji}
                </span>
                <span className="line-clamp-1 text-[11px] font-medium text-cocoa-500">{m.name}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link href="/memorial/new" className="btn-primary">{t('mem.register')}</Link>
        </div>
      </section>

      {/* 주민 리스트 */}
      <section className="space-y-2.5">
        <h2 className="font-display text-lg font-bold text-cocoa-500">{t('mem.residents')} {list.length}</h2>
        {list.length === 0 ? (
          <div className="card text-center text-cocoa-300">{t('mem.empty')}</div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.map((m) => (
              <li key={m.id}>
                <Link href={`/memorial/${m.id}`} className="card flex gap-3.5 transition hover:-translate-y-0.5 hover:shadow-soft">
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
