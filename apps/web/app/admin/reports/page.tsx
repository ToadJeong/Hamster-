import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PostReportsList } from '@/components/PostReportsList';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/reports');
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!(profile as any)?.is_admin) {
    return <div className="card text-center text-cocoa-400">관리자만 접근할 수 있어요.</div>;
  }

  const { data } = await supabase
    .from('post_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-cocoa-300 hover:text-peach-500">← 관리</Link>
      <h1 className="font-display text-2xl font-bold text-cocoa-500">🚨 글 신고 ({data?.length ?? 0}건)</h1>
      <PostReportsList initial={(data as any[]) ?? []} />
    </div>
  );
}
