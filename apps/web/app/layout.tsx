import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PetHamsterLayer } from '@/components/PetHamsterLayer';
import { LiveChat } from '@/components/LiveChat';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/site-settings';

export const metadata: Metadata = {
  title: '햄찌랜드 · 햄스터 도감과 사육 가이드 커뮤니티',
  description: '한국에서 키우는 햄스터 종별 도감과 사육 가이드, 그리고 햄집사들의 이야기를 나누는 공간.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, is_admin')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;
  }

  const settings = await getSiteSettings();

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)]">
        <Header
          user={user ? { email: user.email ?? '' } : null}
          username={profile?.username ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          isAdmin={!!profile?.is_admin}
        />
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:px-6">
          {children}
        </main>
        <Footer />

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
      </body>
    </html>
  );
}
