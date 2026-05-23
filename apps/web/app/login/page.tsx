import Link from 'next/link';
import { LoginForm } from '@/components/LoginForm';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <p className="text-3xl">🐹</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-cocoa-500">햄찌랜드에 로그인</h1>
        <p className="mt-1 text-sm text-cocoa-300">햄집사들의 작은 커뮤니티에 오신 걸 환영해요</p>
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
