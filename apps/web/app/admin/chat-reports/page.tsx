import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ChatReportsList } from '@/components/ChatReportsList';

export const dynamic = 'force-dynamic';

export default async function ChatReportsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/chat-reports');

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) {
    return <div className="card text-center text-cocoa-400">관리자만 접근할 수 있어요.</div>;
  }

  const { data: reports } = await supabase
    .from('chat_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-cocoa-300 hover:text-peach-500">← 관리</Link>
      <h1 className="font-display text-2xl font-bold text-cocoa-500">채팅 신고 ({reports?.length ?? 0}건)</h1>
      <p className="text-sm text-cocoa-300">처리 완료한 신고는 삭제해 정리할 수 있어요.</p>
      <ChatReportsList initial={(reports as any) ?? []} />
    </div>
  );
}
