'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { insertAnonymousCommunity } from '@/lib/anon-community';
import { MultiImageUploader } from '@/components/MultiImageUploader';
import { useT } from '@/components/I18nProvider';
import { COMMUNITY_CATEGORY_LABEL, type CommunityCategory } from '@hamster/shared';

export function CommunityEditor({
  allowAnonymous,
  isAuthed,
}: { allowAnonymous: boolean; isAuthed: boolean }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const t = useT();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<CommunityCategory>('free');
  const [tagsInput, setTagsInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseAnon = !isAuthed && allowAnonymous;

  const parsedTags = Array.from(new Set(
    tagsInput
      .split(/[,\s#]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0 && t.length <= 20)
  )).slice(0, 8);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      if (!isAuthed) {
        if (!canUseAnon) throw new Error(t('form.loginRequired'));
        if (nickname.trim().length < 1) throw new Error(t('form.enterNickname'));
        if (password.length < 4) throw new Error(t('form.password4'));
        const { id, error } = await insertAnonymousCommunity(supabase, {
          nickname: nickname.trim(), password,
          title: title.trim(), body: body.trim(), category,
        });
        if (error || !id) throw error ?? new Error(t('form.submitFailed'));
        if (parsedTags.length > 0) {
          await supabase.from('community_posts').update({ tags: parsedTags }).eq('id', id);
        }
        router.push(`/community/${id}`);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error(t('form.loginRequired'));
        const { data, error } = await supabase
          .from('community_posts')
          .insert({
            author_id: user.id, title: title.trim(), body: body.trim(),
            category, tags: parsedTags, images, cover_url: images[0] ?? null,
          })
          .select('id').single();
        if (error) throw error;
        router.push(`/community/${(data as any).id}`);
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? t('form.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!isAuthed && canUseAnon && (
        <div className="card bg-cream-50">
          <p className="mb-2 text-sm font-semibold text-cocoa-500">{t('form.anonWrite')}</p>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="input" placeholder={t('form.nickname')} value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} required />
            <input className="input" type="password" placeholder={t('form.passwordMin')} value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} maxLength={32} required />
          </div>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-[1fr,160px]">
        <input className="input text-lg font-semibold" placeholder={t('form.title')} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value as CommunityCategory)}>
          {(Object.keys(COMMUNITY_CATEGORY_LABEL) as CommunityCategory[]).map((k) => (
            <option key={k} value={k}>{COMMUNITY_CATEGORY_LABEL[k].emoji} {COMMUNITY_CATEGORY_LABEL[k].label}</option>
          ))}
        </select>
      </div>

      {isAuthed && (
        <MultiImageUploader
          bucket="community-images"
          images={images}
          onChange={setImages}
          allowVideo
          label={t('ce.cover')}
          hint={t('ce.coverHint')}
        />
      )}

      <textarea
        className="input min-h-[280px] text-[15px] leading-7"
        placeholder={t('ce.bodyPh')}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />

      <div>
        <input
          className="input"
          placeholder={t('ce.tagsPh')}
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
        {parsedTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {parsedTags.map((tg) => <span key={tg} className="badge bg-lilac-50 text-lilac-400">#{tg}</span>)}
          </div>
        )}
        <p className="mt-1 text-xs text-cocoa-300">
          {t('ce.tagsHint')}
        </p>
      </div>

      {error && <div className="card text-red-500">{error}</div>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>{t('form.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving || !title.trim() || !body.trim()}>
          {saving ? t('ce.posting') : t('ce.post')}
        </button>
      </div>
    </form>
  );
}
