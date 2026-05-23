'use client';

import { useState } from 'react';

type Props = {
  currentEmail: string | null;
  contactEmail: string;
};

export function AccountDeleteRequestForm({ currentEmail, contactEmail }: Props) {
  const [email, setEmail] = useState(currentEmail ?? '');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  function buildMailto(): string {
    const to = contactEmail || '';
    const subject = encodeURIComponent('[햄찌랜드] 데이터 삭제 요청');
    const bodyText = [
      `요청 이메일: ${email}`,
      `사유: ${reason}`,
      '',
      '추가 내용:',
      details,
    ].join('\n');
    return `mailto:${to}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
      <label className="block">
        <span className="text-sm text-cocoa-400">계정 이메일</span>
        <input
          className="input mt-1"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="가입에 사용한 이메일"
        />
      </label>
      <label className="block">
        <span className="text-sm text-cocoa-400">사유 (선택)</span>
        <input
          className="input mt-1"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예: 서비스 이용 중단"
        />
      </label>
      <label className="block">
        <span className="text-sm text-cocoa-400">추가 안내 (선택)</span>
        <textarea
          className="input mt-1 min-h-[80px]"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </label>
      <a
        href={buildMailto()}
        className="btn-primary w-full justify-center"
        aria-disabled={!contactEmail}
      >
        메일 앱으로 요청 보내기
      </a>
      <p className="text-xs text-cocoa-300">
        이 양식은 메일 앱을 열어 운영자에게 보낼 내용을 미리 채워줘요. 실제 발송은 메일 앱에서 진행됩니다.
      </p>
    </form>
  );
}
