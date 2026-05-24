import Link from 'next/link';
import { getSiteSettings } from '@/lib/site-settings';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';

export async function Footer() {
  const settings = await getSiteSettings();
  const t = makeT(getLocale());
  return (
    <footer className="border-t border-cream-200 bg-cream-50/60">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 pt-6 pb-28 text-sm text-cocoa-300 md:px-6 lg:pb-6">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/privacy" className="hover:text-peach-500">{t('footer.privacy')}</Link>
          <Link href="/terms" className="hover:text-peach-500">{t('footer.terms')}</Link>
          <Link href="/account/delete" className="hover:text-peach-500">{t('footer.dataDelete')}</Link>
          {settings['site.contact_email'] && (
            <a href={`mailto:${settings['site.contact_email']}`} className="hover:text-peach-500">
              {t('footer.contact')}: {settings['site.contact_email']}
            </a>
          )}
        </nav>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} 햄랜드 · {t('footer.tagline')}</p>
          <p className="text-xs">{t('footer.disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}
