import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { ReadBadge } from '@/components/ReadBadge';
import { COMMUNITY_CATEGORY_LABEL, type CommunityCategory } from '@hamster/shared';

export const revalidate = 15;

export default async function CommunityIndex({
  searchParams,
}: {
  searchParams: { c?: CommunityCategory; tag?: string; feed?: 'all' | 'following' };
}) {
  const supabase = createSupabaseServerClient();
  const cat = searchParams.c;
  const tag = searchParams.tag;
  const feed = searchParams.feed ?? 'all';

  const { data: { user } } = await supabase.auth.getUser();

  // following 피드: 내가 팔로우한 사람 id 목록
  let followeeIds: string[] = [];
  if (user && feed === 'following') {
    const { data } = await supabase.from('follows').select('followee_id').eq('follower_id', user.id);
    followeeIds = ((data ?? []) as any[]).map((r) => r.followee_id);
  }

  let q = supabase
    .from('community_posts_feed')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(60);

  if (cat) q = q.eq('category', cat);
  if (tag) q = q.contains('tags', [tag]);
  if (feed === 'following' && followeeIds.length > 0) q = q.in('author_id', followeeIds);
  if (feed === 'following' && followeeIds.length === 0) q = q.eq('author_id', '00000000-0000-0000-0000-000000000000');

  const { data, error } = await q;
  const posts = (data as any[]) ?? [];

  // 인기 태그 (상위 12개)
  const tagCount = new Map<string, number>();
  for (const p of posts) {
    for (const t of (p.tags as string[]) ?? []) {
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
  }
  const topTags = Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">💬 커뮤니티</h1>
          <p className="mt-1 text-sm text-cocoa-300">햄집사들의 자유로운 이야기 공간</p>
        </div>
        <Link href="/community/new" className="btn-primary text-sm">✏️ 글쓰기</Link>
      </header>

      {/* 피드 탭 */}
      <div className="flex gap-2 border-b border-cream-200">
        <FeedTab href="/community?feed=all" active={feed === 'all'}>🌎 전체</FeedTab>
        {user && <FeedTab href="/community?feed=following" active={feed === 'following'}>⭐ 팔로잉</FeedTab>}
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 rounded-cute border border-cream-200 bg-white p-3">
        <Link href={`/community?feed=${feed}`} className={'badge ' + (!cat && !tag ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>
          전체
        </Link>
        {(Object.keys(COMMUNITY_CATEGORY_LABEL) as CommunityCategory[]).map((k) => {
          const meta = COMMUNITY_CATEGORY_LABEL[k];
          return (
            <Link key={k} href={`/community?feed=${feed}&c=${k}`}
              className={'badge ' + (cat === k ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>
              {meta.emoji} {meta.label}
            </Link>
          );
        })}
      </div>

      {topTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topTags.map((t) => (
            <Link key={t} href={`/community?tag=${encodeURIComponent(t)}`}
              className={'badge ' + (tag === t ? 'bg-lilac-200 text-lilac-400' : 'hover:bg-cream-200')}>
              #{t}
            </Link>
          ))}
        </div>
      )}

      {error && (
        <div className="card text-center text-sm text-cocoa-300">
          💬 커뮤니티를 준비하고 있어요. 잠시 후 다시 와 주세요!
        </div>
      )}

      {posts.length === 0 ? (
        <div className="card text-center text-cocoa-300">
          {feed === 'following'
            ? '팔로우한 햄집사가 아직 없어요. 마음에 드는 글의 작성자를 팔로우해 보세요!'
            : '아직 글이 없어요. 첫 글을 남겨보세요!'}
        </div>
      ) : (
        <ul className="space-y-2">
          {posts.map((p: any) => {
            const display = p.author_username ?? p.anonymous_nickname ?? '익명';
            const meta = COMMUNITY_CATEGORY_LABEL[p.category as CommunityCategory] ?? COMMUNITY_CATEGORY_LABEL.free;
            return (
              <li key={p.id}>
                <Link href={`/community/${p.id}`} className="card flex gap-3 transition hover:-translate-y-0.5 hover:shadow-soft has-[[data-read=true]]:opacity-60">
                  {p.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover_url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span className="badge bg-cream-100 text-cocoa-500">{meta.emoji} {meta.label}</span>
                      {(p.tags as string[] ?? []).slice(0, 3).map((t) => (
                        <span key={t} className="badge bg-lilac-50 text-lilac-400">#{t}</span>
                      ))}
                      <ReadBadge type="community" id={p.id} />
                    </div>
                    <h3 className="line-clamp-1 font-semibold text-cocoa-500">{p.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-cocoa-300">{p.body}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-cocoa-300">
                      <span>{display}{!p.author_id && ' · 익명'}</span>
                      <span>{formatDate(p.created_at)}</span>
                      <span>❤ {p.like_count ?? 0}</span>
                      <span>💬 {p.comment_count ?? 0}</span>
                      <span>👁 {p.view_count ?? 0}</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FeedTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href}
      className={
        'border-b-2 px-3 py-2 text-sm font-medium transition ' +
        (active ? 'border-peach-400 text-peach-500' : 'border-transparent text-cocoa-300 hover:text-cocoa-500')
      }
    >
      {children}
    </Link>
  );
}
