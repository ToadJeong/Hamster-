import Link from 'next/link';
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

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/admin/reports" className="card transition hover:-translate-y-0.5 hover:shadow-soft">
          <h3 className="font-semibold text-cocoa-500">🚨 글 신고 처리</h3>
          <p className="mt-1 text-sm text-cocoa-300">신고된 게시글·댓글을 확인하고 처리해요.</p>
        </Link>
        <Link href="/admin/corrections" className="card transition hover:-translate-y-0.5 hover:shadow-soft">
          <h3 className="font-semibold text-cocoa-500">🛠 정보 제보 처리</h3>
          <p className="mt-1 text-sm text-cocoa-300">도감·가이드 정보 수정 제보를 검토해요.</p>
        </Link>
        <Link href="/admin/chat-reports" className="card transition hover:-translate-y-0.5 hover:shadow-soft">
          <h3 className="font-semibold text-cocoa-500">💬 채팅 신고 처리</h3>
          <p className="mt-1 text-sm text-cocoa-300">신고된 채팅 메시지를 검토하고 삭제 처리해요.</p>
        </Link>
        <Link href="/admin/banned-words" className="card transition hover:-translate-y-0.5 hover:shadow-soft">
          <h3 className="font-semibold text-cocoa-500">🚫 채팅 금지어</h3>
          <p className="mt-1 text-sm text-cocoa-300">실시간 채팅에서 차단할 단어를 추가·삭제해요.</p>
        </Link>
        <Link href="/admin/species" className="card transition hover:-translate-y-0.5 hover:shadow-soft">
          <h3 className="font-semibold text-cocoa-500">🐹 도감 관리</h3>
          <p className="mt-1 text-sm text-cocoa-300">햄스터 종을 홈페이지에서 직접 추가·수정·삭제해요.</p>
        </Link>
      </div>

    </div>
  );
}
