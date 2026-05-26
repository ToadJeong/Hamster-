import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RichBody } from '@/components/RichBody';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/site-settings';
import { formatDate } from '@/lib/format';
import { LikeButton } from '@/components/LikeButton';
import { CommentSection } from '@/components/CommentSection';
import { GuideActions } from '@/components/GuideActions';
import { ViewTracker } from '@/components/ViewTracker';
import { ReportButton } from '@/components/ReportButton';
import { StaffDeleteButton } from '@/components/StaffDeleteButton';
import { CorrectionButton } from '@/components/CorrectionButton';
import type { GuideWithCounts, CommentWithAuthor } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function GuideDetail({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  const settings = await getSiteSettings();

  let isStaff = false;
  if (user) {
    const { data: pr } = await supabase.from('profiles').select('is_admin, is_moderator').eq('id', user.id).maybeSingle();
    isStaff = !!(pr as any)?.is_admin || !!(pr as any)?.is_moderator;
  }

  const { data: guide } = await supabase
    .from('guides_with_counts')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!guide) notFound();
  const g = guide as GuideWithCounts;
  const { data: gImg } = await supabase.from('guides').select('images').eq('id', params.id).maybeSingle();
  const gallery: string[] = ((gImg as any)?.images?.length ? (gImg as any).images : (g.cover_url ? [g.cover_url] : [])) as string[];

  // 좋아요 여부
  let liked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from('likes')
      .select('user_id')
      .eq('guide_id', g.id)
      .eq('user_id', user.id)
      .maybeSingle();
    liked = !!likeRow;
  }

  // 댓글
  const { data: commentsData } = await supabase
    .from('comments')
    .select('id, guide_id, author_id, anonymous_nickname, body, created_at, author:profiles!comments_author_id_fkey(username, avatar_url)')
    .eq('guide_id', g.id)
    .order('created_at', { ascending: true });

  const comments = (commentsData as unknown as CommentWithAuthor[]) ?? [];

  const isAuthor = user?.id === g.author_id && g.author_id !== null;
  const isAnonymousGuide = g.author_id === null;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/guides" className="text-sm text-cocoa-300 hover:text-peach-500">
        ← 가이드 목록
      </Link>

      {gallery.length > 0 && (
        <div className={gallery.length === 1 ? '' : 'grid grid-cols-2 gap-2'}>
          {gallery.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className={'w-full rounded-cute object-cover shadow-softer ' + (gallery.length === 1 ? 'aspect-[16/9]' : 'aspect-square')}
            />
          ))}
        </div>
      )}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-cocoa-300">
          {g.species_name_ko && g.species_slug && (
            <Link href={`/species/${g.species_slug}`} className="badge bg-mint-100 text-mint-400 hover:bg-mint-200">
              #{g.species_name_ko}
            </Link>
          )}
          <span>{formatDate(g.created_at)}</span>
          {g.updated_at !== g.created_at && <span>· 수정됨</span>}
          <span>·</span>
          <ViewTracker type="guide" id={g.id} initialCount={(g as any).view_count ?? 0} showCount />
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight text-cocoa-500 md:text-4xl">
          {g.title}
        </h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-cocoa-400">
            {g.author_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.author_avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-peach-200">🐹</span>
            )}
            <span>{g.author_username ?? '익명'}</span>
            {isAnonymousGuide && <span className="badge bg-cocoa-100 text-cocoa-400">익명</span>}
          </div>
          <div className="flex items-center gap-2">
            {(isAuthor || isAnonymousGuide) && (
              <GuideActions guideId={g.id} isAnonymous={isAnonymousGuide} canEdit={isAuthor} />
            )}
            {isStaff && !isAuthor && (
              <Link
                href={`/guides/${g.id}/edit`}
                className="inline-flex items-center gap-1 rounded-full border border-lilac-200 bg-white px-3 py-1.5 text-sm font-medium text-lilac-400 shadow-softer hover:bg-lilac-50"
              >
                🛡 운영자 수정
              </Link>
            )}
          </div>
        </div>
      </header>

      <RichBody text={g.body} className="prose-soft" />

      <div className="flex items-center justify-between border-y border-cream-200 py-4">
        <LikeButton
          guideId={g.id}
          initialLiked={liked}
          initialCount={g.like_count}
          isAuthed={!!user}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-cocoa-300">💬 {g.comment_count} · ❤ {g.like_count}</span>
          {!isAuthor && <ReportButton targetType="guide" targetId={g.id} />}
          {isStaff && !isAuthor && <StaffDeleteButton type="guide" id={g.id} redirectTo="/guides" />}
        </div>
      </div>

      {/* 잘못된 정보 제보 */}
      <div className="flex items-center justify-between rounded-cute border border-cream-200 bg-cream-50 px-4 py-3">
        <p className="text-sm text-cocoa-400">내용이 정확하지 않나요? 제보로 더 정확해져요.</p>
        <CorrectionButton targetType="guide" targetId={g.id} targetName={g.title} />
      </div>

      <CommentSection
        guideId={g.id}
        initialComments={comments}
        currentUserId={user?.id ?? null}
        allowAnonymous={settings['app.allow_anonymous']}
      />
    </article>
  );
}
