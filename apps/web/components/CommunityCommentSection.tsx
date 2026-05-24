'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';
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
  const t = useT();
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
        if (!canUseAnon) { setError(t('form.loginRequired')); return; }
        if (nickname.trim().length < 1) { setError(t('form.enterNickname')); return; }
        if (password.length < 4) { setError(t('cm.password4')); return; }

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
      setError(e.message ?? t('cm.submitFailed'));
    } finally {
      setSending(false);
    }
  }

  async function remove(c: Comment) {
    if (!c.author_id) {
      // 익명 댓글: 비번 입력 후 RPC 호출
      const pw = await modal.prompt({
        title: t('cm.delAnonTitle'),
        message: t('cm.delAnonMsg'),
        inputType: 'password',
        confirmText: t('cm.delConfirm'),
      });
      if (!pw) return;
      const { data, error } = await supabase.rpc('delete_anonymous_community_comment', {
        p_id: c.id,
        p_password: pw,
      });
      if (error || !data) { await modal.alert({ title: t('cm.wrongPassword'), tone: 'error' }); return; }
      setComments((prev) => prev.filter((x) => x.id !== c.id));
      router.refresh();
      return;
    }
    const ok = await modal.confirm({ title: t('cm.delConfirmTitle'), confirmText: t('cm.delConfirm') });
    if (!ok) return;
    const { error } = await supabase.from('community_comments').delete().eq('id', c.id);
    if (!error) {
      setComments((prev) => prev.filter((x) => x.id !== c.id));
      router.refresh();
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-bold text-cocoa-500">💬 {t('cm.title')} {comments.length}</h2>

      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="card text-center text-cocoa-300">{t('cm.empty')}</li>
        )}
        {comments.map((c) => {
          const display = c.author?.username ?? c.anonymous_nickname ?? t('common.anonymous');
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
                      {!c.author_id && <span className="badge bg-cocoa-100 text-cocoa-400">{t('common.anonymous')}</span>}
                      <span className="text-xs text-cocoa-300">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-cocoa-500">{c.body}</p>
                  </div>
                </div>
                {(canRemove || !c.author_id) && (
                  <button onClick={() => remove(c)} className="text-xs text-cocoa-300 hover:text-red-400">
                    {t('cm.delete')}{!c.author_id ? t('cm.deleteAnonSuffix') : ''}
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
              placeholder={t('form.nickname')}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
            <input
              className="input"
              type="password"
              placeholder={t('form.passwordMin')}
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
            currentUserId ? t('cm.phUser')
              : canUseAnon ? t('cm.phAnon')
              : t('cm.phLogin')
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
            {sending ? t('cm.sending') : t('cm.submit')}
          </button>
        </div>
      </form>
    </section>
  );
}
