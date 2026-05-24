'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useT } from '@/components/I18nProvider';
import type { TFn } from '@/lib/i18n';

type Props = {
  nextPath: string;
  googleEnabled: boolean;
  kakaoEnabled: boolean;
  errorMessage?: string;
};

export function LoginForm({ nextPath, googleEnabled, kakaoEnabled, errorMessage }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const t = useT();

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
        setError(t('err.noUsername'));
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
      setError(translateAuthError(error.message, t));
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
          <span className="text-sm text-cocoa-400">{t('auth.idOrEmail')}</span>
          <input
            type="text"
            className="input mt-1"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
            placeholder={t('auth.idOrEmail.ph')}
          />
        </label>
        <label className="block">
          <span className="text-sm text-cocoa-400">{t('auth.password')}</span>
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
          {loading ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>
      </form>

      {anySocialEnabled && (
        <>
          <div className="relative my-2 text-center text-xs text-cocoa-300">
            <span className="bg-[var(--bg)] px-2">{t('auth.or')}</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-cream-200" />
          </div>
          <div className="space-y-2">
            {googleEnabled && (
              <button onClick={() => handleOAuth('google')} className="btn-secondary w-full">
                <span>🇬</span> {t('auth.google.continue')}
              </button>
            )}
            {kakaoEnabled && (
              <button
                onClick={() => handleOAuth('kakao')}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#FEE500] px-5 py-2.5 font-semibold text-[#3C1E1E] shadow-softer transition hover:brightness-95 active:scale-[0.98]"
              >
                <span>💬</span> {t('auth.kakao.continue')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function translateAuthError(message: string, t: TFn): string {
  if (/invalid login credentials/i.test(message)) return t('err.invalidCreds');
  if (/email not confirmed/i.test(message)) return t('err.emailNotConfirmed');
  if (/email rate limit|over_email_send_rate_limit/i.test(message)) {
    return t('err.emailRate');
  }
  return message;
}
