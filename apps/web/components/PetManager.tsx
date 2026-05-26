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
type PetRow = Pet & {
  owner?: { username: string | null } | null;
  carer?: { username: string | null } | null;
};
type IncomingReq = {
  id: string;
  pet_id: string;
  from_user: string;
  pet?: { name: string; photo_url: string | null } | null;
  from?: { username: string | null } | null;
};

export function PetManager({
  initialPets, sentPets, incoming, currentUserId, species,
}: {
  initialPets: PetRow[];
  sentPets: PetRow[];
  incoming: IncomingReq[];
  currentUserId: string;
  species: SpeciesOption[];
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();

  const [pets, setPets] = useState<PetRow[]>(initialPets);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [birthday, setBirthday] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [petStatus, setPetStatus] = useState<'raising' | 'fostering'>('raising');

  function reset() {
    setName(''); setSpeciesId(''); setBirthday(''); setPhotoUrl(null); setBio(''); setPetStatus('raising');
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
      carer_id: user.id,
      name: name.trim(),
      status: petStatus,
      species_id: speciesId || null,
      species_label: sp?.name_ko ?? null,
      birthday: birthday || null,
      photo_url: photoUrl,
      bio: bio.trim() || null,
    }).select('*').single();
    setSaving(false);
    if (error) { await modal.alert({ title: t('mc.insertFailTitle'), message: error.message, tone: 'error' }); return; }
    setPets((prev) => [...prev, data as PetRow]);
    reset();
    router.refresh();
  }

  async function remove(pet: PetRow) {
    const ok = await modal.confirm({ title: t('pm.deleteConfirm').replace('{name}', pet.name), message: t('pm.deleteConfirmMsg'), confirmText: t('cm.delete') });
    if (!ok) return;
    const { error } = await supabase.from('pets').delete().eq('id', pet.id);
    if (error) { await modal.alert({ title: t('form.deleteFailed'), message: error.message, tone: 'error' }); return; }
    setPets((prev) => prev.filter((p) => p.id !== pet.id));
    router.refresh();
  }

  async function sendFoster(pet: PetRow) {
    const input = await modal.prompt({ title: t('ft.sendTitle').replace('{name}', pet.name), message: t('ft.sendMsg'), placeholder: t('ft.sendPh'), confirmText: t('ft.send') });
    if (input === null) return;
    const username = input.trim();
    if (!username) return;
    setBusy(true);
    const { data: prof } = await supabase.from('profiles').select('id, username').eq('username', username).maybeSingle();
    if (!prof) { setBusy(false); await modal.alert({ title: t('ft.noUser'), tone: 'error' }); return; }
    if ((prof as any).id === currentUserId) { setBusy(false); await modal.alert({ title: t('ft.notSelf'), tone: 'error' }); return; }
    const { error } = await supabase.rpc('request_foster', { p_pet_id: pet.id, p_to_user: (prof as any).id });
    setBusy(false);
    if (error) { await modal.alert({ title: t('form.saveFailed'), message: error.message, tone: 'error' }); return; }
    await modal.alert({ title: t('ft.sent').replace('{name}', (prof as any).username ?? ''), tone: 'success' });
    router.refresh();
  }

  async function acceptFoster(reqId: string) {
    setBusy(true);
    const { error } = await supabase.rpc('accept_foster', { p_transfer_id: reqId });
    setBusy(false);
    if (error) { await modal.alert({ title: t('form.saveFailed'), message: error.message, tone: 'error' }); return; }
    router.refresh();
  }

  async function rejectFoster(reqId: string) {
    setBusy(true);
    await supabase.from('foster_transfers').delete().eq('id', reqId);
    setBusy(false);
    router.refresh();
  }

  async function returnFoster(pet: PetRow) {
    const ok = await modal.confirm({ title: t('ft.returnConfirm').replace('{name}', pet.name), confirmText: t('ft.return') });
    if (!ok) return;
    setBusy(true);
    const { error } = await supabase.rpc('return_foster', { p_pet_id: pet.id });
    setBusy(false);
    if (error) { await modal.alert({ title: t('form.saveFailed'), message: error.message, tone: 'error' }); return; }
    router.refresh();
  }

  return (
    <section className="space-y-3">
      {/* 내게 온 임보 요청 */}
      {incoming.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-lilac-200 bg-lilac-50/60 p-3">
          <p className="text-sm font-bold text-lilac-500">📨 {t('ft.incoming')} {incoming.length}</p>
          {incoming.map((req) => (
            <div key={req.id} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
              <p className="min-w-0 text-sm text-cocoa-500">
                <span className="font-bold">{req.from?.username ?? t('common.anonymous')}</span>
                {' '}· {t('ft.requestsFor').replace('{name}', req.pet?.name ?? '')}
              </p>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => acceptFoster(req.id)} disabled={busy} className="btn-primary px-3 py-1.5 text-xs">{t('ft.accept')}</button>
                <button onClick={() => rejectFoster(req.id)} disabled={busy} className="btn-secondary px-3 py-1.5 text-xs">{t('ft.reject')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-cocoa-500">
          <span className="h-4 w-1.5 rounded-full bg-mint-400" aria-hidden />{t('pm.title')} {pets.length}
        </h2>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-secondary text-sm">{t('pm.add')}</button>
        )}
      </div>

      {adding && (
        <form onSubmit={submit} className="card mb-1 space-y-3">
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
          <div>
            <label className="text-sm text-cocoa-400">{t('pm.statusLabel')}</label>
            <div className="mt-1 flex gap-2">
              {(['raising', 'fostering'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPetStatus(s)}
                  className={
                    'flex-1 rounded-2xl border px-3 py-2 text-sm transition ' +
                    (petStatus === s ? 'border-peach-300 bg-peach-50 font-bold text-peach-500' : 'border-cream-200 bg-white text-cocoa-400 hover:bg-cream-50')
                  }
                >
                  {s === 'raising' ? t('ft.raising') : t('ft.fostering')}
                </button>
              ))}
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
          {pets.map((pet) => {
            const isMine = pet.owner_id === currentUserId;
            return (
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
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-bold text-cocoa-500">{pet.name}</p>
                    {isMine ? (
                      <span className="shrink-0 rounded-full bg-mint-100 px-1.5 py-0.5 text-[10px] font-bold text-mint-500">{t('ft.raising')}</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-lilac-100 px-1.5 py-0.5 text-[10px] font-bold text-lilac-500">{t('ft.fostering')}</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-cocoa-300">
                    {pet.species_label && <span className="text-mint-400">#{pet.species_label} </span>}
                    {!isMine && pet.owner?.username && <span>· {t('ft.owner')}: {pet.owner.username}</span>}
                    {isMine && pet.birthday && <>· {formatDate(pet.birthday)}</>}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                    {isMine ? (
                      <>
                        <button onClick={() => sendFoster(pet)} disabled={busy} className="font-medium text-peach-500 hover:underline">🤝 {t('ft.sendFoster')}</button>
                        <Link href={`/memorial/new?pet=${pet.id}`} className="font-medium text-lilac-400 hover:underline">🌟 {t('mem.toStar')}</Link>
                        <button onClick={() => remove(pet)} className="text-cocoa-300 hover:text-red-400">{t('cm.delete')}</button>
                      </>
                    ) : (
                      <button onClick={() => returnFoster(pet)} disabled={busy} className="font-medium text-cocoa-400 hover:underline">↩ {t('ft.return')}</button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 임보 보낸 햄찌 */}
      {sentPets.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-cocoa-400">{t('ft.sentSection')} {sentPets.length}</p>
          <ul className="space-y-2">
            {sentPets.map((pet) => (
              <li key={pet.id} className="flex items-center justify-between gap-2 rounded-2xl border border-cream-200 bg-white px-3 py-2">
                <p className="min-w-0 text-sm text-cocoa-500">
                  <span className="font-bold">{pet.name}</span>
                  <span className="text-xs text-cocoa-300"> · {t('ft.caredBy')}: {pet.carer?.username ?? '—'}</span>
                </p>
                <button onClick={() => returnFoster(pet)} disabled={busy} className="btn-secondary shrink-0 px-3 py-1.5 text-xs">↩ {t('ft.takeBack')}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
