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
      return '아이디는 2~16자, 한글·영문·숫자·_·- 만 사용할 수 있어요.';
    }
    if (realName.trim().length < 2) return '본명을 입력해 주세요.';
    if (!birthDate) return '생년월일을 입력해 주세요.';
    if (!gender) return '성별을 선택해 주세요.';
    if (phone && !/^[0-9\-]{9,15}$/.test(phone)) {
      return '휴대폰번호 형식을 확인해 주세요. (예: 010-1234-5678)';
    }
    if (password.length < 6) return '비밀번호는 6자 이상이어야 해요.';
    if (!agree) return '이용약관과 개인정보 처리방침에 동의해 주세요.';
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
      setError(translateAuthError(error.message));
      return;
    }
    if (data.user && !data.session) {
      setMessage('확인 메일을 보냈어요! 메일함을 확인해 주세요.\n메일이 안 오면 스팸함도 함께 확인 부탁드려요.');
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
        <Field label="아이디" required>
          <input
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="햄집사123 (2~16자, 한글·영문·숫자)"
            required
            minLength={2}
            maxLength={16}
          />
          <p className="mt-1 text-xs text-cocoa-300">사이트에서 보일 이름이에요. 추후 변경 가능합니다.</p>
        </Field>

        <Field label="이메일" required>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hamster@example.com"
            required
            autoComplete="email"
          />
          <p className="mt-1 text-xs text-cocoa-300">로그인 시 사용하며, 본인 인증 메일을 받게 됩니다.</p>
        </Field>

        <Field label="본명" required>
          <input
            type="text"
            className="input"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="홍길동"
            autoComplete="name"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="생년월일" required>
            <input
              type="date"
              className="input"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </Field>
          <Field label="성별" required>
            <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">선택</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
              <option value="undisclosed">밝히지 않음</option>
            </select>
          </Field>
        </div>

        <div className="rounded-2xl bg-cream-50 px-3 py-2 text-xs text-cocoa-400">
          🔒 본명·생년월일·성별·휴대폰번호는 <strong>본인과 운영자만</strong> 볼 수 있어요.
          운영자도 부정 이용 확인 등 꼭 필요한 경우에만 열람합니다. 다른 회원에게는 공개되지 않아요.
        </div>

        <Field label="휴대폰번호 (선택)">
          <input
            type="tel"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            autoComplete="tel"
          />
        </Field>

        <Field label="비밀번호" required>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="6자 이상"
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
            <a href="/terms" target="_blank" className="text-peach-500 underline">이용약관</a>과{' '}
            <a href="/privacy" target="_blank" className="text-peach-500 underline">개인정보 처리방침</a>에 동의합니다.
          </span>
        </label>

        {error && <p className="whitespace-pre-line text-sm text-red-500">{error}</p>}
        {message && <p className="whitespace-pre-line text-sm text-mint-400">{message}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? '가입 중…' : '가입하기'}
        </button>
      </form>

      {anySocial && (
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

function translateAuthError(message: string): string {
  if (/email rate limit/i.test(message)) {
    return [
      '메일 발송 한도에 도달했어요.',
      '',
      '해결 방법:',
      '① 1시간쯤 후 다시 시도해 주세요',
      '② 관리자: Supabase 대시보드의 Authentication → Emails → Custom SMTP에서',
      '   Resend, Mailgun 등 외부 SMTP를 연결하면 제한 없이 발송 가능합니다.',
    ].join('\n');
  }
  if (/user already registered/i.test(message)) {
    return '이미 가입된 이메일이에요. 로그인 페이지를 이용해 주세요.';
  }
  if (/invalid email/i.test(message)) return '이메일 형식이 올바르지 않아요.';
  if (/password.*short/i.test(message)) return '비밀번호는 6자 이상이어야 해요.';
  return message;
}
