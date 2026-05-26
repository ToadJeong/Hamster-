'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';
import { formatDate } from '@/lib/format';

type Comment = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: { username: string | null; avatar_url: string | null } | null;
};

export function RescueCommentSection({
  postId, initialComments, currentUserId, isStaff,
}: {
  postId: string;
  initialComments: Comment[];
  currentUserId: string | null;
  isStaff: boolean;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !currentUserId) return;
    setSending(true);
    const { data, error } = await supabase
      .from('rescue_comments')
      .insert({ post_id: postId, author_id: currentUserId, body: body.trim() })
      .select('id, author_id, body, created_at, author:profiles!rescue_comments_author_id_fkey(username, avatar_url)')
      .single();
    setSending(false);
    if (error) { await modal.alert({ title: t('cm.submitFailed'), message: error.message, tone: 'error' }); return; }
    setComments((prev) => [...prev, data as unknown as Comment]);
    setBody('');
    router.refresh();
  }

  async function remove(c: Comment) {
    const ok = await modal.confirm({ title: t('cm.delConfirmTitle'), confirmText: t('cm.delete') });
    if (!ok) return;
    const { error } = await supabase.from('rescue_comments').delete().eq('id', c.id);
    if (!error) { setComments((prev) => prev.filter((x) => x.id !== c.id)); router.refresh(); }
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold text-cocoa-500">💬 {t('cm.title')} {comments.length}</h2>

      <ul className="space-y-2.5">
        {comments.length === 0 && <li className="card text-center text-sm text-cocoa-300">{t('cm.empty')}</li>}
        {comments.map((c) => (
          <li key={c.id} className="flex items-start gap-2.5">
            {c.author?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.author.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-peach-200 text-xs">🐹</span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-cocoa-500">{c.author?.username ?? t('cm.defaultName')}</span>
                <span className="text-xs text-cocoa-300">{formatDate(c.created_at)}</span>
              </div>
              <p className="mt-0.5 whitespace-pre-line text-cocoa-500">{c.body}</p>
            </div>
            {(currentUserId === c.author_id || isStaff) && (
              <button onClick={() => remove(c)} className="shrink-0 text-[11px] text-cocoa-300 hover:text-red-400">{t('cm.delete')}</button>
            )}
          </li>
        ))}
      </ul>

      {currentUserId ? (
        <form onSubmit={submit} className="flex gap-2">
          <input className="input flex-1 py-2 text-sm" placeholder={t('cm.phUser')} value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} />
          <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={!body.trim() || sending}>{t('cm.submitShort')}</button>
        </form>
      ) : (
        <p className="text-center text-sm text-cocoa-300">
          {t('cm.loginToComment').split('{login}').map((part, i) =>
            i === 0
              ? <span key={i}>{part}</span>
              : <span key={i}><Link href={'/login?next=/rescue/' + postId} className="text-peach-500 underline">{t('auth.signup.loginLink')}</Link>{part}</span>
          )}
        </p>
      )}
    </section>
  );
}
