import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GuideEditor } from '@/components/GuideEditor';
import { getSiteSettings } from '@/lib/site-settings';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import type { Species } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function NewGuidePage({
  searchParams,
}: {
  searchParams: { species?: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const settings = await getSiteSettings();
  const t = makeT(getLocale());

  // 비로그인인데 익명도 막혀있으면 로그인 페이지로
  if (!user && !settings['app.allow_anonymous']) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <p className="text-3xl">🐹</p>
        <p className="text-cocoa-400">{t('ge.anonDisabledMsg')}</p>
        <Link href="/login?next=/guides/new" className="btn-primary inline-block">{t('ge.loginGo')}</Link>
      </div>
    );
  }

  const { data: speciesList } = await supabase
    .from('species')
    .select('id, slug, name_ko')
    .order('name_ko', { ascending: true });

  const preselectSlug = searchParams.species ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-cocoa-500">{t('ge.newTitle')}</h1>
        <p className="mt-1 text-sm text-cocoa-300">
          {t('ge.mdHint')}
          {!user && settings['app.allow_anonymous'] && t('ge.mdHintAnon')}
        </p>
      </header>
      <GuideEditor
        species={(speciesList as Pick<Species,'id'|'slug'|'name_ko'>[]) ?? []}
        preselectSlug={preselectSlug}
        allowAnonymous={settings['app.allow_anonymous']}
        isAuthed={!!user}
      />
    </div>
  );
}
