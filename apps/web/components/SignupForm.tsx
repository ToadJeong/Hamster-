'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function SignupForm({
  googleEnabled,
  kakaoEnabled,
}: {
  googleEnabled: boolean;
  kakaoEnabled: boolean;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.user && !data.session) {
      setMessage('확인 메일을 보냈어요. 메일함을 확인해 주세요.');
      return;
    }
    router.push('/');
    router.refresh();
  }

  async function handleOAuth(provider: 'google' | 'kakao') {
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) setError(error.message);
  }

  const anySocialEnabled = googleEnabled || kakaoEnabled;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="card space-y-3">
        <label className="block">
          <span className="text-sm text-cocoa-400">이메일</span>
          <input
            type="email"
            className="input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-sm text-cocoa-400">닉네임</span>
          <input
            type="text"
            className="input mt-1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={2}
            maxLength={20}
            placeholder="햄찌집사"
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
            minLength={6}
            autoComplete="new-password"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-mint-400">{message}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? '가입 중…' : '이메일로 가입하기'}
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
                Google로 가입하기
              </button>
            )}
            {kakaoEnabled && (
              <button
                onClick={() => handleOAuth('kakao')}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#FEE500] px-5 py-2.5 font-semibold text-[#3C1E1E] shadow-softer"
              >
                카카오로 가입하기
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
