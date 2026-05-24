import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/site-settings';
import { GuideCard } from '@/components/GuideCard';
import { HomeSearchBar } from '@/components/HomeSearchBar';
import { HamsterIllustration, visualForSpecies } from '@/components/HamsterIllustration';
import { formatDate } from '@/lib/format';
import {
  RESCUE_KIND_LABEL, COMMUNITY_CATEGORY_LABEL,
  type GuideWithCounts, type Species, type Announcement, type RescuePostWithAuthor,
  type CommunityCategory,
} from '@hamster/shared';

export const revalidate = 30;

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const settings = await getSiteSettings();

  // 병렬 조회 (테이블이 없는 경우 빈 배열로 처리)
  const [speciesRes, guidesRes, announcementsRes, rescueRes, communityRes] = await Promise.all([
    supabase.from('species').select('id, slug, name_ko, summary, image_url').order('name_ko').limit(6),
    supabase.from('guides_with_counts').select('*').order('created_at', { ascending: false }).limit(4),
    supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
    supabase.from('rescue_posts_with_author').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(4),
    supabase.from('community_posts_feed').select('*').order('created_at', { ascending: false }).limit(5),
  ]);

  const species = (speciesRes.data as Pick<Species,'id'|'slug'|'name_ko'|'summary'|'image_url'>[]) ?? [];
  const guides = (guidesRes.data as GuideWithCounts[]) ?? [];
  const announcements = (announcementsRes.data as Announcement[]) ?? [];
  const rescues = (rescueRes.data as RescuePostWithAuthor[]) ?? [];
  const community = ((communityRes.data as any[]) ?? []);

  return (
    <div className="space-y-10">
      {/* 사이트 공지 (단일 배너) */}
      {settings['site.notice'] && (
        <div className="rounded-cute border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-cocoa-500">
          📢 {settings['site.notice']}
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-peach-100 via-cream-100 to-lilac-100 p-7 shadow-soft md:p-14">
        {/* 장식용 동글동글 */}
        <div aria-hidden className="pointer-events-none absolute -left-10 -bottom-12 h-44 w-44 rounded-full bg-mint-200/40 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute right-10 top-6 h-28 w-28 rounded-full bg-peach-200/40 blur-2xl" />
        <div className="relative z-10 max-w-2xl">
          <p className="badge mb-3 bg-white/70 text-peach-500 shadow-softer">🐹 햄집사들의 따뜻한 커뮤니티</p>
          <h1 className="font-display text-[26px] font-bold leading-tight text-cocoa-500 sm:text-4xl md:text-5xl">
            우리집 햄스터,<br />이름은 알지만 <span className="text-peach-500">종</span>은 모르셨나요?
          </h1>
          <p className="mt-3 text-sm text-cocoa-400 sm:text-base md:text-lg">
            한국 햄집사를 위한 <b className="font-semibold text-cocoa-500">도감 · 사육 가이드 · 커뮤니티 · 구조대</b>를 한 곳에서.
          </p>
          <div className="mt-5">
            <HomeSearchBar />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/species" className="btn-primary">🐹 도감 보기</Link>
            <Link href="/identify" className="btn-secondary">📷 사진으로 찾기</Link>
            <Link href="/guides" className="btn-secondary">📖 가이드</Link>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-4 -top-6 select-none text-[150px] opacity-20 md:-right-8 md:text-[240px]">
          🐹
        </div>
      </section>

      {/* 최근 공지 */}
      {announcements.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl font-bold text-cocoa-500 sm:text-2xl">📢 공지사항</h2>
            <Link href="/announcements" className="text-sm font-medium text-peach-500 hover:underline">전체 →</Link>
          </div>
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li key={a.id}>
                <Link href="/announcements" className="card flex items-center justify-between gap-2 transition hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-semibold text-cocoa-500">
                      {a.pinned && '📌 '}{a.title}
                    </p>
                    <p className="text-xs text-cocoa-300">{formatDate(a.created_at)}</p>
                  </div>
                  <span className="text-cocoa-300">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 도감 미리보기 */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-cocoa-500 sm:text-2xl">🐹 햄스터 도감</h2>
            <p className="text-sm text-cocoa-300">한국에서 키우는 30여 종을 가나다순으로</p>
          </div>
          <Link href="/species" className="text-sm font-medium text-peach-500 hover:underline">전체 →</Link>
        </div>
        {species.length === 0 ? (
          <div className="card text-center text-sm text-cocoa-300">
            🐹 도감을 준비하고 있어요. 곧 다양한 햄스터 친구들을 만나볼 수 있어요!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {species.map((s) => (
              <Link key={s.id} href={`/species/${s.slug}`}
                className="card group transition hover:-translate-y-0.5 hover:shadow-soft">
                <div className="mb-3 aspect-square overflow-hidden rounded-2xl bg-cream-100">
                  {s.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image_url} alt={s.name_ko} className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    <HamsterIllustration visual={visualForSpecies(s.slug, s.name_ko)} className="h-full w-full" />
                  )}
                </div>
                <h3 className="line-clamp-1 font-semibold text-cocoa-500 group-hover:text-peach-500">{s.name_ko}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-cocoa-300">{s.summary}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 커뮤니티 최근 글 */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-cocoa-500 sm:text-2xl">💬 커뮤니티</h2>
            <p className="text-sm text-cocoa-300">햄집사들의 따끈한 글</p>
          </div>
          <Link href="/community" className="text-sm font-medium text-peach-500 hover:underline">전체 →</Link>
        </div>
        {community.length === 0 ? (
          <div className="card text-center text-sm text-cocoa-300">아직 글이 없어요. 첫 글을 남겨보세요!</div>
        ) : (
          <ul className="space-y-2">
            {community.map((p: any) => {
              const display = p.author_username ?? p.anonymous_nickname ?? '익명';
              const meta = COMMUNITY_CATEGORY_LABEL[p.category as CommunityCategory] ?? COMMUNITY_CATEGORY_LABEL.free;
              return (
                <li key={p.id}>
                  <Link href={`/community/${p.id}`} className="card block transition hover:-translate-y-0.5 hover:shadow-soft">
                    <div className="flex items-start gap-3">
                      {p.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.cover_url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                      ) : (
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cream-100 text-2xl">
                          {meta.emoji}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span className="badge bg-cream-100 text-cocoa-500">{meta.emoji} {meta.label}</span>
                          {(p.tags as string[] ?? []).slice(0, 2).map((t) => (
                            <span key={t} className="badge bg-lilac-50 text-lilac-400">#{t}</span>
                          ))}
                        </div>
                        <h3 className="line-clamp-1 font-semibold text-cocoa-500">{p.title}</h3>
                        <div className="mt-1 flex items-center gap-3 text-xs text-cocoa-300">
                          <span>{display}{!p.author_id && ' · 익명'}</span>
                          <span>{formatDate(p.created_at)}</span>
                          <span>❤ {p.like_count ?? 0}</span>
                          <span>💬 {p.comment_count ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 유기햄 구조대 */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-cocoa-500 sm:text-2xl">🆘 유기햄 구조대</h2>
            <p className="text-sm text-cocoa-300">새 가족이 필요한 햄찌들</p>
          </div>
          <Link href="/rescue" className="text-sm font-medium text-peach-500 hover:underline">전체 →</Link>
        </div>
        {rescues.length === 0 ? (
          <div className="card text-center text-cocoa-300 text-sm">현재 진행 중인 글이 없어요.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rescues.map((r) => {
              const meta = RESCUE_KIND_LABEL[r.kind];
              return (
                <Link key={r.id} href={`/rescue/${r.id}`}
                  className="card flex gap-3 transition hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cream-100 text-2xl">
                    {r.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.cover_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                    ) : '🐹'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="badge bg-peach-100 text-peach-500">{meta.emoji} {meta.label}</span>
                      {r.region && <span className="badge">📍 {r.region}</span>}
                    </div>
                    <h3 className="mt-1 line-clamp-1 font-semibold text-cocoa-500">{r.title}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 최신 가이드 */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-cocoa-500 sm:text-2xl">📖 최신 가이드</h2>
            <p className="text-sm text-cocoa-300">햄집사들이 직접 쓴 사육 노하우</p>
          </div>
          <Link href="/guides" className="text-sm font-medium text-peach-500 hover:underline">전체 →</Link>
        </div>
        {guides.length === 0 ? (
          <div className="card text-center text-cocoa-300 text-sm">
            아직 가이드가 없어요. 첫 가이드를 작성해 보세요!
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {guides.map((g) => <GuideCard key={g.id} guide={g} />)}
          </div>
        )}
      </section>
    </div>
  );
}
