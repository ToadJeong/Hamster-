import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MemorialComposer } from '@/components/MemorialComposer';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function EditMemorialPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/memorial/' + params.id + '/edit');
  const t = makeT(getLocale());

  const { data: m } = await supabase
    .from('memorials')
    .select('id, owner_id, emoji, name, species_label, photo_url, born_at, passed_at, message')
    .eq('id', params.id)
    .maybeSingle();
  if (!m) notFound();

  let isStaff = false;
  if ((m as any).owner_id !== user.id) {
    const { data: prof } = await supabase.from('profiles').select('is_admin, is_moderator').eq('id', user.id).maybeSingle();
    isStaff = !!(prof as any)?.is_admin || !!(prof as any)?.is_moderator;
    if (!isStaff) redirect(`/memorial/${params.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('mem.editTitle')}</h1>
      <MemorialComposer
        initial={{
          id: (m as any).id,
          emoji: (m as any).emoji,
          name: (m as any).name,
          speciesLabel: (m as any).species_label ?? undefined,
          photoUrl: (m as any).photo_url ?? undefined,
          bornAt: (m as any).born_at ?? undefined,
          passedAt: (m as any).passed_at ?? undefined,
          message: (m as any).message ?? undefined,
        }}
      />
    </div>
  );
}
