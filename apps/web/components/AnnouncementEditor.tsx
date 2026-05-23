'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  initial?: { id: string; title: string; body: string; pinned: boolean };
};

export function AnnouncementEditor({ initial }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요해요.');

      const payload = { title: title.trim(), body: body.trim(), pinned, created_by: user.id };

      if (initial) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('announcements').insert(payload);
        if (error) throw error;
      }
      router.push('/announcements');
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        className="input text-lg font-semibold"
        placeholder="공지 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={120}
      />

      <label className="flex items-center gap-2 text-sm text-cocoa-500">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        📌 상단에 고정
      </label>

      <div className="flex w-fit gap-1 rounded-full bg-cream-100 p-1 text-sm">
        <button type="button" onClick={() => setTab('write')}
          className={'rounded-full px-4 py-1.5 ' + (tab === 'write' ? 'bg-white font-semibold shadow-softer' : 'text-cocoa-300')}>
          작성
        </button>
        <button type="button" onClick={() => setTab('preview')}
          className={'rounded-full px-4 py-1.5 ' + (tab === 'preview' ? 'bg-white font-semibold shadow-softer' : 'text-cocoa-300')}>
          미리보기
        </button>
      </div>

      {tab === 'write' ? (
        <textarea
          className="input min-h-[300px] font-mono text-sm"
          placeholder={`## 안내\n공지 본문을 마크다운으로 작성해 주세요.\n\n- 항목 1\n- 항목 2`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      ) : (
        <div className="card min-h-[300px] prose-soft">
          {body.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          ) : (
            <p className="text-cocoa-300">미리보기 내용이 없어요.</p>
          )}
        </div>
      )}

      {error && <div className="card text-red-500">{error}</div>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving || !title.trim() || !body.trim()}>
          {saving ? '저장 중…' : initial ? '수정 완료' : '게시'}
        </button>
      </div>
    </form>
  );
}
