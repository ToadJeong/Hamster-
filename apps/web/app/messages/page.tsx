import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function DMListPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/messages');

  const { data: threads, error } = await supabase
    .from('dm_threads')
    .select('id, user_a, user_b, last_message_at')
    .order('last_message_at', { ascending: false });

  // 상대방 프로필 매핑
  const otherIds = (threads ?? []).map((t: any) => (t.user_a === user.id ? t.user_b : t.user_a));
  const { data: profiles } = otherIds.length
    ? await supabase.from('profiles').select('id, username, avatar_url').in('id', otherIds)
    : { data: [] as any[] };
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  // 각 스레드의 마지막 메시지 미리보기 (마지막 1건)
  const threadIds = (threads ?? []).map((t: any) => t.id);
  const { data: lastMsgs } = threadIds.length
    ? await supabase
        .from('dm_messages')
        .select('thread_id, body, sender_id, created_at')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] };
  const lastByThread = new Map<string, any>();
  for (const m of lastMsgs ?? []) {
    if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">✉ 쪽지</h1>
      <p className="text-sm text-cocoa-300">햄집사 간 1:1 대화. 라운지의 ✉ 버튼으로도 시작할 수 있어요.</p>

      {error?.message?.includes('dm_threads') && (
        <div className="card text-amber-500">
          쪽지 기능을 사용하려면 마이그레이션 0006을 적용해 주세요.
        </div>
      )}

      {(!threads || threads.length === 0) ? (
        <div className="card text-center text-cocoa-300">아직 주고받은 쪽지가 없어요.</div>
      ) : (
        <ul className="space-y-2">
          {threads.map((t: any) => {
            const otherId = t.user_a === user.id ? t.user_b : t.user_a;
            const other = profileMap.get(otherId);
            const last = lastByThread.get(t.id);
            return (
              <li key={t.id}>
                <Link href={`/messages/${t.id}`} className="card flex items-center gap-3 transition hover:-translate-y-0.5 hover:shadow-soft">
                  {other?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={other.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-peach-200 text-lg">🐹</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-cocoa-500">{other?.username ?? '햄집사'}</p>
                    <p className="line-clamp-1 text-sm text-cocoa-300">
                      {last ? (last.sender_id === user.id ? '나: ' : '') + last.body : '대화를 시작해 보세요'}
                    </p>
                  </div>
                  <span className="text-xs text-cocoa-300">{formatDate(t.last_message_at)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
