import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Media } from '@/components/Media';
import { isVideoUrl } from '@/lib/media';
import { EmptyState } from '@/components/EmptyState';
import type { MomentFeed } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function MomentsPage({
  searchParams,
}: {
  searchParams: { feed?: 'all' | 'following' };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const feed = searchParams.feed ?? 'all';

  let followeeIds: string[] = [];
  if (user && feed === 'following') {
    const { data } = await supabase.from('follows').select('followee_id').eq('follower_id', user.id);
    followeeIds = ((data ?? []) as any[]).map((r) => r.followee_id);
  }

  let q = supabase.from('moments_feed').select('*').order('created_at', { ascending: false }).limit(40);
  if (feed === 'following') {
    q = followeeIds.length > 0
      ? q.in('author_id', followeeIds)
      : q.eq('author_id', '00000000-0000-0000-0000-000000000000');
  }
  const { data, error } = await q;
  const moments = (data as MomentFeed[]) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">✨ 모먼트</h1>
          <p className="mt-1 text-sm text-cocoa-300">우리집 햄찌의 귀여운 순간을 기록하고 나눠요</p>
        </div>
        <Link href="/moments/new" className="btn-primary text-sm">📸 기록하기</Link>
      </header>

      <div className="flex gap-2 border-b border-cream-200">
        <FeedTab href="/moments?feed=all" active={feed === 'all'}>🌎 전체</FeedTab>
        {user && <FeedTab href="/moments?feed=following" active={feed === 'following'}>⭐ 팔로잉</FeedTab>}
      </div>

      {error && <EmptyState title="모먼트를 준비하고 있어요" description="잠시 후 다시 와 주세요!" />}

      {moments.length === 0 ? (
        feed === 'following' ? (
          <EmptyState title="팔로잉 모먼트가 없어요" description="마음에 드는 햄집사를 팔로우하면 여기에 모여요." kind="winterwhite" />
        ) : (
          <EmptyState
            title="첫 모먼트를 남겨보세요"
            description="우리집 햄찌의 일상 사진을 올리고 햄집사들과 나눠요!"
            action={<Link href="/moments/new" className="btn-primary text-sm">📸 기록하기</Link>}
            kind="golden"
          />
        )
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {moments.map((m) => (
            <Link key={m.id} href={`/moments/${m.id}`}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-cream-200">
              <Media url={m.image_url} alt={m.caption ?? ''} className="h-full w-full object-cover transition group-hover:scale-105" />
              {isVideoUrl(m.image_url) && (
                <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/45 text-xs text-white">▶</span>
              )}
              {/* 하단 그라데이션 + 좋아요/댓글 */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/55 to-transparent px-2.5 pb-1.5 pt-6 text-[12px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                <span>❤ {m.like_count}</span>
                <span>💬 {m.comment_count}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FeedTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href}
      className={'border-b-2 px-3 py-2 text-sm font-bold transition ' +
        (active ? 'border-peach-400 text-peach-500' : 'border-transparent text-cocoa-300 hover:text-cocoa-500')}>
      {children}
    </Link>
  );
}
