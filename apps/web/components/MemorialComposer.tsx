'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ImageUploader } from '@/components/ImageUploader';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';

const EMOJIS = ['🐹', '⭐', '🌈', '💫', '🌸', '🕊️', '☁️', '🌷', '💖', '🍃'];

export function MemorialComposer({
  initial,
}: {
  initial?: { petId?: string; name?: string; speciesLabel?: string; photoUrl?: string };
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();

  const [emoji, setEmoji] = useState('🐹');
  const [name, setName] = useState(initial?.name ?? '');
  const [speciesLabel, setSpeciesLabel] = useState(initial?.speciesLabel ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photoUrl ?? null);
  const [bornAt, setBornAt] = useState('');
  const [passedAt, setPassedAt] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { await modal.alert({ title: t('mem.needName'), tone: 'info' }); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login?next=/memorial/new'); return; }
    const { data, error } = await supabase.from('memorials').insert({
      owner_id: user.id,
      pet_id: initial?.petId ?? null,
      name: name.trim(),
      species_label: speciesLabel.trim() || null,
      emoji,
      photo_url: photoUrl,
      born_at: bornAt || null,
      passed_at: passedAt || null,
      message: message.trim() || null,
    }).select('id').single();
    setSaving(false);
    if (error) { await modal.alert({ title: t('form.saveFailed'), message: error.message, tone: 'error' }); return; }
    router.push(`/memorial/${(data as any).id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* 이모지 선택 */}
      <div>
        <p className="mb-2 text-sm text-cocoa-400">{t('mem.emoji')}</p>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setEmoji(em)}
              className={
                'grid h-11 w-11 place-items-center rounded-2xl text-xl transition ' +
                (emoji === em ? 'bg-lilac-200 ring-2 ring-lilac-300' : 'bg-cream-50 hover:bg-cream-100')
              }
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <input className="input text-lg font-semibold" placeholder={t('mem.namePh')} value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} />
        <input className="input" placeholder={t('mem.speciesPh')} value={speciesLabel} onChange={(e) => setSpeciesLabel(e.target.value)} maxLength={40} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-cocoa-300">{t('mem.born')}</span>
          <input type="date" className="input mt-0.5" value={bornAt} onChange={(e) => setBornAt(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
        </label>
        <label className="block">
          <span className="text-xs text-cocoa-300">{t('mem.passed')}</span>
          <input type="date" className="input mt-0.5" value={passedAt} onChange={(e) => setPassedAt(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
        </label>
      </div>

      <ImageUploader bucket="community-images" value={photoUrl} onChange={setPhotoUrl} label={t('mem.photo')} hint={t('form.coverHintImg')} />

      <textarea
        className="input min-h-[140px] text-[15px] leading-7"
        placeholder={t('mem.messagePh')}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={1000}
      />

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>{t('form.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving || !name.trim()}>
          {saving ? t('mem.submitting') : t('mem.submit')}
        </button>
      </div>
    </form>
  );
}
