'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useT } from '@/components/I18nProvider';
import type { TFn } from '@/lib/i18n';

export function SignupForm({
  googleEnabled,
  kakaoEnabled,
}: {
  googleEnabled: boolean;
  kakaoEnabled: boolean;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const t = useT();

  const [username, setUsername] = useState('');     // 아이디 (사이트 내 표시명)
  const [email, setEmail] = useState('');           // 로그인 이메일
  const [phone, setPhone] = useState('');           // 휴대폰
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');     // 본명
  const [birthDate, setBirthDate] = useState('');   // 생년월일
  const [gender, setGender] = useState('');         // 성별
  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!/^[a-z0-9_\-가-힣]{2,16}$/i.test(username)) {
      return t('err.username');
    }
    if (realName.trim().length < 2) return t('err.realName');
    if (!birthDate) return t('err.birthDate');
    if (!gender) return t('err.gender');
    if (phone && !/^[0-9\-]{9,15}$/.test(phone)) {
      return t('err.phone');
    }
    if (password.length < 6) return t('err.password');
    if (!agree) return t('err.agree');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }

    setLoading(true); setError(null); setMessage(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username, phone,
          real_name: realName.trim(),
          birth_date: birthDate,
          gender,
        },
        emailRedirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined,
      },
    });
    setLoading(false);

    if (error) {
      setError(translateAuthError(error.message, t));
      return;
    }
    if (data.user && !data.session) {
      setMessage(t('auth.confirmSent'));
      return;
    }
    router.push('/');
    router.refresh();
  }

  async function handleOAuth(provider: 'google' | 'kakao') {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) setError(error.message);
  }

  const anySocial = googleEnabled || kakaoEnabled;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="card space-y-3">
        <Field label={t('auth.username')} required>
          <input
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('auth.username.ph')}
            required
            minLength={2}
            maxLength={16}
          />
          <p className="mt-1 text-xs text-cocoa-300">{t('auth.username.hint')}</p>
        </Field>

        <Field label={t('auth.email')} required>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hamster@example.com"
            required
            autoComplete="email"
          />
          <p className="mt-1 text-xs text-cocoa-300">{t('auth.email.hint')}</p>
        </Field>

        <Field label={t('auth.realName')} required>
          <input
            type="text"
            className="input"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder={t('auth.realName.ph')}
            autoComplete="name"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label={t('auth.birthDate')} required>
            <input
              type="date"
              className="input"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </Field>
          <Field label={t('auth.gender')} required>
            <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">{t('auth.gender.select')}</option>
              <option value="male">{t('auth.gender.male')}</option>
              <option value="female">{t('auth.gender.female')}</option>
              <option value="other">{t('auth.gender.other')}</option>
              <option value="undisclosed">{t('auth.gender.undisclosed')}</option>
            </select>
          </Field>
        </div>

        <div className="rounded-2xl bg-cream-50 px-3 py-2 text-xs text-cocoa-400">
          {(() => {
            const [pre, post] = t('auth.privacyNote').split('{strong}');
            return <>🔒 {pre}<strong>{t('auth.privacyNoteStrong')}</strong>{post}</>;
          })()}
        </div>

        <Field label={t('auth.phone')}>
          <input
            type="tel"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            autoComplete="tel"
          />
        </Field>

        <Field label={t('auth.password')} required>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder={t('auth.password.ph')}
          />
        </Field>

        <label className="flex items-start gap-2 text-sm text-cocoa-500">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1"
          />
          <span>
            {t('auth.agreeText').split(/(\{terms\}|\{privacy\})/).map((part, i) =>
              part === '{terms}' ? (
                <a key={i} href="/terms" target="_blank" className="text-peach-500 underline">{t('auth.terms')}</a>
              ) : part === '{privacy}' ? (
                <a key={i} href="/privacy" target="_blank" className="text-peach-500 underline">{t('auth.privacy')}</a>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </span>
        </label>

        {error && <p className="whitespace-pre-line text-sm text-red-500">{error}</p>}
        {message && <p className="whitespace-pre-line text-sm text-mint-400">{message}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t('auth.signup.submitting') : t('auth.signup.submit')}
        </button>
      </form>

      {anySocial && (
        <>
          <div className="relative my-2 text-center text-xs text-cocoa-300">
            <span className="bg-[var(--bg)] px-2">{t('auth.or')}</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-cream-200" />
          </div>
          <div className="space-y-2">
            {googleEnabled && (
              <button onClick={() => handleOAuth('google')} className="btn-secondary w-full">
                {t('auth.google.signup')}
              </button>
            )}
            {kakaoEnabled && (
              <button
                onClick={() => handleOAuth('kakao')}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#FEE500] px-5 py-2.5 font-semibold text-[#3C1E1E] shadow-softer"
              >
                {t('auth.kakao.signup')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-cocoa-400">
        {label}{required && <span className="ml-0.5 text-peach-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function translateAuthError(message: string, t: TFn): string {
  if (/email rate limit/i.test(message)) return t('err.emailRate');
  if (/user already registered/i.test(message)) return t('err.userExists');
  if (/invalid email/i.test(message)) return t('err.invalidEmail');
  if (/password.*short/i.test(message)) return t('err.password');
  return message;
}
