import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { TipBar } from '@/components/TipBar';
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

export const metadata: Metadata = {
  title: '햄랜드 · 햄집사들의 따뜻한 커뮤니티',
  description: '한국 햄집사를 위한 햄스터 도감, 사육 가이드, 자유 커뮤니티, 그리고 유기햄 구조대를 한 곳에서.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  // getUser 와 사이트 설정을 병렬로 (설정은 user 와 무관)
  const [{ data: { user } }, settings] = await Promise.all([
    supabase.auth.getUser(),
    getSiteSettings(),
  ]);

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, is_admin')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;
  }
  // 안읽은 쪽지/알림 배지는 서버 렌더를 막지 않도록 헤더에서 클라이언트로 조회한다.

  return (
    <html lang="ko">
      <head>
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
        <ModalProvider>
          <Header
            user={user ? { email: user.email ?? '' } : null}
            username={profile?.username ?? null}
            avatarUrl={profile?.avatar_url ?? null}
            isAdmin={!!profile?.is_admin}
          />
          <TipBar />
          <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:px-6 lg:pb-24">
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

        {/* Vercel 방문자 분석 + 성능 측정 */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
