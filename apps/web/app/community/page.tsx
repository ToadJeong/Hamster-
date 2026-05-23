import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { COMMUNITY_CATEGORY_LABEL, type CommunityCategory, type CommunityPost } from '@hamster/shared';

export const revalidate = 20;

export default async function CommunityIndex({
  searchParams,
}: {
  searchParams: { c?: CommunityCategory };
}) {
  const supabase = createSupabaseServerClient();
  const cat = searchParams.c;

  let q = supabase
    .from('community_posts')
    .select('id, author_id, anonymous_nickname, title, body, category, created_at, updated_at, author:profiles!community_posts_author_id_fkey(username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(60);

  if (cat) q = q.eq('category', cat);

  const { data, error } = await q;
  const posts = (data as any[]) ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">💬 커뮤니티</h1>
          <p className="mt-1 text-sm text-cocoa-300">햄집사들의 자유로운 이야기 공간</p>
        </div>
        <Link href="/community/new" className="btn-primary text-sm">✏️ 글쓰기</Link>
      </header>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 rounded-cute border border-cream-200 bg-white p-3">
        <Link href="/community" className={'badge ' + (!cat ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>
          전체
        </Link>
        {(Object.keys(COMMUNITY_CATEGORY_LABEL) as CommunityCategory[]).map((k) => {
          const meta = COMMUNITY_CATEGORY_LABEL[k];
          return (
            <Link key={k} href={`/community?c=${k}`}
              className={'badge ' + (cat === k ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>
              {meta.emoji} {meta.label}
            </Link>
          );
        })}
      </div>

      {error?.message?.includes('community_posts') && (
        <div className="card text-amber-500">
          커뮤니티 테이블이 아직 없어요. Supabase에 `0005_announcements_community_rescue.sql`을 적용해 주세요.
        </div>
      )}

      {posts.length === 0 ? (
        <div className="card text-center text-cocoa-300">아직 글이 없어요. 첫 글을 남겨보세요!</div>
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => {
            const display = p.author?.username ?? p.anonymous_nickname ?? '익명';
            const meta = COMMUNITY_CATEGORY_LABEL[p.category as CommunityCategory] ?? COMMUNITY_CATEGORY_LABEL.free;
            return (
              <li key={p.id}>
                <Link href={`/community/${p.id}`} className="card flex gap-3 transition hover:-translate-y-0.5 hover:shadow-soft">
                  <span className="badge bg-cream-100 text-cocoa-500">{meta.emoji} {meta.label}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 font-semibold text-cocoa-500">{p.title}</h3>
                    <p className="mt-1 line-clamp-1 text-sm text-cocoa-300">{p.body}</p>
                    <div className="mt-1 text-xs text-cocoa-300">
                      {display}{!p.author_id && ' · 익명'} · {formatDate(p.created_at)}
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
