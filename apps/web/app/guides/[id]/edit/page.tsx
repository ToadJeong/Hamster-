import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GuideEditor } from '@/components/GuideEditor';
import type { Species } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function EditGuidePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: guide } = await supabase
    .from('guides')
    .select('id, author_id, title, body, species_id, cover_url')
    .eq('id', params.id)
    .maybeSingle();

  if (!guide) notFound();
  if (guide.author_id !== user.id) {
    redirect(`/guides/${params.id}`);
  }

  const { data: speciesList } = await supabase
    .from('species')
    .select('id, slug, name_ko')
    .order('name_ko', { ascending: true });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-cocoa-500">가이드 수정</h1>
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
        }}
      />
    </div>
  );
}
