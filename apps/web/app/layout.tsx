import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PetHamsterLayer } from '@/components/PetHamsterLayer';
import { LiveChat } from '@/components/LiveChat';
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
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let dmUnread = 0;
  let notifUnread = 0;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, is_admin')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;
    const [dm, nf] = await Promise.all([
      supabase.rpc('dm_unread_count'),
      supabase.rpc('notif_unread_count'),
    ]);
    dmUnread = (dm.data as number) ?? 0;
    notifUnread = (nf.data as number) ?? 0;
  }

  const settings = await getSiteSettings();

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
            dmUnread={dmUnread}
            notifUnread={notifUnread}
          />
          <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:px-6">
            {children}
          </main>
          <Footer />

          {/* 회원 읽음 기록 동기화 + 실시간 알림 */}
          <ReadStateLoader enabled={!!user} />
          {user && <NotificationToaster userId={user.id} />}

          {/* 화면 위를 돌아다니는 펫 햄스터 */}
          <PetHamsterLayer />

          {/* 우하단 실시간 채팅 (관리자가 OFF 가능) */}
          <LiveChat
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
