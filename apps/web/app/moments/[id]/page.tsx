import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { MomentDetailActions } from '@/components/MomentDetailActions';
import { MomentCommentSection } from '@/components/MomentCommentSection';
import type { MomentFeed } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function MomentDetail({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase.from('moments_feed').select('*').eq('id', params.id).maybeSingle();
  if (error || !data) notFound();
  const m = data as MomentFeed;

  let isStaff = false;
  if (user) {
    const { data: pr } = await supabase.from('profiles').select('is_admin, is_moderator').eq('id', user.id).maybeSingle();
    isStaff = !!(pr as any)?.is_admin || !!(pr as any)?.is_moderator;
  }
  const isAuthor = user?.id === m.author_id;

  const { data: comments } = await supabase
    .from('moment_comments')
    .select('id, moment_id, author_id, body, created_at, author:profiles!moment_comments_author_id_fkey(username, avatar_url)')
    .eq('moment_id', m.id)
    .order('created_at', { ascending: true });

  return (
    <article className="mx-auto max-w-xl space-y-4">
      <Link href="/moments" className="text-sm text-cocoa-300 hover:text-peach-500">← 모먼트</Link>

      <div className="overflow-hidden rounded-cute border border-cream-200/80 bg-white shadow-softer">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2.5">
            {m.author_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.author_avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-peach-200">🐹</span>
            )}
            <div>
              <p className="text-sm font-bold text-cocoa-500">
                {m.author_username ?? '햄집사'}{m.pet_name && <span className="ml-1 font-normal text-cocoa-300">· {m.pet_name}</span>}
              </p>
              <p className="text-[11px] text-cocoa-300">{formatDate(m.created_at)}</p>
            </div>
          </div>
          {(isAuthor || isStaff) && <MomentDetailActions momentId={m.id} canStaff={isStaff && !isAuthor} />}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.image_url} alt={m.caption ?? ''} className="w-full bg-cream-50 object-cover" />
        {m.caption && (
          <p className="whitespace-pre-line px-4 py-3 text-[15px] leading-6 text-cocoa-500">
            <span className="font-bold">{m.author_username ?? '햄집사'}</span> {m.caption}
          </p>
        )}
      </div>

      <MomentCommentSection
        momentId={m.id}
        initialComments={(comments as any[]) ?? []}
        currentUserId={user?.id ?? null}
        isStaff={isStaff}
      />
    </article>
  );
}
