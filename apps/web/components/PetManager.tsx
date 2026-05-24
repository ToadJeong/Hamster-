'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ImageUploader } from '@/components/ImageUploader';
import { useModal } from '@/components/Modal';
import { HamsterIllustration, visualForSpecies } from '@/components/HamsterIllustration';
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
    if (!name.trim()) { await modal.alert({ title: '이름을 입력해주세요', tone: 'info' }); return; }
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
    if (error) { await modal.alert({ title: '등록 실패', message: error.message, tone: 'error' }); return; }
    setPets((prev) => [...prev, data as Pet]);
    reset();
    router.refresh();
  }

  async function remove(pet: Pet) {
    const ok = await modal.confirm({ title: `${pet.name} 햄찌를 삭제할까요?`, message: '연결된 모먼트의 태그도 사라져요.', confirmText: '삭제' });
    if (!ok) return;
    const { error } = await supabase.from('pets').delete().eq('id', pet.id);
    if (error) { await modal.alert({ title: '삭제 실패', message: error.message, tone: 'error' }); return; }
    setPets((prev) => prev.filter((p) => p.id !== pet.id));
    router.refresh();
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-cocoa-500">
          <span className="h-4 w-1.5 rounded-full bg-mint-400" aria-hidden />내 햄찌 {pets.length}
        </h2>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-secondary text-sm">+ 햄찌 등록</button>
        )}
      </div>

      {adding && (
        <form onSubmit={submit} className="card mb-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-cocoa-400">이름 *</label>
              <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="햄찌 이름" maxLength={20} />
            </div>
            <div>
              <label className="text-sm text-cocoa-400">종류</label>
              <select className="input mt-1" value={speciesId} onChange={(e) => setSpeciesId(e.target.value)}>
                <option value="">선택 안 함</option>
                {species.map((s) => <option key={s.id} value={s.id}>{s.name_ko}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-cocoa-400">생일</label>
              <input type="date" className="input mt-1" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-cocoa-400">한 줄 소개</label>
              <input className="input mt-1" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="예: 해바라기씨를 제일 좋아해요" maxLength={60} />
            </div>
          </div>
          <ImageUploader bucket="community-images" value={photoUrl} onChange={setPhotoUrl} label="사진 (선택)" hint="JPG/PNG/WebP/GIF · 최대 5MB" />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={reset}>취소</button>
            <button type="submit" className="btn-primary text-sm" disabled={saving || !name.trim()}>
              {saving ? '등록 중…' : '등록'}
            </button>
          </div>
        </form>
      )}

      {pets.length === 0 ? (
        !adding && <p className="card text-center text-sm text-cocoa-300">아직 등록한 햄찌가 없어요. 우리집 햄찌를 소개해 주세요!</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {pets.map((pet) => (
            <li key={pet.id} className="card flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-cream-200">
                {pet.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pet.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <HamsterIllustration visual={visualForSpecies(pet.species_label ?? 'golden')} className="h-full w-full" bg={false} />
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
              <button onClick={() => remove(pet)} className="shrink-0 text-[11px] text-cocoa-300 hover:text-red-400">삭제</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
