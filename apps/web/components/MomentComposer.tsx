'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ImageUploader } from '@/components/ImageUploader';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';
import type { Pet } from '@hamster/shared';

export function MomentComposer({ pets }: { pets: Pick<Pet, 'id' | 'name'>[] }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [petId, setPetId] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl) { await modal.alert({ title: t('mc.imageRequiredTitle'), message: t('mc.imageRequiredMsg'), tone: 'info' }); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data, error } = await supabase.from('moments').insert({
      author_id: user.id,
      pet_id: petId || null,
      image_url: imageUrl,
      caption: caption.trim() || null,
    }).select('id').single();
    setSaving(false);
    if (error) { await modal.alert({ title: t('mc.insertFailTitle'), message: error.message, tone: 'error' }); return; }
    router.push(`/moments/${(data as any).id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ImageUploader bucket="community-images" value={imageUrl} onChange={setImageUrl} allowVideo
        label={t('mc.imageLabel')} hint={t('mc.imageHint')} />

      <textarea
        className="input min-h-[120px] text-[15px] leading-7"
        placeholder={t('mc.captionPh')}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={500}
      />

      <div className="flex items-center gap-2">
        <label className="text-sm text-cocoa-400">{t('mc.petTag')}</label>
        {pets.length > 0 ? (
          <select className="input flex-1" value={petId} onChange={(e) => setPetId(e.target.value)}>
            <option value="">{t('form.selectNone')}</option>
            {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        ) : (
          <span className="text-xs text-cocoa-300">
            {t('mc.petRegister').split('{profile}').map((part, i) =>
              i === 0
                ? <span key={i}>{part}</span>
                : <span key={i}><Link href="/profile" className="text-peach-500 underline">{t('form.profile')}</Link>{part}</span>
            )}
          </span>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>{t('form.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving || !imageUrl}>
          {saving ? t('mc.submitting') : t('mc.submit')}
        </button>
      </div>
    </form>
  );
}
