import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { RescueEditor } from '@/components/RescueEditor';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import type { Species, RescueKind } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function EditRescuePost({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/rescue/' + params.id + '/edit');
  const t = makeT(getLocale());

  const { data: post } = await supabase
    .from('rescue_posts')
    .select('id, author_id, kind, title, body, region, cover_url, contact_hint, age_months, species_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!post) notFound();
  if ((post as any).author_id !== user.id) redirect(`/rescue/${params.id}`);

  const { data: speciesList } = await supabase.from('species').select('id, slug, name_ko').order('name_ko');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('re.editTitle')}</h1>
      <RescueEditor
        species={(speciesList as Pick<Species,'id'|'slug'|'name_ko'>[]) ?? []}
        initial={{
          id: (post as any).id,
          kind: (post as any).kind as RescueKind,
          title: (post as any).title,
          body: (post as any).body,
          region: (post as any).region,
          cover_url: (post as any).cover_url,
          contact_hint: (post as any).contact_hint,
          age_months: (post as any).age_months,
          species_id: (post as any).species_id,
        }}
      />
    </div>
  );
}
