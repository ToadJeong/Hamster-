import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MomentComposer } from '@/components/MomentComposer';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import type { Pet } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function NewMomentPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/moments/new');
  const t = makeT(getLocale());

  const { data: pets } = await supabase
    .from('pets').select('id, name').eq('owner_id', user.id).order('created_at');

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('mc.newTitle')}</h1>
      <p className="text-sm text-cocoa-300">{t('moments.subtitle')}</p>
      <MomentComposer pets={(pets as Pick<Pet, 'id' | 'name'>[]) ?? []} />
    </div>
  );
}
