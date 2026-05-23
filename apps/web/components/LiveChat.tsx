'use client';

/**
 * 우하단 플로팅 실시간 채팅.
 *
 * - Supabase Realtime broadcast로 메시지를 주고받음 (DB 미저장 = ephemeral)
 * - presence로 접속자 수 카운트
 * - 채팅 히스토리는 sessionStorage(`hamster.chat.history`)에 보관 → 페이지 이동에는 유지, 탭 닫으면 사라짐
 * - 금지어는 클라이언트에서 마스킹 + 본인이 차단당한 단어면 전송 자체 차단
 * - 메시지 우클릭/길게 누르기 대신 “⚠ 신고” 버튼으로 chat_reports에 INSERT
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CHAT_CHANNEL, MAX_CHAT_MESSAGE_LENGTH, PRESENCE_CHANNEL,
  type ChatMessage,
} from '@hamster/shared';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { findBannedWords, maskBannedWords } from '@/lib/chat-filter';

const HISTORY_KEY = 'hamster.chat.history';
const NICKNAME_KEY = 'hamster.chat.nickname';
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

  // 초기 히스토리 복구
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(HISTORY_KEY);
      if (raw) setMessages(JSON.parse(raw));
      const nm = sessionStorage.getItem(NICKNAME_KEY);
      if (nm && !currentUser) setNickname(nm);
    } catch { /* ignore */ }
  }, [currentUser]);

  // 메시지 변경 시 sessionStorage 동기화
  useEffect(() => {
    try {
      const tail = messages.slice(-MAX_KEEP);
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(tail));
    } catch { /* ignore */ }
  }, [messages]);

  // 금지어 로드
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('chat_banned_words').select('word');
      setBannedWords(((data ?? []) as { word: string }[]).map((r) => r.word));
    })();
  }, [supabase]);

  // 메시지 채널 (broadcast)
  useEffect(() => {
    const ch = supabase.channel(CHAT_CHANNEL, {
      config: { broadcast: { self: false } },
    });
    ch.on('broadcast', { event: 'message' }, ({ payload }) => {
      const msg = payload as ChatMessage;
      setMessages((prev) => [...prev, msg].slice(-MAX_KEEP));
    });
    ch.subscribe();
    channelRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, [supabase]);

  // 접속자 채널 (presence)
  useEffect(() => {
    const ch = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: sessionIdRef.current } },
    });
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      setCount(Object.keys(state).length || 1);
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

  // 스크롤 하단 유지
  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  // 닉네임 변경 저장
  useEffect(() => {
    if (currentUser) return;
    try { sessionStorage.setItem(NICKNAME_KEY, nickname); } catch { /* ignore */ }
  }, [nickname, currentUser]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    if (body.length > MAX_CHAT_MESSAGE_LENGTH) {
      setWarn(`${MAX_CHAT_MESSAGE_LENGTH}자 이내로 입력해 주세요.`);
      return;
    }
    const label = currentUser?.username ?? (nickname.trim() || '게스트');

    // 금지어 검사 → 발견되면 전송 차단
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

    const ch = channelRef.current;
    if (ch) {
      await ch.send({ type: 'broadcast', event: 'message', payload: msg });
    }
    setMessages((prev) => [...prev, msg].slice(-MAX_KEEP));
    setDraft('');
    setWarn(null);
  }

  async function report(m: ChatMessage) {
    if (!confirm('이 메시지를 신고할까요? 운영자에게 전달됩니다.')) return;
    const reason = prompt('신고 사유를 한 줄로 적어주세요 (선택)');
    const { error } = await supabase.from('chat_reports').insert({
      reporter_id: currentUser?.id ?? null,
      reporter_label: currentUser?.username ?? (nickname || null),
      target_label: m.sender_label,
      target_session: m.sender_session,
      message_body: m.body,
      reason: reason || null,
    });
    if (error) alert('신고 등록 실패: ' + error.message);
    else alert('신고가 접수되었어요.');
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 md:bottom-5 md:right-5">
      {/* 채팅 토글 버튼 */}
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
          {/* 헤더 */}
          <header className="flex items-center justify-between border-b border-cream-200 bg-cream-50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-cocoa-500">
              <span>💬 햄찌 라운지</span>
              <span className="badge bg-mint-100 text-mint-400">🟢 {count}명</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-cocoa-300 hover:text-cocoa-500"
              aria-label="닫기"
            >
              ✕
            </button>
          </header>

          {/* 비로그인 시 닉네임 */}
          {!currentUser && (
            <div className="border-b border-cream-200 bg-cream-50/60 px-3 py-2">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 16))}
                placeholder="라운지에서 쓸 닉네임 (탭 닫으면 초기화)"
                className="input py-1.5 text-xs"
              />
            </div>
          )}

          {/* 메시지 리스트 */}
          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <p className="py-8 text-center text-xs text-cocoa-300">
                첫 인사를 남겨보세요! 메시지는 탭을 닫으면 사라집니다.
              </p>
            )}
            {messages.map((m) => {
              const mine = m.sender_session === sessionIdRef.current;
              const display = maskBannedWords(m.body, bannedWords);
              return (
                <div key={m.id} className={'group flex flex-col ' + (mine ? 'items-end' : 'items-start')}>
                  <div className="mb-0.5 flex items-center gap-1 text-[10px] text-cocoa-300">
                    <span className={mine ? 'order-2' : ''}>
                      {m.sender_label}{m.is_admin && ' ⭐'}
                    </span>
                    {!mine && (
                      <button
                        onClick={() => report(m)}
                        className="opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                        title="신고"
                      >
                        ⚠
                      </button>
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

          {/* 입력 */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-center gap-2 border-t border-cream-200 bg-white px-2 py-2"
          >
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
            🐹 신고된 메시지는 운영자가 검토합니다. 채팅은 저장되지 않아요.
          </p>
        </div>
      )}
    </div>
  );
}
