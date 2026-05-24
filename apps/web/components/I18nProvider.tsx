'use client';

import { createContext, useContext, useMemo } from 'react';
import { makeT, type Locale, type TFn } from '@/lib/i18n';

const I18nContext = createContext<{ locale: Locale; t: TFn }>({
  locale: 'ko',
  t: makeT('ko'),
});

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, t: makeT(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): TFn {
  return useContext(I18nContext).t;
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}
