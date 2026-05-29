import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { TipBar } from '@/components/TipBar';
import { UrgentBar } from '@/components/UrgentBar';
import { MobileTabBar } from '@/components/MobileTabBar';
import { Footer } from '@/components/Footer';
import { PetHamsterLayer } from '@/components/PetHamsterLayer';
import { DeferredLiveChat } from '@/components/DeferredLiveChat';
import { ModalProvider } from '@/components/Modal';
import { ReadStateLoader } from '@/components/ReadStateLoader';
import { NotificationToaster } from '@/components/NotificationToaster';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/site-settings';
import { getLocale } from '@/lib/i18n-server';
import { I18nProvider } from '@/components/I18nProvider';

export const metadata: Metadata = {
  title: '햄랜드 · 햄집사들의 따뜻한 커뮤니티',
  description: '한국 햄집사를 위한 햄스터 도감, 사육 가이드, 자유 커뮤니티, 그리고 유기햄 구조대를 한 곳에서.',
};

export const viewport: Viewport = {
  themeColor: '#FFF9F2',
  width: 'device-width',
  initialScale: 1,
  // 접근성: 사용자 확대를 막지 않음 (maximumScale 설정 안 함)
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  // getUser, 사이트 설정, 긴급 구조글을 한 번에 병렬 — 셋 다 서로 의존이 없음
  const [{ data: { user } }, settings, urgentRescueRes] = await Promise.all([
    supabase.auth.getUser(),
    getSiteSettings(),
    supabase
      .from('rescue_posts')
      .select('id, title')
      .eq('urgent', true)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);
  const urgentItems = ((urgentRescueRes.data as { id: string; title: string }[]) ?? [])
    .map((r) => ({ text: r.title, href: `/rescue/${r.id}` }));

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, is_admin')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;
  }

  // 정적 UI 다국어용 로케일(쿠키). 단, <html lang>은 항상 "ko"로 둔다 —
  // 콘텐츠가 한국어이므로, 브라우저 내장 번역이 비한국어 방문자에게
  // 페이지 전체 번역을 안정적으로 제안하도록 하기 위함.
  const locale = getLocale();

  return (
    <html lang="ko">
      <head>
        {/* 외부 자원 사전 연결로 첫 페인트 단축 */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        )}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Dodum:wght@400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)]">
        <I18nProvider locale={locale}>
        <ModalProvider>
          <Header
            user={user ? { email: user.email ?? '' } : null}
            username={profile?.username ?? null}
            avatarUrl={profile?.avatar_url ?? null}
            isAdmin={!!profile?.is_admin}
          />
          <TipBar />
          <UrgentBar items={urgentItems} />
          <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 md:px-6">
            {children}
          </main>
          <Footer />

          {/* 모바일 하단 탭바 (앱 느낌) */}
          <MobileTabBar />

          {/* 회원 읽음 기록 동기화 + 실시간 알림 */}
          <ReadStateLoader enabled={!!user} />
          {user && <NotificationToaster userId={user.id} />}

          {/* 화면 위를 돌아다니는 펫 햄스터 */}
          <PetHamsterLayer />

          {/* 우하단 실시간 채팅 (관리자가 OFF 가능) — 첫 화면 이후 지연 마운트 */}
          <DeferredLiveChat
            enabled={settings['chat.enabled']}
            currentUser={user ? {
              id: user.id,
              username: profile?.username ?? null,
              isAdmin: !!profile?.is_admin,
            } : null}
          />
        </ModalProvider>
        </I18nProvider>

        {/* Vercel 방문자 분석 + 성능 측정 */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
