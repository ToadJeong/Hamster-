import Link from 'next/link';
import { SignupForm } from '@/components/SignupForm';
import { HamsterIllustration, visualForSpecies } from '@/components/HamsterIllustration';
import { getSiteSettings } from '@/lib/site-settings';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function SignupPage() {
  const settings = await getSiteSettings();
  const t = makeT(getLocale());
  return (
    <div className="mx-auto max-w-md space-y-6 pt-4">
      <div className="flex flex-col items-center text-center">
        <div className="h-20 w-24"><HamsterIllustration visual={visualForSpecies('winterwhite')} className="h-full w-full" bg={false} /></div>
        <h1 className="mt-1 font-display text-2xl font-bold text-cocoa-500">{t('auth.signup.title')}</h1>
        <p className="mt-1 text-sm text-cocoa-300">{t('auth.signup.subtitle')}</p>
      </div>
      <SignupForm
        googleEnabled={settings['auth.google_enabled']}
        kakaoEnabled={settings['auth.kakao_enabled']}
      />
      <p className="text-center text-sm text-cocoa-400">
        {t('auth.signup.haveAccount')}{' '}
        <Link href="/login" className="font-medium text-peach-500 hover:underline">{t('auth.signup.loginLink')}</Link>
      </p>
    </div>
  );
}
