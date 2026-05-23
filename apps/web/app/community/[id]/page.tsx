import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { CommunityActions } from '@/components/CommunityActions';
import { COMMUNITY_CATEGORY_LABEL, type CommunityCategory } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function CommunityDetail({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('community_posts_feed')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) notFound();
  const p = data as any;
  const display = p.author_username ?? p.anonymous_nickname ?? '익명';
  const meta = COMMUNITY_CATEGORY_LABEL[p.category as CommunityCategory] ?? COMMUNITY_CATEGORY_LABEL.free;

  // 좋아요 여부 / 팔로우 여부
  let liked = false; let following = false;
  if (user) {
    const [{ data: l }, { data: f }] = await Promise.all([
      supabase.from('community_likes').select('user_id').eq('post_id', p.id).eq('user_id', user.id).maybeSingle(),
      p.author_id
        ? supabase.from('follows').select('followee_id').eq('follower_id', user.id).eq('followee_id', p.author_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    liked = !!l;
    following = !!f;
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/community" className="text-sm text-cocoa-300 hover:text-peach-500">← 커뮤니티</Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="badge bg-cream-100 text-cocoa-500">{meta.emoji} {meta.label}</span>
          {(p.tags as string[] ?? []).map((t) => (
            <Link key={t} href={`/community?tag=${encodeURIComponent(t)}`} className="badge bg-lilac-50 text-lilac-400 hover:bg-lilac-100">#{t}</Link>
          ))}
        </div>
        <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{p.title}</h1>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-cocoa-400">
            {p.author_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.author_avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-peach-200">🐹</span>
            )}
            <span>{display}{!p.author_id && ' · 익명'}</span>
            <span className="text-xs text-cocoa-300">· {formatDate(p.created_at)}</span>
          </div>
          {user && p.author_id && p.author_id !== user.id && (
            <CommunityActions
              postId={p.id}
              authorId={p.author_id}
              initialLiked={liked}
              initialLikeCount={p.like_count ?? 0}
              initialFollowing={following}
            />
          )}
        </div>
      </header>

      <div className="prose-soft whitespace-pre-line text-[15px]">{p.body}</div>

      <div className="card text-sm text-cocoa-300">
        💬 댓글 기능은 다음 업데이트에서 추가됩니다.
      </div>
    </article>
  );
}
