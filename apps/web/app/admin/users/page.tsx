import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { UserManager } from '@/components/UserManager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/users');
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!(profile as any)?.is_admin) {
    return <div className="card text-center text-cocoa-400">마스터 관리자만 접근할 수 있어요.</div>;
  }

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-cocoa-300 hover:text-peach-500">← 관리</Link>
      <h1 className="font-display text-2xl font-bold text-cocoa-500">👥 회원·운영자 관리</h1>
      <p className="text-sm text-cocoa-300">아이디·이메일로 회원을 검색해 운영자(글 삭제·공지 권한)를 부여하거나 회수할 수 있어요.</p>
      <UserManager />
    </div>
  );
}
