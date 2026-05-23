import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/site-settings';
import { formatDate } from '@/lib/format';
import { CommunityActions } from '@/components/CommunityActions';
import { CommunityCommentSection } from '@/components/CommunityCommentSection';
import { CommunityAuthorActions } from '@/components/CommunityAuthorActions';
import { ReportButton } from '@/components/ReportButton';
import { ViewTracker } from '@/components/ViewTracker';
import { COMMUNITY_CATEGORY_LABEL, type CommunityCategory } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function CommunityDetail({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const settings = await getSiteSettings();

  const { data, error } = await supabase
    .from('community_posts_feed')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) notFound();
  const p = data as any;
  const display = p.author_username ?? p.anonymous_nickname ?? '익명';
  const meta = COMMUNITY_CATEGORY_LABEL[p.category as CommunityCategory] ?? COMMUNITY_CATEGORY_LABEL.free;

  const [likeRes, followRes, commentsRes] = await Promise.all([
    user
      ? supabase.from('community_likes').select('user_id').eq('post_id', p.id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user && p.author_id
      ? supabase.from('follows').select('followee_id').eq('follower_id', user.id).eq('followee_id', p.author_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('community_comments')
      .select('id, post_id, author_id, anonymous_nickname, body, created_at, author:profiles!community_comments_author_id_fkey(username, avatar_url)')
      .eq('post_id', p.id)
      .order('created_at', { ascending: true }),
  ]);

  const liked = !!(likeRes as any).data;
  const following = !!(followRes as any).data;
  const comments = ((commentsRes as any).data as any[]) ?? [];

  const isAuthor = user && p.author_id && p.author_id === user.id;
  const isAnonymousPost = !p.author_id;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/community" className="text-sm text-cocoa-300 hover:text-peach-500">← 커뮤니티</Link>

      {p.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.cover_url} alt="" className="aspect-[16/9] w-full rounded-cute object-cover" />
      )}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="badge bg-cream-100 text-cocoa-500">{meta.emoji} {meta.label}</span>
          {(p.tags as string[] ?? []).map((t) => (
            <Link key={t} href={`/community?tag=${encodeURIComponent(t)}`} className="badge bg-lilac-50 text-lilac-400 hover:bg-lilac-100">#{t}</Link>
          ))}
        </div>
        <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{p.title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-cocoa-400">
            {p.author_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.author_avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-peach-200">🐹</span>
            )}
            <span>{display}{!p.author_id && ' · 익명'}</span>
            <span className="text-xs text-cocoa-300">· {formatDate(p.created_at)}</span>
            <span className="text-xs text-cocoa-300">·</span>
            <ViewTracker type="community" id={p.id} initialCount={p.view_count ?? 0} showCount />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user && p.author_id && p.author_id !== user.id && (
              <CommunityActions
                postId={p.id}
                authorId={p.author_id}
                initialLiked={liked}
                initialLikeCount={p.like_count ?? 0}
                initialFollowing={following}
              />
            )}
            {!isAuthor && <ReportButton targetType="community" targetId={p.id} />}
          </div>
        </div>

        {(isAuthor || isAnonymousPost) && (
          <CommunityAuthorActions postId={p.id} canEdit={!!isAuthor} isAnonymous={isAnonymousPost} />
        )}
      </header>

      <div className="prose-soft whitespace-pre-line text-[15px]">{p.body}</div>

      <hr className="border-cream-200" />

      <CommunityCommentSection
        postId={p.id}
        initialComments={comments}
        currentUserId={user?.id ?? null}
        allowAnonymous={settings['app.allow_anonymous']}
      />
    </article>
  );
}
