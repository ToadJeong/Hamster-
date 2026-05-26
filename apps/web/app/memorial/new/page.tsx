import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MemorialComposer } from '@/components/MemorialComposer';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function NewMemorialPage({ searchParams }: { searchParams: { pet?: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/memorial/new');
  const t = makeT(getLocale());

  let initial: { petId?: string; name?: string; speciesLabel?: string; photoUrl?: string } | undefined;
  if (searchParams.pet) {
    const { data: pet } = await supabase
      .from('pets').select('id, name, species_label, photo_url')
      .eq('id', searchParams.pet).eq('owner_id', user.id).maybeSingle();
    if (pet) initial = {
      petId: (pet as any).id, name: (pet as any).name,
      speciesLabel: (pet as any).species_label ?? undefined, photoUrl: (pet as any).photo_url ?? undefined,
    };
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('mem.newTitle')}</h1>
      <p className="text-sm text-cocoa-300">{t('mem.newSubtitle')}</p>
      <MemorialComposer initial={initial} />
    </div>
  );
}
