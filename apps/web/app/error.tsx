'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useT } from '@/components/I18nProvider';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();

  useEffect(() => {
    // 운영 모니터링용 — 콘솔에 남겨 Vercel 로그에서 확인
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-6xl">🐹</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-cocoa-500">{t('eb.title')}</h1>
      <p className="mt-2 text-cocoa-300">{t('eb.desc')}</p>
      <div className="mt-6 flex justify-center gap-2">
        <button onClick={reset} className="btn-primary">{t('eb.retry')}</button>
        <Link href="/" className="btn-secondary">{t('eb.home')}</Link>
      </div>
    </div>
  );
}
