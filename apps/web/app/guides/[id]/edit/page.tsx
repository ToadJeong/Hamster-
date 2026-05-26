import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GuideEditor } from '@/components/GuideEditor';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import type { Species } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function EditGuidePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const t = makeT(getLocale());

  const { data: guide } = await supabase
    .from('guides')
    .select('id, author_id, title, body, species_id, cover_url, images')
    .eq('id', params.id)
    .maybeSingle();

  if (!guide) notFound();

  // 본인 글이거나, 운영자/관리자면 수정 허용
  let isStaff = false;
  if (guide.author_id !== user.id) {
    const { data: pr } = await supabase.from('profiles').select('is_admin, is_moderator').eq('id', user.id).maybeSingle();
    isStaff = !!(pr as any)?.is_admin || !!(pr as any)?.is_moderator;
    if (!isStaff) redirect(`/guides/${params.id}`);
  }

  const { data: speciesList } = await supabase
    .from('species')
    .select('id, slug, name_ko')
    .order('name_ko', { ascending: true });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-cocoa-500">{t('ge.editTitle')}</h1>
      <GuideEditor
        species={(speciesList as Pick<Species,'id'|'slug'|'name_ko'>[]) ?? []}
        preselectSlug={null}
        allowAnonymous={false}
        isAuthed={true}
        initial={{
          id: guide.id,
          title: guide.title,
          body: guide.body,
          species_id: guide.species_id,
          cover_url: guide.cover_url,
          images: (guide as any).images ?? [],
        }}
      />
    </div>
  );
}
