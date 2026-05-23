import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AnnouncementEditor } from '@/components/AnnouncementEditor';

export const dynamic = 'force-dynamic';

export default async function NewAnnouncementPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/announcements/new');

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!(profile as any)?.is_admin) {
    return (
      <div className="card text-center text-cocoa-400">
        <p className="text-3xl">🔒</p>
        <p className="mt-2">관리자만 공지를 작성할 수 있어요.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">공지 작성</h1>
      <AnnouncementEditor />
    </div>
  );
}
