import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/site-settings';
import { GuideCard } from '@/components/GuideCard';
import { HomeSearchBar } from '@/components/HomeSearchBar';
import { formatDate } from '@/lib/format';
import {
  RESCUE_KIND_LABEL,
  type GuideWithCounts, type Species, type Announcement, type RescuePostWithAuthor,
} from '@hamster/shared';

export const revalidate = 30;

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const settings = await getSiteSettings();

  // 병렬 조회 (테이블이 없는 경우 빈 배열로 처리)
  const [speciesRes, guidesRes, announcementsRes, rescueRes] = await Promise.all([
    supabase.from('species').select('id, slug, name_ko, summary, image_url').order('name_ko').limit(6),
    supabase.from('guides_with_counts').select('*').order('created_at', { ascending: false }).limit(4),
    supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
    supabase.from('rescue_posts_with_author').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(4),
  ]);

  const species = (speciesRes.data as Pick<Species,'id'|'slug'|'name_ko'|'summary'|'image_url'>[]) ?? [];
  const guides = (guidesRes.data as GuideWithCounts[]) ?? [];
  const announcements = (announcementsRes.data as Announcement[]) ?? [];
  const rescues = (rescueRes.data as RescuePostWithAuthor[]) ?? [];

  // 마이그레이션 미적용 상태 감지
  const missingMigrations: string[] = [];
  if (guidesRes.error?.message?.includes('guides_with_counts')) missingMigrations.push('0001');
  if (announcementsRes.error?.message?.includes('announcements')) missingMigrations.push('0005');
  if (rescueRes.error?.message?.includes('rescue_posts')) missingMigrations.push('0005');

  return (
    <div className="space-y-10">
      {/* 마이그레이션 미적용 경고 */}
      {missingMigrations.length > 0 && (
        <div className="card border-amber-300 bg-amber-50 text-sm text-amber-800">
          ⚠ <strong>데이터베이스 초기 설정이 필요해요.</strong> Supabase SQL Editor에서 다음 파일을 순서대로 실행해 주세요:
          <ul className="mt-1 list-disc pl-5">
            <li>supabase/migrations/0001_initial_schema.sql</li>
            <li>supabase/migrations/0002_admin_and_settings.sql</li>
            <li>supabase/migrations/0003_anonymous_posting.sql</li>
            <li>supabase/migrations/0004_chat_and_pets.sql</li>
            <li>supabase/migrations/0005_announcements_community_rescue.sql</li>
            <li>supabase/seed.sql (햄스터 30종)</li>
          </ul>
        </div>
      )}

      {/* 사이트 공지 (단일 배너) */}
      {settings['site.notice'] && (
        <div className="rounded-cute border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-cocoa-500">
          📢 {settings['site.notice']}
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-cute bg-gradient-to-br from-peach-100 via-cream-100 to-lilac-100 p-6 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <p className="badge mb-3">🐹 햄집사 커뮤니티</p>
          <h1 className="font-display text-2xl font-bold leading-tight text-cocoa-500 sm:text-3xl md:text-5xl">
            우리집 햄스터,<br />이름은 알지만 <span className="text-peach-500">종</span>은 모르셨나요?
          </h1>
          <p className="mt-3 text-sm text-cocoa-400 sm:text-base md:text-lg">
            한국 햄집사를 위한 도감·사육 가이드·커뮤니티·구조대를 한 곳에서.
          </p>
          <div className="mt-5">
            <HomeSearchBar />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/species" className="btn-primary">도감 보기</Link>
            <Link href="/guides" className="btn-secondary">가이드</Link>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-4 -top-4 text-[140px] opacity-15 md:-right-6 md:-top-6 md:text-[220px]">
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
          <div className="card text-center text-cocoa-300 text-sm">
            도감 데이터가 비어 있어요. Supabase에 <code>seed.sql</code>을 실행해 주세요.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {species.map((s) => (
              <Link key={s.id} href={`/species/${s.slug}`}
                className="card group transition hover:-translate-y-0.5 hover:shadow-soft">
                <div className="mb-3 grid aspect-square place-items-center rounded-2xl bg-cream-100 text-5xl">
                  {s.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image_url} alt={s.name_ko} className="h-full w-full rounded-2xl object-cover" />
                  ) : '🐹'}
                </div>
                <h3 className="line-clamp-1 font-semibold text-cocoa-500 group-hover:text-peach-500">{s.name_ko}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-cocoa-300">{s.summary}</p>
              </Link>
            ))}
          </div>
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
