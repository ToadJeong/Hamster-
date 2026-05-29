'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
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

export function MemorialCommentSection({
  memorialId, initialComments, currentUserId, isStaff,
}: {
  memorialId: string;
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
  const sendingRef = useRef(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !currentUserId) return;
    if (sendingRef.current) return;

    sendingRef.current = true; setSending(true);
    const tempId = 'temp-' + (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID() : String(Date.now()));
    const temp: Comment & { pending?: boolean } = {
      id: tempId, author_id: currentUserId, body: text,
      created_at: new Date().toISOString(), author: null, pending: true,
    };
    setComments((prev) => [...prev, temp]);
    setBody('');

    try {
      const { data, error } = await supabase
        .from('memorial_comments')
        .insert({ memorial_id: memorialId, author_id: currentUserId, body: text })
        .select('id, author_id, body, created_at, author:profiles!memorial_comments_author_id_fkey(username, avatar_url)')
        .single();
      if (error || !data) throw error ?? new Error(t('cm.submitFailed'));
      setComments((prev) => prev.map((c) => (c.id === tempId ? (data as unknown as Comment) : c)));
      router.refresh();
    } catch (err: any) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setBody(text);
      await modal.alert({ title: t('cm.submitFailed'), message: err?.message, tone: 'error' });
    } finally {
      sendingRef.current = false; setSending(false);
    }
  }

  async function remove(c: Comment) {
    const ok = await modal.confirm({ title: t('cm.delConfirmTitle'), confirmText: t('cm.delete') });
    if (!ok) return;
    const { error } = await supabase.from('memorial_comments').delete().eq('id', c.id);
    if (!error) { setComments((prev) => prev.filter((x) => x.id !== c.id)); router.refresh(); }
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-bold text-cocoa-500">💌 {t('mem.tributeMessages')} {comments.length}</h2>

      <ul className="space-y-2.5">
        {comments.length === 0 && <li className="card text-center text-sm text-cocoa-300">{t('mem.commentEmpty')}</li>}
        {comments.map((c) => {
          const pending = !!(c as any).pending;
          return (
          <li key={c.id} className={'flex items-start gap-2.5 ' + (pending ? 'opacity-60' : '')}>
            {c.author?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.author.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-lilac-100 text-xs">🕊️</span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-cocoa-500">{c.author?.username ?? t('cm.defaultName')}</span>
                <span className="text-xs text-cocoa-300">{pending ? t('cm.sending') : formatDate(c.created_at)}</span>
              </div>
              <p className="mt-0.5 whitespace-pre-line text-cocoa-500">{c.body}</p>
            </div>
            {!pending && (currentUserId === c.author_id || isStaff) && (
              <button onClick={() => remove(c)} className="shrink-0 text-[11px] text-cocoa-300 hover:text-red-400">{t('cm.delete')}</button>
            )}
          </li>
          );
        })}
      </ul>

      {currentUserId ? (
        <form onSubmit={submit} className="flex gap-2">
          <input className="input flex-1 py-2 text-sm" placeholder={t('mem.commentPh')} value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} />
          <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={!body.trim() || sending}>{t('cm.submitShort')}</button>
        </form>
      ) : (
        <p className="text-center text-sm text-cocoa-300">
          {t('cm.loginToComment').split('{login}').map((part, i) =>
            i === 0
              ? <span key={i}>{part}</span>
              : <span key={i}><Link href={'/login?next=/memorial/' + memorialId} className="text-peach-500 underline">{t('auth.signup.loginLink')}</Link>{part}</span>
          )}
        </p>
      )}
    </section>
  );
}
