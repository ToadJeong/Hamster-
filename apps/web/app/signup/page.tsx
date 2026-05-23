import Link from 'next/link';
import { SignupForm } from '@/components/SignupForm';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function SignupPage() {
  const settings = await getSiteSettings();
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <p className="text-3xl">🐹</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-cocoa-500">햄찌랜드 가입</h1>
        <p className="mt-1 text-sm text-cocoa-300">햄집사 친구들과 노하우를 나눠보세요</p>
      </div>
      <SignupForm
        googleEnabled={settings['auth.google_enabled']}
        kakaoEnabled={settings['auth.kakao_enabled']}
      />
      <p className="text-center text-sm text-cocoa-400">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-peach-500 hover:underline">로그인</Link>
      </p>
    </div>
  );
}
