import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BannedWordsManager } from '@/components/BannedWordsManager';

export const dynamic = 'force-dynamic';

export default async function BannedWordsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/banned-words');

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) {
    return <div className="card text-center text-cocoa-400">관리자만 접근할 수 있어요.</div>;
  }

  const { data: words } = await supabase
    .from('chat_banned_words')
    .select('id, word, created_at')
    .order('word');

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-cocoa-300 hover:text-peach-500">← 관리</Link>
      <h1 className="font-display text-2xl font-bold text-cocoa-500">채팅 금지어</h1>
      <p className="text-sm text-cocoa-300">여기에 등록된 단어가 포함된 메시지는 전송 자체가 차단돼요.</p>
      <BannedWordsManager initial={(words as any) ?? []} />
    </div>
  );
}
