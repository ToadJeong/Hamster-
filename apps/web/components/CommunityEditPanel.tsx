'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { MultiImageUploader } from '@/components/MultiImageUploader';
import { useT } from '@/components/I18nProvider';
import { COMMUNITY_CATEGORY_LABEL, type CommunityCategory } from '@hamster/shared';

type Props = {
  initial: {
    id: string;
    title: string;
    body: string;
    category: CommunityCategory;
    tags: string[];
    cover_url?: string | null;
    images?: string[];
  };
};

export function CommunityEditPanel({ initial }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const t = useT();

  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [category, setCategory] = useState<CommunityCategory>(initial.category);
  const [tagsInput, setTagsInput] = useState(initial.tags.join(' '));
  const [images, setImages] = useState<string[]>(initial.images ?? (initial.cover_url ? [initial.cover_url] : []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedTags = Array.from(new Set(
    tagsInput.split(/[,\s#]+/).map((s) => s.trim().replace(/^#/, '')).filter((s) => s.length > 0 && s.length <= 20)
  )).slice(0, 8);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const { error } = await supabase
      .from('community_posts')
      .update({
        title: title.trim(),
        body: body.trim(),
        category,
        tags: parsedTags,
        images,
        cover_url: images[0] ?? null,
      })
      .eq('id', initial.id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    router.push(`/community/${initial.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-2 md:grid-cols-[1fr,160px]">
        <input className="input text-lg font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value as CommunityCategory)}>
          {(Object.keys(COMMUNITY_CATEGORY_LABEL) as CommunityCategory[]).map((k) => (
            <option key={k} value={k}>{COMMUNITY_CATEGORY_LABEL[k].emoji} {COMMUNITY_CATEGORY_LABEL[k].label}</option>
          ))}
        </select>
      </div>

      <MultiImageUploader
        bucket="community-images"
        images={images}
        onChange={setImages}
        allowVideo
        label={t('ce.cover')}
        hint={t('ce.coverHint')}
      />

      <textarea className="input min-h-[280px] text-[15px] leading-7" value={body} onChange={(e) => setBody(e.target.value)} required />
      <div>
        <input className="input" placeholder={t('ce.tagsPh')} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
        {parsedTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {parsedTags.map((tg) => <span key={tg} className="badge bg-lilac-50 text-lilac-400">#{tg}</span>)}
          </div>
        )}
      </div>
      {error && <div className="card text-red-500">{error}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>{t('form.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving || !title.trim() || !body.trim()}>
          {saving ? t('form.saving') : t('form.editDone')}
        </button>
      </div>
    </form>
  );
}
