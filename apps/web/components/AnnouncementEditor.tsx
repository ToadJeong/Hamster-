'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ImageUploader } from '@/components/ImageUploader';
import { useT } from '@/components/I18nProvider';

type Props = {
  initial?: { id: string; title: string; body: string; pinned: boolean; cover_url?: string | null };
};

export function AnnouncementEditor({ initial }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const t = useT();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.cover_url ?? null);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('form.loginRequired'));

      const payload = { title: title.trim(), body: body.trim(), pinned, cover_url: coverUrl, created_by: user.id };

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
      setError(e.message ?? t('form.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        className="input text-lg font-semibold"
        placeholder={t('ae.titlePh')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={120}
      />

      <label className="flex items-center gap-2 text-sm text-cocoa-500">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        {t('ae.pin')}
      </label>

      <ImageUploader
        bucket="announcement-images"
        value={coverUrl}
        onChange={setCoverUrl}
        label={t('ae.cover')}
        hint={t('form.coverHintImg')}
      />

      <div className="flex w-fit gap-1 rounded-full bg-cream-100 p-1 text-sm">
        <button type="button" onClick={() => setTab('write')}
          className={'rounded-full px-4 py-1.5 ' + (tab === 'write' ? 'bg-white font-semibold shadow-softer' : 'text-cocoa-300')}>
          {t('form.write')}
        </button>
        <button type="button" onClick={() => setTab('preview')}
          className={'rounded-full px-4 py-1.5 ' + (tab === 'preview' ? 'bg-white font-semibold shadow-softer' : 'text-cocoa-300')}>
          {t('form.preview')}
        </button>
      </div>

      {tab === 'write' ? (
        <textarea
          className="input min-h-[300px] font-mono text-sm"
          placeholder={t('ae.bodyPh')}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      ) : (
        <div className="card min-h-[300px] prose-soft">
          {body.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          ) : (
            <p className="text-cocoa-300">{t('form.noPreview')}</p>
          )}
        </div>
      )}

      {error && <div className="card text-red-500">{error}</div>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>{t('form.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving || !title.trim() || !body.trim()}>
          {saving ? t('form.saving') : initial ? t('form.editDone') : t('form.post')}
        </button>
      </div>
    </form>
  );
}
