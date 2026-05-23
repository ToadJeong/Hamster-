'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { formatDate } from '@/lib/format';

type Comment = {
  id: string;
  post_id: string;
  author_id: string | null;
  anonymous_nickname: string | null;
  body: string;
  created_at: string;
  author?: { username: string | null; avatar_url: string | null } | null;
};

type Props = {
  postId: string;
  initialComments: Comment[];
  currentUserId: string | null;
  allowAnonymous: boolean;
};

export function CommunityCommentSection({
  postId, initialComments, currentUserId, allowAnonymous,
}: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseAnon = !currentUserId && allowAnonymous;

  // 익명 닉네임은 라운지와 공유
  useEffect(() => {
    if (currentUserId) return;
    try {
      const saved = localStorage.getItem('hamster.chat.nickname');
      if (saved) setNickname(saved);
    } catch {}
  }, [currentUserId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true); setError(null);
    try {
      if (!currentUserId) {
        if (!canUseAnon) { setError('로그인이 필요해요.'); return; }
        if (nickname.trim().length < 1) { setError('닉네임을 입력해 주세요.'); return; }
        if (password.length < 4) { setError('비밀번호는 4자 이상이어야 해요.'); return; }

        // 평문 비번을 sha256 해시 후 저장 (가이드의 익명 방식과 동일)
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
        const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');

        const { data, error } = await supabase
          .from('community_comments')
          .insert({
            post_id: postId,
            anonymous_nickname: nickname.trim(),
            anonymous_password_hash: hex,
            body: body.trim(),
          })
          .select('id, post_id, author_id, anonymous_nickname, body, created_at')
          .single();
        if (error) throw error;
        setComments((prev) => [...prev, data as Comment]);
        setBody('');
        try { localStorage.setItem('hamster.chat.nickname', nickname); } catch {}
      } else {
        const { data, error } = await supabase
          .from('community_comments')
          .insert({ post_id: postId, author_id: currentUserId, body: body.trim() })
          .select('id, post_id, author_id, anonymous_nickname, body, created_at, author:profiles!community_comments_author_id_fkey(username, avatar_url)')
          .single();
        if (error) throw error;
        setComments((prev) => [...prev, data as unknown as Comment]);
        setBody('');
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? '댓글 작성 실패');
    } finally {
      setSending(false);
    }
  }

  async function remove(c: Comment) {
    if (!c.author_id) {
      // 익명 댓글: 비번 입력 후 RPC 호출
      const pw = await modal.prompt({
        title: '익명 댓글 삭제',
        message: '작성하실 때 입력한 비밀번호를 입력해 주세요.',
        inputType: 'password',
        confirmText: '삭제하기',
      });
      if (!pw) return;
      const { data, error } = await supabase.rpc('delete_anonymous_community_comment', {
        p_id: c.id,
        p_password: pw,
      });
      if (error || !data) { await modal.alert({ title: '비밀번호가 일치하지 않아요', tone: 'error' }); return; }
      setComments((prev) => prev.filter((x) => x.id !== c.id));
      router.refresh();
      return;
    }
    const ok = await modal.confirm({ title: '댓글을 삭제할까요?', confirmText: '삭제하기' });
    if (!ok) return;
    const { error } = await supabase.from('community_comments').delete().eq('id', c.id);
    if (!error) {
      setComments((prev) => prev.filter((x) => x.id !== c.id));
      router.refresh();
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-bold text-cocoa-500">💬 댓글 {comments.length}</h2>

      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="card text-center text-cocoa-300">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</li>
        )}
        {comments.map((c) => {
          const display = c.author?.username ?? c.anonymous_nickname ?? '익명';
          const canRemove = c.author_id && currentUserId === c.author_id;
          return (
            <li key={c.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {c.author?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.author.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-peach-200">🐹</span>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-cocoa-500">{display}</span>
                      {!c.author_id && <span className="badge bg-cocoa-100 text-cocoa-400">익명</span>}
                      <span className="text-xs text-cocoa-300">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-cocoa-500">{c.body}</p>
                  </div>
                </div>
                {(canRemove || !c.author_id) && (
                  <button onClick={() => remove(c)} className="text-xs text-cocoa-300 hover:text-red-400">
                    삭제{!c.author_id ? '(비번)' : ''}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={submit} className="space-y-2">
        {!currentUserId && canUseAnon && (
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className="input"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
            <input
              className="input"
              type="password"
              placeholder="비밀번호 (4자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={4}
              maxLength={32}
            />
          </div>
        )}
        <textarea
          className="input min-h-[90px]"
          placeholder={
            currentUserId ? '햄집사로서 한마디 남겨주세요'
              : canUseAnon ? '익명으로 댓글을 남길 수 있어요'
              : '댓글을 쓰려면 로그인해 주세요'
          }
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={!currentUserId && !canUseAnon}
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
            disabled={(!currentUserId && !canUseAnon) || sending || !body.trim()}
          >
            {sending ? '등록 중…' : '댓글 등록'}
          </button>
        </div>
      </form>
    </section>
  );
}
