'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { formatDate } from '@/lib/format';
import type { DMMessage } from '@hamster/shared';

type Props = {
  threadId: string;
  meId: string;
  other: { id: string; username: string | null; avatar_url: string | null } | null;
  initialMessages: DMMessage[];
};

export function DMConversation({ threadId, meId, other, initialMessages }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const modal = useModal();
  const [messages, setMessages] = useState<DMMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // 실시간 구독 + 진입 시 읽음 처리
  useEffect(() => {
    // 진입 즉시 메시지 일괄 읽음 처리
    void supabase.rpc('mark_dm_read', { p_thread_id: threadId });

    const ch = supabase
      .channel(`dm:${threadId}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `thread_id=eq.${threadId}` },
          (payload) => {
            const m = payload.new as DMMessage;
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
            // 내 메시지가 아니면 즉시 읽음 처리
            if (m.sender_id !== meId) {
              void supabase.rpc('mark_dm_read', { p_thread_id: threadId });
            }
          })
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [supabase, threadId, meId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const { data, error } = await supabase
      .from('dm_messages')
      .insert({ thread_id: threadId, sender_id: meId, body })
      .select('*')
      .single();
    setSending(false);
    if (error) { await modal.alert({ title: '전송 실패', message: error.message, tone: 'error' }); return; }
    setMessages((prev) => [...prev, data as DMMessage]);
    setDraft('');
  }

  return (
    <div className="mt-3 flex h-[70vh] flex-col overflow-hidden rounded-cute border border-cream-200 bg-white">
      <header className="flex items-center gap-3 border-b border-cream-200 bg-cream-50 px-4 py-3">
        {other?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={other.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-peach-200 text-lg">🐹</span>
        )}
        <h2 className="font-semibold text-cocoa-500">{other?.username ?? '햄집사'}</h2>
      </header>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-cocoa-300">인사를 보내며 대화를 시작해보세요.</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={'flex flex-col ' + (mine ? 'items-end' : 'items-start')}>
              <div
                className={
                  'max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-sm ' +
                  (mine ? 'bg-peach-400 text-white' : 'bg-cream-100 text-cocoa-500')
                }
              >
                {m.body}
              </div>
              <span className="mt-0.5 text-[10px] text-cocoa-300">{formatDate(m.created_at)}</span>
            </div>
          );
        })}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-2 border-t border-cream-200 bg-white px-3 py-2.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="input flex-1 py-1.5 text-sm"
          maxLength={1000}
        />
        <button type="submit" className="btn-primary px-4 py-1.5 text-sm" disabled={!draft.trim() || sending}>
          전송
        </button>
      </form>
    </div>
  );
}
