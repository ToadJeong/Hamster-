'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LOCALES, LOCALE_COOKIE, LOCALE_LABEL, LOCALE_FLAG, type Locale } from '@/lib/i18n';
import { useLocale } from '@/components/I18nProvider';

export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const current = useLocale();
  const [open, setOpen] = useState(false);

  function pick(loc: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${loc}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setOpen(false);
    router.refresh();
  }

  return (
    <div className={'relative ' + (className ?? '')}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium text-cocoa-400 hover:bg-cream-100"
        aria-label="언어 / Language"
      >
        <span>{LOCALE_FLAG[current]}</span>
        <span className="hidden sm:inline">{LOCALE_LABEL[current]}</span>
        <span className="text-[10px] text-cocoa-300">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <ul className="absolute right-0 z-50 mt-1 w-36 overflow-hidden rounded-2xl border border-cream-200 bg-white py-1 shadow-soft">
            {LOCALES.map((loc) => (
              <li key={loc}>
                <button
                  onClick={() => pick(loc)}
                  className={
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-cream-100 ' +
                    (loc === current ? 'font-bold text-peach-500' : 'text-cocoa-500')
                  }
                >
                  <span>{LOCALE_FLAG[loc]}</span>
                  {LOCALE_LABEL[loc]}
                  {loc === current && <span className="ml-auto text-peach-400">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
