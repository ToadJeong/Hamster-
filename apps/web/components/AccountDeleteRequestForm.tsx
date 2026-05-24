'use client';

import { useState } from 'react';
import { useT } from '@/components/I18nProvider';

type Props = {
  currentEmail: string | null;
  contactEmail: string;
};

export function AccountDeleteRequestForm({ currentEmail, contactEmail }: Props) {
  const t = useT();
  const [email, setEmail] = useState(currentEmail ?? '');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  function buildMailto(): string {
    const to = contactEmail || '';
    const subject = encodeURIComponent(t('ad.subject'));
    const bodyText = [
      `${t('ad.emailField')}: ${email}`,
      `${t('ad.reasonField')}: ${reason}`,
      '',
      `${t('ad.detailsField')}:`,
      details,
    ].join('\n');
    return `mailto:${to}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
      <label className="block">
        <span className="text-sm text-cocoa-400">{t('ad.emailLabel')}</span>
        <input
          className="input mt-1"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={t('ad.emailPh')}
        />
      </label>
      <label className="block">
        <span className="text-sm text-cocoa-400">{t('ad.reasonLabel')}</span>
        <input
          className="input mt-1"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('ad.reasonPh')}
        />
      </label>
      <label className="block">
        <span className="text-sm text-cocoa-400">{t('ad.detailsLabel')}</span>
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
        {t('ad.sendBtn')}
      </a>
      <p className="text-xs text-cocoa-300">
        {t('ad.note')}
      </p>
    </form>
  );
}
