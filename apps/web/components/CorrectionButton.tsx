'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';

type Props = {
  targetType: 'species' | 'guide' | 'announcement';
  targetId?: string | null;
  targetSlug?: string | null;
  /** 제보 대상 이름 (예: 골든시리안햄스터) */
  targetName: string;
};

export function CorrectionButton({ targetType, targetId, targetSlug, targetName }: Props) {
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const [open, setOpen] = useState(false);
  const [field, setField] = useState('');
  const [suggested, setSuggested] = useState('');
  const [reason, setReason] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!suggested.trim()) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('content_corrections').insert({
      reporter_id: user?.id ?? null,
      reporter_name: name.trim() || null,
      target_type: targetType,
      target_id: targetId ?? null,
      target_slug: targetSlug ?? null,
      field: field.trim() || null,
      suggested: suggested.trim(),
      reason: reason.trim() || null,
    });
    setSending(false);
    if (error) {
      await modal.alert({ title: '제보 실패', message: error.message, tone: 'error' });
      return;
    }
    setOpen(false);
    setField(''); setSuggested(''); setReason(''); setName('');
    await modal.alert({
      title: '제보 고마워요! 🐹',
      message: '운영진이 확인하고 반영할게요. 더 정확한 햄랜드를 만드는 데 큰 도움이 됐어요.',
      tone: 'success',
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-sm font-medium text-cocoa-500 shadow-softer hover:bg-cream-50"
      >
        🛠 정보가 틀렸나요? 제보하기
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-cocoa-500/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <form
            onSubmit={submit}
            className="relative w-full max-w-md space-y-3 rounded-cute border border-cream-200 bg-white p-5 shadow-soft"
          >
            <h3 className="font-display text-lg font-bold text-cocoa-500">🛠 「{targetName}」 정보 제보</h3>
            <p className="text-sm text-cocoa-300">
              틀린 내용이나 보완할 점을 알려주세요. 운영진이 검토 후 반영합니다.
            </p>

            <label className="block">
              <span className="text-sm text-cocoa-400">어느 항목인가요? (선택)</span>
              <input
                className="input mt-1"
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="예: 수명, 크기, 성격, 사육 팁"
              />
            </label>

            <label className="block">
              <span className="text-sm text-cocoa-400">올바른 내용 / 제안 <span className="text-peach-500">*</span></span>
              <textarea
                className="input mt-1 min-h-[100px]"
                value={suggested}
                onChange={(e) => setSuggested(e.target.value)}
                placeholder="이렇게 바뀌면 좋겠어요"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm text-cocoa-400">근거·출처 (선택)</span>
              <input
                className="input mt-1"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 나무위키, 수의사 상담, 직접 사육 경험"
              />
            </label>

            <label className="block">
              <span className="text-sm text-cocoa-400">닉네임 (선택)</span>
              <input
                className="input mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="제보자 표시용"
              />
            </label>

            <div className="flex gap-2 pt-1">
              <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)}>취소</button>
              <button type="submit" className="btn-primary flex-1" disabled={sending || !suggested.trim()}>
                {sending ? '보내는 중…' : '제보 보내기'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
