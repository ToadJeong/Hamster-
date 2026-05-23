import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AdminSettingsForm } from '@/components/AdminSettingsForm';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return (
      <div className="card text-center text-cocoa-400">
        <p className="text-3xl">🔒</p>
        <p className="mt-2">관리자만 접근할 수 있는 페이지예요.</p>
      </div>
    );
  }

  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-cocoa-500">사이트 관리</h1>
        <p className="mt-1 text-sm text-cocoa-300">
          소셜 로그인, 익명 게시, 공지 문구, 정책 본문을 한 곳에서 관리해요.
          모든 문구는 코드 배포 없이 즉시 반영됩니다.
        </p>
      </header>

      <AdminSettingsForm initial={settings} />

      <section className="card text-sm text-cocoa-400">
        <h2 className="mb-1 font-semibold text-cocoa-500">햄스터 도감 관리</h2>
        <p className="text-cocoa-300">
          현재는 Supabase Studio의 Table Editor에서 직접 편집할 수 있어요. 전용 관리 UI는 v2에서 제공됩니다.
        </p>
      </section>
    </div>
  );
}
