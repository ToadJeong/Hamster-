'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  nextPath: string;
  googleEnabled: boolean;
  kakaoEnabled: boolean;
  errorMessage?: string;
};

export function LoginForm({ nextPath, googleEnabled, kakaoEnabled, errorMessage }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [identifier, setIdentifier] = useState('');  // 이메일 또는 아이디
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorMessage ?? null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let emailToUse = identifier.trim();

    // @가 없으면 아이디 → 이메일 조회
    if (!emailToUse.includes('@')) {
      const { data, error: rpcErr } = await supabase.rpc('get_email_by_username', {
        p_username: emailToUse,
      });
      if (rpcErr || !data) {
        setError('해당 아이디로 가입된 계정이 없어요.');
        setLoading(false);
        return;
      }
      emailToUse = data as string;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });
    setLoading(false);
    if (error) {
      setError(translateAuthError(error.message));
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  async function handleOAuth(provider: 'google' | 'kakao') {
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
        : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) setError(error.message);
  }

  const anySocialEnabled = googleEnabled || kakaoEnabled;

  return (
    <div className="space-y-4">
      <form onSubmit={handleLogin} className="card space-y-3">
        <label className="block">
          <span className="text-sm text-cocoa-400">아이디 또는 이메일</span>
          <input
            type="text"
            className="input mt-1"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
            placeholder="햄집사123  또는  hamster@example.com"
          />
        </label>
        <label className="block">
          <span className="text-sm text-cocoa-400">비밀번호</span>
          <input
            type="password"
            className="input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </form>

      {anySocialEnabled && (
        <>
          <div className="relative my-2 text-center text-xs text-cocoa-300">
            <span className="bg-[var(--bg)] px-2">또는</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-cream-200" />
          </div>
          <div className="space-y-2">
            {googleEnabled && (
              <button onClick={() => handleOAuth('google')} className="btn-secondary w-full">
                <span>🇬</span> Google로 계속하기
              </button>
            )}
            {kakaoEnabled && (
              <button
                onClick={() => handleOAuth('kakao')}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#FEE500] px-5 py-2.5 font-semibold text-[#3C1E1E] shadow-softer transition hover:brightness-95 active:scale-[0.98]"
              >
                <span>💬</span> 카카오로 계속하기
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return '아이디·이메일 또는 비밀번호가 올바르지 않아요.';
  if (/email not confirmed/i.test(message)) return '이메일 인증이 완료되지 않았어요. 메일함과 스팸함을 확인해 주세요.';
  if (/email rate limit|over_email_send_rate_limit/i.test(message)) {
    return '메일 발송 한도에 도달했어요. 잠시 후 다시 시도해 주세요.';
  }
  return message;
}
