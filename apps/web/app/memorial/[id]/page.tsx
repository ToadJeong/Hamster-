import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TributeButton } from '@/components/TributeButton';
import { MemorialCommentSection } from '@/components/MemorialCommentSection';
import { MemorialDeleteButton } from '@/components/MemorialDeleteButton';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function MemorialDetail({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const t = makeT(getLocale());
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('memorials_feed').select('*').eq('id', params.id).maybeSingle();
  if (error || !data) notFound();
  const m = data as any;

  let tributed = false;
  let isStaff = false;
  if (user) {
    const [{ data: tr }, { data: prof }] = await Promise.all([
      supabase.from('memorial_tributes').select('memorial_id').eq('memorial_id', params.id).eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('is_admin, is_moderator').eq('id', user.id).maybeSingle(),
    ]);
    tributed = !!tr;
    isStaff = !!(prof as any)?.is_admin || !!(prof as any)?.is_moderator;
  }
  const isOwner = !!user && m.owner_id === user.id;
  const periodText = [m.born_at, m.passed_at].filter(Boolean).join('  ~  ');

  const { data: commentRows } = await supabase
    .from('memorial_comments')
    .select('id, author_id, body, created_at, author:profiles!memorial_comments_author_id_fkey(username, avatar_url)')
    .eq('memorial_id', params.id)
    .order('created_at', { ascending: true });

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Link href="/memorial" className="text-sm text-cocoa-300 hover:text-peach-500">{t('mem.back')}</Link>

      {/* 추모 카드 */}
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-b from-lilac-100 via-peach-50 to-cream-100 px-5 py-8 text-center shadow-soft">
        <div className="pointer-events-none absolute inset-0 select-none opacity-70">
          <span className="absolute left-[10%] top-[14%]">✨</span>
          <span className="absolute right-[12%] top-[20%]">💫</span>
          <span className="absolute left-[18%] bottom-[12%]">⭐</span>
        </div>
        <span className="mx-auto grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-white text-5xl shadow-soft ring-4 ring-white/80">
          {m.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
          ) : m.emoji}
        </span>
        <h1 className="mt-3 font-display text-2xl font-bold text-cocoa-500">{m.name}</h1>
        {m.species_label && <p className="text-sm text-mint-400">#{m.species_label}</p>}
        {periodText && <p className="mt-1 text-sm text-cocoa-400">⭐ {periodText}</p>}
        <p className="mt-1 text-xs text-cocoa-300">{m.owner_username ?? ''}</p>
        <div className="mt-4 flex justify-center">
          <TributeButton memorialId={m.id} initialCount={m.tribute_count ?? 0} initialTributed={tributed} isAuthed={!!user} />
        </div>
      </section>

      {m.message && (
        <section className="card bg-white">
          <p className="mb-1 text-sm font-semibold text-lilac-400">💌 {t('mem.letter')}</p>
          <p className="whitespace-pre-line text-[15px] leading-7 text-cocoa-500">{m.message}</p>
        </section>
      )}

      {(isOwner || isStaff) && (
        <div className="flex justify-end">
          <MemorialDeleteButton id={m.id} />
        </div>
      )}

      <MemorialCommentSection
        memorialId={m.id}
        initialComments={(commentRows as any[]) ?? []}
        currentUserId={user?.id ?? null}
        isStaff={isStaff}
      />
    </article>
  );
}
