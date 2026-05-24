import Link from 'next/link';
import { LoginForm } from '@/components/LoginForm';
import { HamsterIllustration, visualForSpecies } from '@/components/HamsterIllustration';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-md space-y-6 pt-4">
      <div className="flex flex-col items-center text-center">
        <div className="h-20 w-24"><HamsterIllustration visual={visualForSpecies('golden')} className="h-full w-full" bg={false} /></div>
        <h1 className="mt-1 font-display text-2xl font-bold text-cocoa-500">햄랜드에 로그인</h1>
        <p className="mt-1 text-sm text-cocoa-300">햄집사들의 따뜻한 커뮤니티에 오신 걸 환영해요</p>
      </div>

      <LoginForm
        nextPath={searchParams.next ?? '/'}
        googleEnabled={settings['auth.google_enabled']}
        kakaoEnabled={settings['auth.kakao_enabled']}
        errorMessage={searchParams.error}
      />

      <p className="text-center text-sm text-cocoa-400">
        아직 계정이 없으신가요?{' '}
        <Link href="/signup" className="font-medium text-peach-500 hover:underline">가입하기</Link>
      </p>
    </div>
  );
}
