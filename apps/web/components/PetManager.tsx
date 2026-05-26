'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ImageUploader } from '@/components/ImageUploader';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';
import { Hamster, paletteForSpecies } from '@/components/Hamster';
import { formatDate } from '@/lib/format';
import type { Pet } from '@hamster/shared';

type SpeciesOption = { id: string; slug: string; name_ko: string };

export function PetManager({
  initialPets, species,
}: {
  initialPets: Pet[];
  species: SpeciesOption[];
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();

  const [pets, setPets] = useState<Pet[]>(initialPets);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [birthday, setBirthday] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');

  function reset() {
    setName(''); setSpeciesId(''); setBirthday(''); setPhotoUrl(null); setBio('');
    setAdding(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { await modal.alert({ title: t('pm.needName'), tone: 'info' }); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const sp = species.find((s) => s.id === speciesId);
    const { data, error } = await supabase.from('pets').insert({
      owner_id: user.id,
      name: name.trim(),
      species_id: speciesId || null,
      species_label: sp?.name_ko ?? null,
      birthday: birthday || null,
      photo_url: photoUrl,
      bio: bio.trim() || null,
    }).select('*').single();
    setSaving(false);
    if (error) { await modal.alert({ title: t('mc.insertFailTitle'), message: error.message, tone: 'error' }); return; }
    setPets((prev) => [...prev, data as Pet]);
    reset();
    router.refresh();
  }

  async function remove(pet: Pet) {
    const ok = await modal.confirm({ title: t('pm.deleteConfirm').replace('{name}', pet.name), message: t('pm.deleteConfirmMsg'), confirmText: t('cm.delete') });
    if (!ok) return;
    const { error } = await supabase.from('pets').delete().eq('id', pet.id);
    if (error) { await modal.alert({ title: t('form.deleteFailed'), message: error.message, tone: 'error' }); return; }
    setPets((prev) => prev.filter((p) => p.id !== pet.id));
    router.refresh();
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-cocoa-500">
          <span className="h-4 w-1.5 rounded-full bg-mint-400" aria-hidden />{t('pm.title')} {pets.length}
        </h2>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-secondary text-sm">{t('pm.add')}</button>
        )}
      </div>

      {adding && (
        <form onSubmit={submit} className="card mb-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-cocoa-400">{t('pm.nameLabel')}</label>
              <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('pm.namePh')} maxLength={20} />
            </div>
            <div>
              <label className="text-sm text-cocoa-400">{t('pm.speciesLabel')}</label>
              <select className="input mt-1" value={speciesId} onChange={(e) => setSpeciesId(e.target.value)}>
                <option value="">{t('form.selectNone')}</option>
                {species.map((s) => <option key={s.id} value={s.id}>{s.name_ko}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-cocoa-400">{t('pm.birthday')}</label>
              <input type="date" className="input mt-1" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-cocoa-400">{t('pm.bioLabel')}</label>
              <input className="input mt-1" value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('pm.bioPh')} maxLength={60} />
            </div>
          </div>
          <ImageUploader bucket="community-images" value={photoUrl} onChange={setPhotoUrl} label={t('pm.photoLabel')} hint={t('form.coverHintImg')} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={reset}>{t('form.cancel')}</button>
            <button type="submit" className="btn-primary text-sm" disabled={saving || !name.trim()}>
              {saving ? t('form.registering') : t('form.register')}
            </button>
          </div>
        </form>
      )}

      {pets.length === 0 ? (
        !adding && <p className="card text-center text-sm text-cocoa-300">{t('pm.empty')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {pets.map((pet) => (
            <li key={pet.id} className="card flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-cream-200">
                {pet.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pet.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Hamster palette={paletteForSpecies(pet.species_label ?? 'golden')} className="h-full w-full" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-cocoa-500">{pet.name}</p>
                <p className="truncate text-xs text-cocoa-300">
                  {pet.species_label && <span className="text-mint-400">#{pet.species_label} </span>}
                  {pet.birthday && <>· {formatDate(pet.birthday)}</>}
                </p>
                {pet.bio && <p className="mt-0.5 truncate text-[13px] text-cocoa-400">{pet.bio}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Link href={`/memorial/new?pet=${pet.id}`} className="whitespace-nowrap text-[11px] text-lilac-400 hover:text-lilac-500">🌟 {t('mem.toStar')}</Link>
                <button onClick={() => remove(pet)} className="text-[11px] text-cocoa-300 hover:text-red-400">{t('cm.delete')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
