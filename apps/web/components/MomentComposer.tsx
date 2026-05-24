'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ImageUploader } from '@/components/ImageUploader';
import { useModal } from '@/components/Modal';
import type { Pet } from '@hamster/shared';

export function MomentComposer({ pets }: { pets: Pick<Pet, 'id' | 'name'>[] }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [petId, setPetId] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl) { await modal.alert({ title: '사진/영상을 올려주세요', message: '모먼트는 사진이나 동영상이 꼭 필요해요 🐹', tone: 'info' }); return; }
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
    if (error) { await modal.alert({ title: '등록 실패', message: error.message, tone: 'error' }); return; }
    router.push(`/moments/${(data as any).id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ImageUploader bucket="community-images" value={imageUrl} onChange={setImageUrl} allowVideo
        label="사진/동영상 (필수)" hint="우리집 햄찌의 한 컷! 사진 5MB · 동영상 30MB 이하" />

      <textarea
        className="input min-h-[120px] text-[15px] leading-7"
        placeholder="오늘 햄찌의 순간을 적어주세요. (예: 해바라기씨 먹고 볼이 빵빵해진 우리 햄찌 🌻)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={500}
      />

      <div className="flex items-center gap-2">
        <label className="text-sm text-cocoa-400">햄찌 태그</label>
        {pets.length > 0 ? (
          <select className="input flex-1" value={petId} onChange={(e) => setPetId(e.target.value)}>
            <option value="">선택 안 함</option>
            {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        ) : (
          <span className="text-xs text-cocoa-300">
            <Link href="/profile" className="text-peach-500 underline">프로필</Link>에서 내 햄찌를 먼저 등록할 수 있어요 (선택)
          </span>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving || !imageUrl}>
          {saving ? '올리는 중…' : '모먼트 올리기'}
        </button>
      </div>
    </form>
  );
}
