import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { ReadBadge } from '@/components/ReadBadge';
import { EmptyState } from '@/components/EmptyState';
import { Media } from '@/components/Media';
import { isVideoUrl } from '@/lib/media';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import { COMMUNITY_CATEGORY_LABEL, type CommunityCategory } from '@hamster/shared';

export const revalidate = 15;

export default async function CommunityIndex({
  searchParams,
}: {
  searchParams: { c?: CommunityCategory; tag?: string; feed?: 'all' | 'following' };
}) {
  const supabase = createSupabaseServerClient();
  const t = makeT(getLocale());
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
    for (const tg of (p.tags as string[]) ?? []) {
      tagCount.set(tg, (tagCount.get(tg) ?? 0) + 1);
    }
  }
  const topTags = Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([tg]) => tg);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('community.title')}</h1>
          <p className="mt-1 text-sm text-cocoa-300">{t('community.subtitle')}</p>
        </div>
        <Link href="/community/new" className="btn-primary text-sm">{t('community.write')}</Link>
      </header>

      {/* 피드 탭 */}
      <div className="flex gap-2 border-b border-cream-200">
        <FeedTab href="/community?feed=all" active={feed === 'all'}>{t('feed.all')}</FeedTab>
        {user && <FeedTab href="/community?feed=following" active={feed === 'following'}>{t('feed.following')}</FeedTab>}
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 rounded-cute border border-cream-200 bg-white p-3">
        <Link href={`/community?feed=${feed}`} className={'badge ' + (!cat && !tag ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>
          {t('common.all')}
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
          {topTags.map((tg) => (
            <Link key={tg} href={`/community?tag=${encodeURIComponent(tg)}`}
              className={'badge ' + (tag === tg ? 'bg-lilac-200 text-lilac-400' : 'hover:bg-cream-200')}>
              #{tg}
            </Link>
          ))}
        </div>
      )}

      {error && (
        <div className="card text-center text-sm text-cocoa-300">
          {t('community.preparing')}
        </div>
      )}

      {posts.length === 0 ? (
        feed === 'following' ? (
          <EmptyState title={t('community.emptyFollowTitle')} description={t('community.emptyFollowDesc')} kind="winterwhite" />
        ) : (
          <EmptyState
            title={t('community.emptyTitle')}
            description={t('community.emptyDesc')}
            action={<Link href="/community/new" className="btn-primary text-sm">{t('community.emptyAction')}</Link>}
          />
        )
      ) : (
        <ul className="space-y-2">
          {posts.map((p: any) => {
            const display = p.author_username ?? p.anonymous_nickname ?? t('common.anonymous');
            const meta = COMMUNITY_CATEGORY_LABEL[p.category as CommunityCategory] ?? COMMUNITY_CATEGORY_LABEL.free;
            return (
              <li key={p.id}>
                <Link href={`/community/${p.id}`} className="group flex gap-3 rounded-2xl border border-cream-200/80 bg-white/95 p-3.5 shadow-softer transition hover:-translate-y-0.5 hover:border-peach-200 hover:shadow-soft has-[[data-read=true]]:opacity-55 sm:p-4">
                  {p.cover_url ? (
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-cream-200">
                      <Media url={p.cover_url} className="h-full w-full object-cover" />
                      {isVideoUrl(p.cover_url) && (
                        <span className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-black/45 text-[9px] text-white">▶</span>
                      )}
                    </span>
                  ) : (
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-cream-100 text-xl text-cocoa-300">{meta.emoji}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="rounded-md bg-peach-50 px-1.5 py-0.5 text-[11px] font-bold text-peach-500">{meta.label}</span>
                      {(p.tags as string[] ?? []).slice(0, 2).map((tg) => (
                        <span key={tg} className="text-[11px] font-medium text-lilac-400">#{tg}</span>
                      ))}
                      <ReadBadge type="community" id={p.id} />
                    </div>
                    <h3 className="line-clamp-1 font-bold text-cocoa-500 group-hover:text-peach-500">{p.title}</h3>
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-cocoa-400">{p.body}</p>
                    <div className="mt-1.5 flex items-center gap-2.5 text-[11px] text-cocoa-300">
                      <span className="font-medium text-cocoa-400">{display}{!p.author_id && ' · ' + t('common.anonymous')}</span>
                      <span>{formatDate(p.created_at)}</span>
                      <span>♥ {p.like_count ?? 0}</span>
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
