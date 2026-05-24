'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ImageUploader } from '@/components/ImageUploader';
import { useModal } from '@/components/Modal';
import type { Species } from '@hamster/shared';

export function SpeciesEditor({ initial }: { initial?: Species }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();

  const [f, setF] = useState({
    slug: initial?.slug ?? '',
    name_ko: initial?.name_ko ?? '',
    name_en: initial?.name_en ?? '',
    scientific_name: initial?.scientific_name ?? '',
    size_cm: initial?.size_cm ?? '',
    lifespan_years: initial?.lifespan_years ?? '',
    temperament: initial?.temperament ?? '',
    origin: initial?.origin ?? '',
    image_url: initial?.image_url ?? '',
    summary: initial?.summary ?? '',
    description: initial?.description ?? '',
    care_tips: initial?.care_tips ?? '',
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof f>(k: K, v: string) { setF((prev) => ({ ...prev, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.slug.trim() || !f.name_ko.trim() || !f.summary.trim() || !f.description.trim()) {
      await modal.alert({ title: '필수 항목을 채워주세요', message: 'slug, 한글 이름, 요약, 소개는 필수예요.', tone: 'error' });
      return;
    }
    setSaving(true);
    const payload = {
      slug: f.slug.trim(), name_ko: f.name_ko.trim(),
      name_en: f.name_en.trim() || null, scientific_name: f.scientific_name.trim() || null,
      size_cm: f.size_cm.trim() || null, lifespan_years: f.lifespan_years.trim() || null,
      temperament: f.temperament.trim() || null, origin: f.origin.trim() || null,
      image_url: f.image_url.trim() || null, summary: f.summary.trim(),
      description: f.description.trim(), care_tips: f.care_tips.trim() || null,
    };
    const res = initial
      ? await supabase.from('species').update(payload).eq('id', initial.id)
      : await supabase.from('species').insert(payload);
    setSaving(false);
    if (res.error) { await modal.alert({ title: '저장 실패', message: res.error.message, tone: 'error' }); return; }
    await modal.alert({ title: '저장됐어요', tone: 'success' });
    router.push('/admin/species');
    router.refresh();
  }

  async function remove() {
    if (!initial) return;
    const ok = await modal.confirm({ title: '이 종을 삭제할까요?', confirmText: '삭제하기' });
    if (!ok) return;
    const { error } = await supabase.from('species').delete().eq('id', initial.id);
    if (error) { await modal.alert({ title: '삭제 실패', message: error.message, tone: 'error' }); return; }
    router.push('/admin/species');
    router.refresh();
  }

  const Field = ({ label, k, ph }: { label: string; k: keyof typeof f; ph?: string }) => (
    <label className="block">
      <span className="text-sm text-cocoa-400">{label}</span>
      <input className="input mt-1" value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} />
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="slug (영문 URL, 필수)" k="slug" ph="golden-syrian" />
        <Field label="한글 이름 (필수)" k="name_ko" ph="골든시리안햄스터" />
        <Field label="영문 이름" k="name_en" />
        <Field label="학명" k="scientific_name" />
        <Field label="크기" k="size_cm" ph="15~20cm" />
        <Field label="수명" k="lifespan_years" ph="2~3년" />
        <Field label="성격" k="temperament" />
        <Field label="원산지" k="origin" />
      </div>

      <ImageUploader bucket="species-images" value={f.image_url || null}
        onChange={(url) => set('image_url', url ?? '')} label="대표 사진 (선택)" hint="없으면 일러스트가 자동 표시돼요" />

      <label className="block">
        <span className="text-sm text-cocoa-400">한 줄 요약 (필수)</span>
        <input className="input mt-1" value={f.summary} onChange={(e) => set('summary', e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm text-cocoa-400">소개 (필수)</span>
        <textarea className="input mt-1 min-h-[160px]" value={f.description} onChange={(e) => set('description', e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm text-cocoa-400">사육 팁</span>
        <textarea className="input mt-1 min-h-[120px]" value={f.care_tips} onChange={(e) => set('care_tips', e.target.value)} />
      </label>

      <div className="flex justify-between">
        {initial ? (
          <button type="button" onClick={remove} className="btn-secondary text-sm text-red-400">🗑 삭제</button>
        ) : <span />}
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => router.back()}>취소</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? '저장 중…' : '저장'}</button>
        </div>
      </div>
    </form>
  );
}
