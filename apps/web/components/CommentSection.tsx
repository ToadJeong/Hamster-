'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';
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
  const t = useT();
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
        if (anonNickname.trim().length < 1) { setError(t('form.enterNickname')); setSending(false); return; }

        const { id, error } = await insertAnonymousComment(supabase, {
          guide_id: guideId,
          nickname: anonNickname.trim(),
          password: anonPassword,
          body: body.trim(),
        });
        if (error || !id) throw error ?? new Error(t('cm.registerFailed'));

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
      setError(e.message ?? t('cm.submitError'));
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(c: CommentWithAuthor) {
    if (c.author_id) {
      const ok = await modal.confirm({ title: t('cm.delConfirmTitle'), confirmText: t('cm.delConfirm') });
      if (!ok) return;
      const { error } = await supabase.from('comments').delete().eq('id', c.id);
      if (!error) {
        setComments((prev) => prev.filter((x) => x.id !== c.id));
        router.refresh();
      }
    } else {
      const pw = await modal.prompt({
        title: t('cm.delAnonTitle'),
        message: t('cm.delAnonMsg'),
        inputType: 'password',
        confirmText: t('cm.delConfirm'),
      });
      if (!pw) return;
      const { data, error } = await supabase.rpc('delete_anonymous_comment', {
        p_comment_id: c.id,
        p_password: pw,
      });
      if (error || !data) {
        await modal.alert({ title: t('cm.wrongPassword'), tone: 'error' });
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
      <h2 className="font-display text-xl font-bold text-cocoa-500">{t('cm.title')} {comments.length}</h2>

      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="card text-center text-cocoa-300">{t('cm.empty')}</li>
        )}
        {comments.map((c) => {
          const displayName = c.author?.username ?? c.anonymous_nickname ?? t('common.anonymous');
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
                      {!c.author_id && <span className="badge bg-cocoa-100 text-cocoa-400">{t('common.anonymous')}</span>}
                      <span className="text-xs text-cocoa-300">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-cocoa-500">{c.body}</p>
                  </div>
                </div>
                {canShowDelete(c) && (
                  <button onClick={() => handleDelete(c)} className="text-xs text-cocoa-300 hover:text-red-400">
                    {t('cm.delete')}
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
              placeholder={t('ge.nicknamePh')}
              value={anonNickname}
              onChange={(e) => setAnonNickname(e.target.value)}
              maxLength={20}
            />
            <input
              className="input"
              type="password"
              placeholder={t('cm.passwordHint')}
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
              ? t('cm.phUser')
              : canUseAnon
                ? t('cm.phAnon')
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
            disabled={(!currentUserId && !canUseAnon) || sending}
          >
            {sending ? t('cm.sending') : t('cm.submit')}
          </button>
        </div>
      </form>
    </section>
  );
}
