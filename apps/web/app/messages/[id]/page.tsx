import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DMConversation } from '@/components/DMConversation';

export const dynamic = 'force-dynamic';

export default async function DMConversationPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/messages/' + params.id);

  const { data: thread } = await supabase
    .from('dm_threads').select('id, user_a, user_b').eq('id', params.id).maybeSingle();
  if (!thread) notFound();
  if (thread.user_a !== user.id && thread.user_b !== user.id) notFound();

  const otherId = thread.user_a === user.id ? thread.user_b : thread.user_a;
  const { data: other } = await supabase
    .from('profiles').select('id, username, avatar_url').eq('id', otherId).maybeSingle();

  const { data: messages } = await supabase
    .from('dm_messages')
    .select('id, thread_id, sender_id, body, read_at, created_at')
    .eq('thread_id', params.id)
    .order('created_at', { ascending: true });

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/messages" className="text-sm text-cocoa-300 hover:text-peach-500">← 쪽지함</Link>
      <DMConversation
        threadId={params.id}
        meId={user.id}
        other={other as any}
        initialMessages={(messages as any[]) ?? []}
      />
    </div>
  );
}
