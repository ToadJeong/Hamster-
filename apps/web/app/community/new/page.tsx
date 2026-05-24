import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CommunityEditor } from '@/components/CommunityEditor';
import { getSiteSettings } from '@/lib/site-settings';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function NewCommunityPost() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const settings = await getSiteSettings();
  const t = makeT(getLocale());

  if (!user && !settings['app.allow_anonymous']) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-12 text-center">
        <p className="text-3xl">🐹</p>
        <p className="text-cocoa-400">{t('ce.anonDisabled')}</p>
        <Link href="/login?next=/community/new" className="btn-primary inline-flex">{t('form.loginGo')}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('ce.newTitle')}</h1>
      <CommunityEditor allowAnonymous={settings['app.allow_anonymous']} isAuthed={!!user} />
    </div>
  );
}
