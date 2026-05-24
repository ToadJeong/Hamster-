'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { formatDate } from '@/lib/format';

type Comment = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: { username: string | null; avatar_url: string | null } | null;
};

export function MomentCommentSection({
  momentId, initialComments, currentUserId, isStaff,
}: {
  momentId: string;
  initialComments: Comment[];
  currentUserId: string | null;
  isStaff: boolean;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !currentUserId) return;
    setSending(true);
    const { data, error } = await supabase
      .from('moment_comments')
      .insert({ moment_id: momentId, author_id: currentUserId, body: body.trim() })
      .select('id, moment_id, author_id, body, created_at, author:profiles!moment_comments_author_id_fkey(username, avatar_url)')
      .single();
    setSending(false);
    if (error) { await modal.alert({ title: '댓글 작성 실패', message: error.message, tone: 'error' }); return; }
    setComments((prev) => [...prev, data as unknown as Comment]);
    setBody('');
    router.refresh();
  }

  async function remove(c: Comment) {
    const ok = await modal.confirm({ title: '댓글을 삭제할까요?', confirmText: '삭제' });
    if (!ok) return;
    const { error } = await supabase.from('moment_comments').delete().eq('id', c.id);
    if (!error) { setComments((prev) => prev.filter((x) => x.id !== c.id)); router.refresh(); }
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-base font-bold text-cocoa-500">💬 댓글 {comments.length}</h2>

      <ul className="space-y-2.5">
        {comments.length === 0 && <li className="text-center text-sm text-cocoa-300">첫 댓글을 남겨보세요!</li>}
        {comments.map((c) => (
          <li key={c.id} className="flex items-start gap-2.5">
            {c.author?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.author.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-peach-200 text-xs">🐹</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-cocoa-500"><span className="font-bold">{c.author?.username ?? '햄집사'}</span> {c.body}</p>
              <p className="text-[11px] text-cocoa-300">{formatDate(c.created_at)}</p>
            </div>
            {(currentUserId === c.author_id || isStaff) && (
              <button onClick={() => remove(c)} className="shrink-0 text-[11px] text-cocoa-300 hover:text-red-400">삭제</button>
            )}
          </li>
        ))}
      </ul>

      {currentUserId ? (
        <form onSubmit={submit} className="flex gap-2">
          <input className="input flex-1 py-2 text-sm" placeholder="따뜻한 한마디 남기기" value={body} onChange={(e) => setBody(e.target.value)} maxLength={300} />
          <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={!body.trim() || sending}>등록</button>
        </form>
      ) : (
        <p className="text-center text-sm text-cocoa-300">
          <Link href="/login?next=/moments" className="text-peach-500 underline">로그인</Link> 후 댓글을 남길 수 있어요
        </p>
      )}
    </section>
  );
}
