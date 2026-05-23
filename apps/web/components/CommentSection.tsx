'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { insertAnonymousComment, validateAnonPassword } from '@/lib/anon-password';
import { formatDate } from '@/lib/format';
import type { CommentWithAuthor } from '@hamster/shared';

type Props = {
  guideId: string;
  initialComments: CommentWithAuthor[];
  currentUserId: string | null;
  allowAnonymous: boolean;
};

export function CommentSection({ guideId, initialComments, currentUserId, allowAnonymous }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState('');
  const [anonNickname, setAnonNickname] = useState('');
  const [anonPassword, setAnonPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseAnon = !currentUserId && allowAnonymous;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);

    try {
      if (!currentUserId) {
        if (!canUseAnon) {
          router.push('/login?next=' + encodeURIComponent(window.location.pathname));
          return;
        }
        const pwErr = validateAnonPassword(anonPassword);
        if (pwErr) { setError(pwErr); setSending(false); return; }
        if (anonNickname.trim().length < 1) { setError('닉네임을 입력해 주세요.'); setSending(false); return; }

        const { id, error } = await insertAnonymousComment(supabase, {
          guide_id: guideId,
          nickname: anonNickname.trim(),
          password: anonPassword,
          body: body.trim(),
        });
        if (error || !id) throw error ?? new Error('등록 실패');

        // 신규 댓글을 다시 조회하여 author null + anonymous_nickname 표시
        const { data: newRow } = await supabase
          .from('comments')
          .select('id, guide_id, author_id, anonymous_nickname, body, created_at, author:profiles!comments_author_id_fkey(username, avatar_url)')
          .eq('id', id)
          .single();
        if (newRow) {
          setComments((prev) => [...prev, newRow as unknown as CommentWithAuthor]);
        }
        setBody('');
        setAnonNickname('');
        setAnonPassword('');
        router.refresh();
        return;
      }

      // 로그인 사용자
      const { data, error } = await supabase
        .from('comments')
        .insert({ guide_id: guideId, author_id: currentUserId, body: body.trim() })
        .select('id, guide_id, author_id, anonymous_nickname, body, created_at, author:profiles!comments_author_id_fkey(username, avatar_url)')
        .single();

      if (error) throw error;
      if (data) {
        setComments((prev) => [...prev, data as unknown as CommentWithAuthor]);
        setBody('');
        router.refresh();
      }
    } catch (e: any) {
      setError(e.message ?? '댓글 등록 중 오류가 발생했어요.');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(c: CommentWithAuthor) {
    if (c.author_id) {
      const ok = await modal.confirm({ title: '댓글을 삭제할까요?', confirmText: '삭제하기' });
      if (!ok) return;
      const { error } = await supabase.from('comments').delete().eq('id', c.id);
      if (!error) {
        setComments((prev) => prev.filter((x) => x.id !== c.id));
        router.refresh();
      }
    } else {
      const pw = await modal.prompt({
        title: '익명 댓글 삭제',
        message: '작성하실 때 입력한 비밀번호를 입력해 주세요.',
        inputType: 'password',
        confirmText: '삭제하기',
      });
      if (!pw) return;
      const { data, error } = await supabase.rpc('delete_anonymous_comment', {
        p_comment_id: c.id,
        p_password: pw,
      });
      if (error || !data) {
        await modal.alert({ title: '비밀번호가 일치하지 않아요', tone: 'error' });
        return;
      }
      setComments((prev) => prev.filter((x) => x.id !== c.id));
      router.refresh();
    }
  }

  const canShowDelete = (c: CommentWithAuthor) =>
    (c.author_id && currentUserId === c.author_id) || (!c.author_id);

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-bold text-cocoa-500">댓글 {comments.length}</h2>

      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="card text-center text-cocoa-300">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</li>
        )}
        {comments.map((c) => {
          const displayName = c.author?.username ?? c.anonymous_nickname ?? '익명';
          return (
            <li key={c.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {c.author?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.author.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-peach-200">🐹</span>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-cocoa-500">{displayName}</span>
                      {!c.author_id && <span className="badge bg-cocoa-100 text-cocoa-400">익명</span>}
                      <span className="text-xs text-cocoa-300">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-cocoa-500">{c.body}</p>
                  </div>
                </div>
                {canShowDelete(c) && (
                  <button onClick={() => handleDelete(c)} className="text-xs text-cocoa-300 hover:text-red-400">
                    삭제
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={handleSubmit} className="space-y-2">
        {!currentUserId && canUseAnon && (
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className="input"
              placeholder="닉네임 (예: 햄집사123)"
              value={anonNickname}
              onChange={(e) => setAnonNickname(e.target.value)}
              maxLength={20}
            />
            <input
              className="input"
              type="password"
              placeholder="비밀번호 (4자 이상, 삭제 시 사용)"
              value={anonPassword}
              onChange={(e) => setAnonPassword(e.target.value)}
              minLength={4}
              maxLength={32}
            />
          </div>
        )}
        <textarea
          className="input min-h-[100px]"
          placeholder={
            currentUserId
              ? '햄집사로서 한 마디 남겨주세요'
              : canUseAnon
                ? '익명으로 댓글을 남길 수 있어요'
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
            disabled={(!currentUserId && !canUseAnon) || sending}
          >
            {sending ? '등록 중…' : '댓글 등록'}
          </button>
        </div>
      </form>
    </section>
  );
}
