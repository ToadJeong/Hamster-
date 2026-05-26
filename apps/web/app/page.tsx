import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/site-settings';
import { GuideCard } from '@/components/GuideCard';
import { HomeSearchBar } from '@/components/HomeSearchBar';
import { Hamster } from '@/components/Hamster';
import { GENUS_ORDER, GENUS_INFO } from '@/lib/genus';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import { CategoryIcon } from '@/components/HamlandAssets';
import { Media } from '@/components/Media';
import { isVideoUrl } from '@/lib/media';
import { SectionHeader } from '@/components/SectionHeader';
import { formatDate } from '@/lib/format';
import {
  RESCUE_KIND_LABEL, COMMUNITY_CATEGORY_LABEL,
  type GuideWithCounts, type Announcement, type RescuePostWithAuthor,
  type CommunityCategory,
} from '@hamster/shared';

export const revalidate = 30;

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const settings = await getSiteSettings();
  const t = makeT(getLocale());

  // 병렬 조회 (테이블이 없는 경우 빈 배열로 처리)
  const [guidesRes, announcementsRes, rescueRes, communityRes, momentsRes] = await Promise.all([
    supabase.from('guides_with_counts').select('*').order('created_at', { ascending: false }).limit(4),
    supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
    supabase.from('rescue_posts_with_author').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(4),
    supabase.from('community_posts_feed').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('moments_feed').select('id, image_url, like_count').order('created_at', { ascending: false }).limit(8),
  ]);

  const guides = (guidesRes.data as GuideWithCounts[]) ?? [];
  const announcements = (announcementsRes.data as Announcement[]) ?? [];
  const rescues = (rescueRes.data as RescuePostWithAuthor[]) ?? [];
  const community = ((communityRes.data as any[]) ?? []);
  const moments = ((momentsRes.data as { id: string; image_url: string; like_count: number }[]) ?? []);

  return (
    <div className="space-y-10">
      {/* 사이트 공지 (단일 배너) */}
      {settings['site.notice'] && (
        <div className="rounded-cute border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-cocoa-500">
          📢 {settings['site.notice']}
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-peach-100 via-cream-100 to-lilac-100 p-6 shadow-soft md:p-9">
        <div aria-hidden className="pointer-events-none absolute -left-8 -bottom-10 h-32 w-32 rounded-full bg-mint-200/40 blur-2xl" />
        <div className="relative z-10 max-w-xl">
          <p className="badge mb-2.5 bg-white/70 text-peach-500 shadow-softer">🐹 햄집사들의 따뜻한 커뮤니티</p>
          <h1 className="font-display text-xl font-bold leading-snug text-cocoa-500 sm:text-2xl md:text-[28px]">
            우리집 햄스터, 이름은 알지만 <span className="text-peach-500">종</span>은 모르셨나요?
          </h1>
          <p className="mt-2 text-sm text-cocoa-400">
            도감 · 사육 가이드 · 커뮤니티 · 구조대를 한 곳에서.
          </p>
          <div className="mt-4 max-w-md">
            <HomeSearchBar />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/species" className="btn-primary text-sm">도감 보기</Link>
            <Link href="/identify" className="btn-secondary text-sm">📷 사진으로 찾기</Link>
          </div>
        </div>
        {/* 작고 단정한 장식 햄스터 */}
        <div aria-hidden className="pointer-events-none absolute -right-1 bottom-2 select-none text-5xl opacity-70 md:right-8 md:top-1/2 md:-translate-y-1/2 md:text-7xl">
          🐹
        </div>
      </section>

      {/* 카테고리 바로가기 */}
      <nav aria-label="카테고리 바로가기">
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {([
            { href: '/announcements', kind: 'announcements', label: '공지' },
            { href: '/species', kind: 'species', label: '도감' },
            { href: '/guides', kind: 'guides', label: '가이드' },
            { href: '/community', kind: 'community', label: '커뮤니티' },
            { href: '/products', kind: 'products', label: '상품' },
            { href: '/rescue', kind: 'rescue', label: '구조대' },
            { href: '/hospitals', kind: 'hospitals', label: '병원' },
            { href: '/identify', kind: 'identify', label: '사진찾기' },
          ] as const).map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="flex flex-col items-center gap-1 rounded-2xl p-1.5 transition hover:-translate-y-0.5 hover:bg-white/70">
                <CategoryIcon kind={c.kind} className="h-12 w-12 sm:h-14 sm:w-14" />
                <span className="text-[11px] font-semibold text-cocoa-500">{t('nav.' + c.kind)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 최근 공지 */}
      {announcements.length > 0 && (
        <section>
          <SectionHeader title={t('home.section.notices')} moreHref="/announcements" moreLabel={t('home.more')} />
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

      {/* 도감 미리보기 — 5종 */}
      <section>
        <SectionHeader title={t('home.section.species')} subtitle={t('home.section.species.sub')} moreHref="/species" moreLabel={t('home.more')} />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {GENUS_ORDER.map((g) => {
            const info = GENUS_INFO[g];
            return (
              <Link key={g} href={`/species/${info.baseSlug}`}
                className="group flex flex-col items-center gap-1.5 rounded-2xl border border-transparent p-1.5 transition hover:border-cream-200 hover:bg-white/70">
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-cream-100 ring-1 ring-cream-200">
                  <Hamster palette={info.palette} className="h-full w-full" />
                </div>
                <h3 className="line-clamp-1 w-full text-center text-[11px] font-semibold text-cocoa-500 group-hover:text-peach-500">{info.name_ko.replace(' 햄스터', '')}</h3>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 육아일기 */}
      {moments.length > 0 && (
        <section>
          <SectionHeader title={t('home.section.moments')} subtitle={t('home.section.moments.sub')} moreHref="/moments" moreLabel={t('home.more')} />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {moments.map((m) => (
              <Link key={m.id} href={`/moments/${m.id}`}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-cream-200">
                <Media url={m.image_url} className="h-full w-full object-cover transition group-hover:scale-105" />
                {isVideoUrl(m.image_url) && (
                  <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/45 text-[10px] text-white">▶</span>
                )}
                {m.like_count > 0 && (
                  <span className="absolute bottom-1 left-1 rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] font-bold text-white">❤ {m.like_count}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 추모 햄스터 별 배너 */}
      <Link
        href="/memorial"
        className="group flex items-center gap-4 overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-r from-lilac-100 via-peach-50 to-cream-100 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-soft"
      >
        <span className="text-4xl transition group-hover:scale-110">🌟</span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-bold text-cocoa-500">{t('mem.title')}</span>
          <span className="block text-sm text-cocoa-400">{t('mem.subtitle')}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-lilac-400">{t('home.more')} →</span>
      </Link>

      {/* 커뮤니티 최근 글 */}
      <section>
        <SectionHeader title={t('home.section.community')} subtitle={t('home.section.community.sub')} moreHref="/community" moreLabel={t('home.more')} />
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
                        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                          <Media url={p.cover_url} className="h-full w-full object-cover" />
                          {isVideoUrl(p.cover_url) && (
                            <span className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-black/45 text-[9px] text-white">▶</span>
                          )}
                        </span>
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
        <SectionHeader title={t('home.section.rescue')} subtitle={t('home.section.rescue.sub')} moreHref="/rescue" moreLabel={t('home.more')} />
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
        <SectionHeader title={t('home.section.guides')} subtitle={t('home.section.guides.sub')} moreHref="/guides" moreLabel={t('home.more')} />
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
