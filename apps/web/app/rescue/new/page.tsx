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

  const [{ data: speciesList }, { data: myPets }] = await Promise.all([
    supabase.from('species').select('id, slug, name_ko').order('name_ko'),
    supabase.from('pets').select('id, name, species_id, species_label, photo_url').eq('carer_id', user.id).order('created_at'),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('re.newTitle')}</h1>
      <p className="text-sm text-cocoa-300">
        {t('re.newSubtitle')}
      </p>
      <RescueEditor
        species={(speciesList as Pick<Species,'id'|'slug'|'name_ko'>[]) ?? []}
        pets={(myPets as any[]) ?? []}
      />
    </div>
  );
}
