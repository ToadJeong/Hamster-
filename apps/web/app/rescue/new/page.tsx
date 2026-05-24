import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { RescueEditor } from '@/components/RescueEditor';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import type { Species } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function NewRescuePost() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/rescue/new');
  const t = makeT(getLocale());

  const { data: speciesList } = await supabase
    .from('species').select('id, slug, name_ko').order('name_ko');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('re.newTitle')}</h1>
      <p className="text-sm text-cocoa-300">
        {t('re.newSubtitle')}
      </p>
      <RescueEditor species={(speciesList as Pick<Species,'id'|'slug'|'name_ko'>[]) ?? []} />
    </div>
  );
}
