import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GuideCard } from '@/components/GuideCard';
import {
  RESCUE_KIND_LABEL,
  type GuideWithCounts, type Species, type RescuePostWithAuthor,
} from '@hamster/shared';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const supabase = createSupabaseServerClient();

  let speciesMatches: Pick<Species,'id'|'slug'|'name_ko'|'name_en'|'summary'|'image_url'>[] = [];
  let guideMatches: GuideWithCounts[] = [];
  let communityMatches: any[] = [];
  let rescueMatches: RescuePostWithAuthor[] = [];
  let announcementMatches: any[] = [];
  let commentMatches: any[] = [];

  if (q) {
    const [s, g, c, r, a, gc, cc] = await Promise.all([
      supabase.from('species').select('id, slug, name_ko, name_en, summary, image_url')
        .or(`name_ko.ilike.%${q}%,name_en.ilike.%${q}%,scientific_name.ilike.%${q}%,summary.ilike.%${q}%,description.ilike.%${q}%`)
        .order('name_ko'),
      supabase.from('guides_with_counts').select('*')
        .or(`title.ilike.%${q}%,body.ilike.%${q}%,author_username.ilike.%${q}%`)
        .order('created_at', { ascending: false }).limit(30),
      supabase.from('community_posts').select('id, title, body, category, created_at, anonymous_nickname, author:profiles!community_posts_author_id_fkey(username)')
        .or(`title.ilike.%${q}%,body.ilike.%${q}%`)
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('rescue_posts_with_author').select('*')
        .or(`title.ilike.%${q}%,body.ilike.%${q}%,region.ilike.%${q}%`)
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('announcements').select('id, title, body, created_at, pinned')
        .or(`title.ilike.%${q}%,body.ilike.%${q}%`)
        .order('created_at', { ascending: false }).limit(10),
      // 가이드 댓글
      supabase.from('comments').select('id, guide_id, body, created_at, anonymous_nickname, author:profiles!comments_author_id_fkey(username)')
        .ilike('body', `%${q}%`)
        .order('created_at', { ascending: false }).limit(15),
      // 커뮤니티 댓글
      supabase.from('community_comments').select('id, post_id, body, created_at, anonymous_nickname, author:profiles!community_comments_author_id_fkey(username)')
        .ilike('body', `%${q}%`)
        .order('created_at', { ascending: false }).limit(15),
    ]);
    speciesMatches = (s.data as any) ?? [];
    guideMatches = (g.data as any) ?? [];
    communityMatches = (c.data as any) ?? [];
    rescueMatches = (r.data as any) ?? [];
    announcementMatches = (a.data as any) ?? [];
    commentMatches = [
      ...((gc.data as any[]) ?? []).map((x) => ({ ...x, _kind: 'guide', _link: `/guides/${x.guide_id}` })),
      ...((cc.data as any[]) ?? []).map((x) => ({ ...x, _kind: 'community', _link: `/community/${x.post_id}` })),
    ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  const total =
    speciesMatches.length + guideMatches.length + communityMatches.length +
    rescueMatches.length + announcementMatches.length + commentMatches.length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">🔍 통합 검색</h1>
        <form className="mt-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="햄스터 종, 가이드, 커뮤니티, 구조대, 공지를 한 번에"
            className="input"
            autoFocus
          />
        </form>
        {q && <p className="mt-2 text-sm text-cocoa-300">“{q}” 검색 결과 · 총 {total}건</p>}
      </header>

      {!q ? (
        <div className="card text-center text-cocoa-300">검색어를 입력해 주세요. (예: 골든, 케이지, 분당)</div>
      ) : (
        <>
          {announcementMatches.length > 0 && (
            <SearchSection title="공지" emoji="📢" count={announcementMatches.length}>
              <ul className="space-y-2">
                {announcementMatches.map((a: any) => (
                  <li key={a.id}>
                    <Link href={`/announcements`} className="card flex items-center justify-between gap-3 transition hover:-translate-y-0.5 hover:shadow-soft">
                      <div>
                        <p className="font-semibold text-cocoa-500">{a.pinned && '📌 '}{a.title}</p>
                        <p className="text-xs text-cocoa-300">{formatDate(a.created_at)}</p>
                      </div>
                      <span className="text-cocoa-300">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </SearchSection>
          )}

          <SearchSection title="도감" emoji="🐹" count={speciesMatches.length}>
            {speciesMatches.length === 0 ? (
              <div className="card text-center text-cocoa-300">일치하는 종 없음</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {speciesMatches.map((s) => (
                  <Link key={s.id} href={`/species/${s.slug}`} className="card flex gap-4 transition hover:-translate-y-0.5 hover:shadow-soft">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cream-100 text-2xl">
                      {s.image_url ? <img src={s.image_url} alt="" className="h-full w-full rounded-2xl object-cover" /> : '🐹'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-cocoa-500">{s.name_ko}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-cocoa-400">{s.summary}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SearchSection>

          <SearchSection title="가이드" emoji="📖" count={guideMatches.length}>
            {guideMatches.length === 0 ? (
              <div className="card text-center text-cocoa-300">일치하는 가이드 없음</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {guideMatches.map((g) => <GuideCard key={g.id} guide={g} />)}
              </div>
            )}
          </SearchSection>

          <SearchSection title="커뮤니티" emoji="💬" count={communityMatches.length}>
            {communityMatches.length === 0 ? (
              <div className="card text-center text-cocoa-300">일치하는 글 없음</div>
            ) : (
              <ul className="space-y-2">
                {communityMatches.map((p: any) => (
                  <li key={p.id}>
                    <Link href={`/community/${p.id}`} className="card transition hover:-translate-y-0.5 hover:shadow-soft">
                      <p className="line-clamp-1 font-semibold text-cocoa-500">{p.title}</p>
                      <p className="mt-1 line-clamp-1 text-sm text-cocoa-300">{p.body}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SearchSection>

          <SearchSection title="유기햄 구조대" emoji="🆘" count={rescueMatches.length}>
            {rescueMatches.length === 0 ? (
              <div className="card text-center text-cocoa-300">일치하는 글 없음</div>
            ) : (
              <ul className="space-y-2">
                {rescueMatches.map((r) => {
                  const meta = RESCUE_KIND_LABEL[r.kind];
                  return (
                    <li key={r.id}>
                      <Link href={`/rescue/${r.id}`} className="card flex gap-3 transition hover:-translate-y-0.5 hover:shadow-soft">
                        <span className="badge bg-peach-100 text-peach-500">{meta.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-semibold text-cocoa-500">{r.title}</p>
                          {r.region && <p className="text-xs text-cocoa-300">📍 {r.region}</p>}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </SearchSection>

          <SearchSection title="댓글" emoji="🗨" count={commentMatches.length}>
            {commentMatches.length === 0 ? (
              <div className="card text-center text-cocoa-300">일치하는 댓글 없음</div>
            ) : (
              <ul className="space-y-2">
                {commentMatches.map((c: any) => {
                  const who = c.author?.username ?? c.anonymous_nickname ?? '익명';
                  return (
                    <li key={c.id}>
                      <Link href={c._link} className="card block transition hover:-translate-y-0.5 hover:shadow-soft">
                        <p className="line-clamp-2 text-sm text-cocoa-500">“{c.body}”</p>
                        <p className="mt-1 text-xs text-cocoa-300">
                          {who} · {c._kind === 'guide' ? '가이드' : '커뮤니티'} 댓글 · {formatDate(c.created_at)}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </SearchSection>
        </>
      )}
    </div>
  );
}

function SearchSection({ title, emoji, count, children }: { title: string; emoji: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-bold text-cocoa-500">{emoji} {title} · {count}건</h2>
      {children}
    </section>
  );
}
