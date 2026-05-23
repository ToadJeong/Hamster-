'use client';

/**
 * 우하단 플로팅 실시간 채팅 (v2).
 *
 * 개선점:
 *  - 신규 접속자도 최근 1시간 메시지를 RPC get_recent_lobby(1)로 받아 옴
 *  - 닉네임은 localStorage('hamster.chat.nickname')로 영구 저장
 *  - 보낼 때 broadcast + DB INSERT 동시 수행 (실시간 + 영구 기록)
 *  - 회원이면 작성자 카드 ⓘ 옆에 "쪽지" 버튼이 보여 DM 시작 가능
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CHAT_CHANNEL, MAX_CHAT_MESSAGE_LENGTH, PRESENCE_CHANNEL,
  type ChatMessage,
} from '@hamster/shared';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { findBannedWords, maskBannedWords } from '@/lib/chat-filter';
import { useModal } from '@/components/Modal';
import { useRouter } from 'next/navigation';

const NICKNAME_KEY = 'hamster.chat.nickname';   // localStorage (영구)
const MAX_KEEP = 200;

type Props = {
  enabled: boolean;
  currentUser: { id: string; username: string | null; isAdmin: boolean } | null;
};

export function LiveChat({ enabled, currentUser }: Props) {
  if (!enabled) return null;
  return <LiveChatInner currentUser={currentUser} />;
}

function LiveChatInner({ currentUser }: { currentUser: Props['currentUser'] }) {
  const router = useRouter();
  const modal = useModal();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [count, setCount] = useState(1);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [nickname, setNickname] = useState<string>(currentUser?.username ?? '');
  const [warn, setWarn] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const listRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 닉네임 영구 복원 (localStorage)
  useEffect(() => {
    if (currentUser) return;
    try {
      const saved = localStorage.getItem(NICKNAME_KEY);
      if (saved) setNickname(saved);
    } catch {}
  }, [currentUser]);

  // 닉네임 변경 → localStorage에 저장
  useEffect(() => {
    if (currentUser) return;
    try { localStorage.setItem(NICKNAME_KEY, nickname); } catch {}
  }, [nickname, currentUser]);

  // 최근 1시간 기록 로드
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_recent_lobby', { p_hours: 1 });
      if (error || !data) return;
      // DB row → ChatMessage 형태로 변환
      const rows = (data as any[]).map((r) => ({
        id: r.id,
        body: r.body,
        sender_label: r.sender_label,
        sender_id: r.sender_id,
        sender_session: r.sender_session,
        is_admin: !!r.is_admin,
        created_at: new Date(r.created_at).getTime(),
      } satisfies ChatMessage));
      setMessages(rows);
    })();
  }, [supabase]);

  // 금지어 로드
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('chat_banned_words').select('word');
      setBannedWords(((data ?? []) as { word: string }[]).map((r) => r.word));
    })();
  }, [supabase]);

  // 메시지 broadcast 구독
  useEffect(() => {
    const ch = supabase.channel(CHAT_CHANNEL, { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'message' }, ({ payload }) => {
      const msg = payload as ChatMessage;
      setMessages((prev) => [...prev, msg].slice(-MAX_KEEP));
    });
    ch.subscribe();
    channelRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, [supabase]);

  // 접속자 presence
  useEffect(() => {
    const ch = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: sessionIdRef.current } },
    });
    ch.on('presence', { event: 'sync' }, () => {
      setCount(Object.keys(ch.presenceState()).length || 1);
    });
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({
          label: currentUser?.username ?? (nickname || '게스트'),
          isAdmin: !!currentUser?.isAdmin,
          joined_at: Date.now(),
        });
      }
    });
    presenceRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, [supabase, currentUser, nickname]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    if (body.length > MAX_CHAT_MESSAGE_LENGTH) {
      setWarn(`${MAX_CHAT_MESSAGE_LENGTH}자 이내로 입력해 주세요.`);
      return;
    }
    const label = currentUser?.username ?? (nickname.trim() || '게스트');

    const hits = findBannedWords(body, bannedWords);
    if (hits.length > 0) {
      setWarn(`사용할 수 없는 표현이 포함되어 있어요 (${hits[0].word}).`);
      return;
    }

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      body,
      sender_label: label,
      sender_id: currentUser?.id ?? null,
      sender_session: sessionIdRef.current,
      is_admin: !!currentUser?.isAdmin,
      created_at: Date.now(),
    };

    // 실시간 분배
    await channelRef.current?.send({ type: 'broadcast', event: 'message', payload: msg });
    // 영구 기록 (실패해도 채팅 자체는 진행)
    void supabase.from('lobby_messages').insert({
      id: msg.id,
      sender_id: msg.sender_id,
      sender_label: msg.sender_label,
      sender_session: msg.sender_session,
      is_admin: msg.is_admin ?? false,
      body: msg.body,
    });

    setMessages((prev) => [...prev, msg].slice(-MAX_KEEP));
    setDraft('');
    setWarn(null);
  }

  async function report(m: ChatMessage) {
    const reason = await modal.prompt({
      title: '이 메시지를 신고할까요?',
      message: '신고 사유를 적어주세요. 운영자에게 전달됩니다.',
      placeholder: '예: 욕설, 광고',
      confirmText: '신고하기',
    });
    if (reason === null) return;
    const { error } = await supabase.from('chat_reports').insert({
      reporter_id: currentUser?.id ?? null,
      reporter_label: currentUser?.username ?? (nickname || null),
      target_label: m.sender_label,
      target_session: m.sender_session,
      message_body: m.body,
      reason: reason.trim() || null,
    });
    if (error) await modal.alert({ title: '신고 등록 실패', message: error.message, tone: 'error' });
    else await modal.alert({ title: '신고가 접수됐어요', tone: 'success' });
  }

  async function startDM(m: ChatMessage) {
    if (!currentUser) {
      router.push('/login?next=' + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!m.sender_id) {
      await modal.alert({ title: '비회원에게는 쪽지를 보낼 수 없어요', tone: 'info' });
      return;
    }
    const { data, error } = await supabase.rpc('open_dm_thread', { p_other: m.sender_id });
    if (error || !data) { await modal.alert({ title: '대화방을 열 수 없어요', message: error?.message, tone: 'error' }); return; }
    router.push(`/messages/${data}`);
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 md:bottom-5 md:right-5">
      <button
        onClick={() => setOpen(!open)}
        className={
          'flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-peach-500 ' +
          (open ? 'opacity-0 pointer-events-none' : '')
        }
        aria-label="채팅 열기"
      >
        💬 라운지
        <span className="rounded-full bg-white/30 px-1.5 py-0.5 text-xs">{count}</span>
      </button>

      {open && (
        <div className="flex h-[520px] w-[320px] flex-col overflow-hidden rounded-cute border border-cream-200 bg-white shadow-soft md:h-[560px] md:w-[360px]">
          <header className="flex items-center justify-between border-b border-cream-200 bg-cream-50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-cocoa-500">
              <span>💬 햄찌 라운지</span>
              <span className="badge bg-mint-100 text-mint-400">🟢 {count}명</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-cocoa-300 hover:text-cocoa-500" aria-label="닫기">✕</button>
          </header>

          {!currentUser && (
            <div className="border-b border-cream-200 bg-cream-50/60 px-3 py-2">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 16))}
                placeholder="라운지 닉네임 (이 기기에 저장돼요)"
                className="input py-1.5 text-xs"
              />
            </div>
          )}

          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <p className="py-8 text-center text-xs text-cocoa-300">
                첫 인사를 남겨보세요! 최근 1시간 동안의 메시지가 모두에게 표시돼요.
              </p>
            )}
            {messages.map((m) => {
              const mine = m.sender_session === sessionIdRef.current;
              const display = maskBannedWords(m.body, bannedWords);
              return (
                <div key={m.id} className={'group flex flex-col ' + (mine ? 'items-end' : 'items-start')}>
                  <div className={'mb-0.5 flex items-center gap-1 text-[10px] text-cocoa-300 ' + (mine ? 'flex-row-reverse' : '')}>
                    <span>{m.sender_label}{m.is_admin && ' ⭐'}</span>
                    {!mine && (
                      <>
                        {m.sender_id && currentUser && m.sender_id !== currentUser.id && (
                          <button onClick={() => startDM(m)} className="text-cocoa-300 hover:text-peach-500" title="쪽지 보내기">
                            ✉
                          </button>
                        )}
                        <button onClick={() => report(m)} className="opacity-0 transition group-hover:opacity-100 hover:text-red-400" title="신고">
                          ⚠
                        </button>
                      </>
                    )}
                  </div>
                  <div
                    className={
                      'max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-sm ' +
                      (mine
                        ? 'bg-peach-400 text-white'
                        : m.is_admin
                          ? 'bg-lilac-100 text-cocoa-500'
                          : 'bg-cream-100 text-cocoa-500')
                    }
                  >
                    {display}
                  </div>
                </div>
              );
            })}
          </div>

          {warn && <div className="border-t border-red-100 bg-red-50 px-3 py-1.5 text-xs text-red-500">{warn}</div>}

          <form onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-center gap-2 border-t border-cream-200 bg-white px-2 py-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="메시지를 입력해 주세요"
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
              className="input flex-1 py-1.5 text-sm"
            />
            <button type="submit" className="btn-primary px-3 py-1.5 text-sm" disabled={!draft.trim()}>
              보내기
            </button>
          </form>
          <p className="border-t border-cream-200 bg-cream-50 px-3 py-1 text-[10px] text-cocoa-300">
            🐹 메시지는 1시간 동안만 보존돼요. 회원끼리는 ✉로 쪽지 보내기 가능.
          </p>
        </div>
      )}
    </div>
  );
}
