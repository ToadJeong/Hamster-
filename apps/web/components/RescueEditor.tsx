'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ImageUploader } from '@/components/ImageUploader';
import { RESCUE_KIND_LABEL, type RescueKind, type Species } from '@hamster/shared';

type Props = {
  species: Pick<Species, 'id' | 'slug' | 'name_ko'>[];
  initial?: {
    id: string;
    kind: RescueKind;
    title: string;
    body: string;
    region: string | null;
    cover_url: string | null;
    contact_hint: string | null;
    age_months: number | null;
    species_id: string | null;
  };
};

export function RescueEditor({ species, initial }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [kind, setKind] = useState<RescueKind>(initial?.kind ?? 'available');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [region, setRegion] = useState(initial?.region ?? '');
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? '');
  const [contactHint, setContactHint] = useState(initial?.contact_hint ?? '');
  const [ageMonths, setAgeMonths] = useState<string>(initial?.age_months?.toString() ?? '');
  const [speciesId, setSpeciesId] = useState<string>(initial?.species_id ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요해요.');

      const payload = {
        author_id: user.id,
        kind,
        title: title.trim(),
        body: body.trim(),
        region: region.trim() || null,
        cover_url: coverUrl.trim() || null,
        contact_hint: contactHint.trim() || null,
        age_months: ageMonths ? parseInt(ageMonths, 10) : null,
        species_id: speciesId || null,
      };

      if (initial) {
        const { error } = await supabase.from('rescue_posts').update(payload).eq('id', initial.id);
        if (error) throw error;
        router.push(`/rescue/${initial.id}`);
      } else {
        const { data, error } = await supabase.from('rescue_posts').insert(payload).select('id').single();
        if (error) throw error;
        router.push(`/rescue/${(data as any).id}`);
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* kind 선택 */}
      <div>
        <p className="mb-2 text-sm text-cocoa-500">어떤 종류의 글인가요?</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {(Object.keys(RESCUE_KIND_LABEL) as RescueKind[]).map((k) => {
            const meta = RESCUE_KIND_LABEL[k];
            const active = kind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={
                  'rounded-2xl border px-3 py-2 text-sm transition ' +
                  (active
                    ? 'border-peach-300 bg-peach-50 text-peach-500'
                    : 'border-cream-200 bg-white text-cocoa-400 hover:bg-cream-50')
                }
              >
                <span className="mr-1">{meta.emoji}</span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <input
        className="input text-lg font-semibold"
        placeholder="제목 (간결하게)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={120}
      />

      <div className="grid gap-2 md:grid-cols-3">
        <select className="input" value={speciesId} onChange={(e) => setSpeciesId(e.target.value)}>
          <option value="">종 선택 (선택)</option>
          {species.map((s) => <option key={s.id} value={s.id}>{s.name_ko}</option>)}
        </select>
        <input className="input" placeholder="지역 (예: 서울 강남)" value={region} onChange={(e) => setRegion(e.target.value)} maxLength={40} />
        <input className="input" type="number" min={0} max={48} placeholder="추정 나이(개월)" value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} />
      </div>

      <ImageUploader
        bucket="rescue-images"
        value={coverUrl || null}
        onChange={(url) => setCoverUrl(url ?? '')}
        label="햄찌 사진 (선택)"
        hint="JPG/PNG/WebP/GIF · 최대 5MB"
      />

      <input
        className="input"
        placeholder="연락 방법 힌트 (예: 오픈채팅 https://… / 인스타 @abc)"
        value={contactHint}
        onChange={(e) => setContactHint(e.target.value)}
        maxLength={200}
      />

      <textarea
        className="input min-h-[200px] text-[15px] leading-7"
        placeholder={`상황과 햄찌의 상태를 적어주세요.\n\n- 발견 일시 / 발견 장소\n- 건강 상태 / 특이사항\n- 입양 조건 (선호하는 보호자, 케이지 크기 등)`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />

      {error && <div className="card text-red-500">{error}</div>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving || !title.trim() || !body.trim()}>
          {saving ? '저장 중…' : initial ? '수정' : '게시'}
        </button>
      </div>
    </form>
  );
}
