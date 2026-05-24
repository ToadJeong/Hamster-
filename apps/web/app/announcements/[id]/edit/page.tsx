import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AnnouncementEditor } from '@/components/AnnouncementEditor';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function EditAnnouncement({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/announcements');
  const t = makeT(getLocale());

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!(profile as any)?.is_admin) {
    return <div className="card text-center text-cocoa-400">{t('ae.adminOnlyEdit')}</div>;
  }

  const { data: a } = await supabase
    .from('announcements')
    .select('id, title, body, pinned, cover_url')
    .eq('id', params.id)
    .maybeSingle();
  if (!a) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('ae.editTitle')}</h1>
      <AnnouncementEditor
        initial={{
          id: (a as any).id,
          title: (a as any).title,
          body: (a as any).body,
          pinned: (a as any).pinned,
          cover_url: (a as any).cover_url,
        }}
      />
    </div>
  );
}
