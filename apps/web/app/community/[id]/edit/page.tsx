import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CommunityEditPanel } from '@/components/CommunityEditPanel';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function EditCommunityPost({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/community/' + params.id + '/edit');
  const t = makeT(getLocale());

  const { data: post } = await supabase
    .from('community_posts')
    .select('id, author_id, title, body, category, tags, cover_url, images')
    .eq('id', params.id)
    .maybeSingle();

  if (!post) notFound();
  if ((post as any).author_id !== user.id) {
    redirect(`/community/${params.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('ce.editTitle')}</h1>
      <CommunityEditPanel
        initial={{
          id: (post as any).id,
          title: (post as any).title,
          body: (post as any).body,
          category: (post as any).category,
          tags: (post as any).tags ?? [],
          cover_url: (post as any).cover_url,
          images: (post as any).images ?? [],
        }}
      />
    </div>
  );
}
