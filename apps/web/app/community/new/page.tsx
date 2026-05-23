import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CommunityEditor } from '@/components/CommunityEditor';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function NewCommunityPost() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const settings = await getSiteSettings();

  if (!user && !settings['app.allow_anonymous']) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-12 text-center">
        <p className="text-3xl">🐹</p>
        <p className="text-cocoa-400">익명 작성이 비활성화되어 있어요.</p>
        <Link href="/login?next=/community/new" className="btn-primary inline-flex">로그인하기</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">새 글 쓰기</h1>
      <CommunityEditor allowAnonymous={settings['app.allow_anonymous']} isAuthed={!!user} />
    </div>
  );
}
