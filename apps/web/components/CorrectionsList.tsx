'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { formatDate } from '@/lib/format';

type Correction = {
  id: string;
  reporter_name: string | null;
  target_type: string;       // 'species' | 'guide' | 'announcement'
  target_id: string | null;
  target_slug: string | null;
  field: string | null;
  suggested: string;
  reason: string | null;
  status: 'open' | 'accepted' | 'rejected';
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = { open: '대기', accepted: '반영', rejected: '반려' };

// 대상별 수정 가능한 컬럼
const FIELDS: Record<string, { key: string; label: string }[]> = {
  species: [
    { key: 'summary', label: '한 줄 요약' },
    { key: 'description', label: '소개' },
    { key: 'care_tips', label: '사육 팁' },
    { key: 'size_cm', label: '크기' },
    { key: 'lifespan_years', label: '수명' },
    { key: 'temperament', label: '성격' },
    { key: 'origin', label: '원산지' },
    { key: 'name_ko', label: '한글 이름' },
    { key: 'name_en', label: '영문 이름' },
    { key: 'scientific_name', label: '학명' },
  ],
  guide: [
    { key: 'title', label: '제목' },
    { key: 'body', label: '본문' },
  ],
};

export function CorrectionsList({ initial }: { initial: Correction[] }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [applying, setApplying] = useState<Correction | null>(null);

  async function setStatus(id: string, status: Correction['status']) {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    await supabase.from('content_corrections').update({ status }).eq('id', id);
    router.refresh();
  }

  async function remove(id: string) {
    await supabase.from('content_corrections').delete().eq('id', id);
    setItems((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  if (items.length === 0) {
    return <div className="card text-center text-cocoa-300">처리할 제보가 없어요.</div>;
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map((c) => {
          const canApply = (c.target_type === 'species' || c.target_type === 'guide') && c.target_id;
          return (
            <li key={c.id} className="card space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-cocoa-300">
                <span className="badge bg-cream-100 text-cocoa-500">{c.target_type}{c.target_slug ? ` · ${c.target_slug}` : ''}</span>
                {c.field && <span className="badge">제보자 지정: {c.field}</span>}
                <span className={'badge ' + (c.status === 'accepted' ? 'bg-mint-100 text-mint-400' : c.status === 'rejected' ? 'bg-cocoa-100 text-cocoa-400' : 'bg-peach-100 text-peach-500')}>
                  {STATUS_LABEL[c.status]}
                </span>
                <span>{formatDate(c.created_at)}</span>
                {c.reporter_name && <span>· {c.reporter_name}</span>}
              </div>
              <p className="whitespace-pre-line rounded-2xl bg-cream-50 px-3 py-2 text-sm text-cocoa-500">{c.suggested}</p>
              {c.reason && <p className="text-xs text-cocoa-400">근거: {c.reason}</p>}
              <div className="flex flex-wrap justify-end gap-2 text-xs">
                {canApply && c.status !== 'accepted' && (
                  <button onClick={() => setApplying(c)} className="rounded-full bg-peach-400 px-3 py-1 font-semibold text-white">
                    ✅ 수용 & 반영
                  </button>
                )}
                <button onClick={() => setStatus(c.id, 'rejected')} className="rounded-full bg-cocoa-100 px-3 py-1 text-cocoa-400">반려</button>
                <button onClick={() => remove(c.id)} className="rounded-full border border-red-200 px-3 py-1 text-red-400">삭제</button>
              </div>
            </li>
          );
        })}
      </ul>

      {applying && (
        <ApplyPanel
          correction={applying}
          onClose={() => setApplying(null)}
          onApplied={async () => {
            await setStatus(applying.id, 'accepted');
            setApplying(null);
          }}
        />
      )}
    </>
  );
}

function ApplyPanel({
  correction, onClose, onApplied,
}: { correction: Correction; onClose: () => void; onApplied: () => void }) {
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const fields = FIELDS[correction.target_type] ?? [];
  const [field, setField] = useState(fields[0]?.key ?? '');
  const [value, setValue] = useState(correction.suggested);
  const [current, setCurrent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 선택한 필드의 현재 값 불러오기 (반영 전 비교용)
  async function loadCurrent(f: string) {
    const table = correction.target_type === 'species' ? 'species' : 'guides';
    const { data } = await supabase.from(table).select(f).eq('id', correction.target_id!).maybeSingle();
    setCurrent((data as any)?.[f] ?? null);
  }

  useEffect(() => { loadCurrent(field); /* eslint-disable-next-line */ }, []);

  async function apply() {
    setSaving(true);
    const table = correction.target_type === 'species' ? 'species' : 'guides';
    const { error } = await supabase.from(table).update({ [field]: value }).eq('id', correction.target_id!);
    setSaving(false);
    if (error) { await modal.alert({ title: '반영 실패', message: error.message, tone: 'error' }); return; }
    await modal.alert({ title: '반영 완료', message: '제보 내용이 도감/가이드에 적용됐어요.', tone: 'success' });
    onApplied();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-cocoa-500/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg space-y-3 rounded-cute border border-cream-200 bg-white p-5 shadow-soft">
        <h3 className="font-display text-lg font-bold text-cocoa-500">✅ 제보 반영하기 (적용 전 확인)</h3>

        <label className="block">
          <span className="text-sm text-cocoa-400">어떤 항목에 반영할까요?</span>
          <select
            className="input mt-1"
            value={field}
            onChange={(e) => { setField(e.target.value); loadCurrent(e.target.value); }}
          >
            {fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </label>

        {current != null && (
          <div className="rounded-2xl bg-cream-50 p-2 text-xs text-cocoa-400">
            <p className="mb-1 font-semibold">현재 값</p>
            <p className="line-clamp-3 whitespace-pre-line">{current || '(비어 있음)'}</p>
          </div>
        )}

        <label className="block">
          <span className="text-sm text-cocoa-400">반영할 내용 (검토 후 수정 가능)</span>
          <textarea className="input mt-1 min-h-[140px]" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>

        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={apply} disabled={saving || !field}>
            {saving ? '반영 중…' : '이 내용으로 반영'}
          </button>
        </div>
      </div>
    </div>
  );
}
