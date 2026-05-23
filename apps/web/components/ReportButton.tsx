'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';

type Props = {
  targetType: 'community' | 'guide' | 'rescue' | 'community_comment' | 'guide_comment';
  targetId: string;
};

export function ReportButton({ targetType, targetId }: Props) {
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const [busy, setBusy] = useState(false);

  async function report() {
    const reason = await modal.prompt({
      title: '이 글을 신고할까요?',
      message: '신고 사유를 적어주세요. 운영자가 검토합니다.',
      placeholder: '예: 광고/도배, 부적절한 내용',
      confirmText: '신고하기',
    });
    if (reason === null) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('post_reports').insert({
      reporter_id: user?.id ?? null,
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim() || null,
    });
    setBusy(false);
    if (error) await modal.alert({ title: '신고 실패', message: error.message, tone: 'error' });
    else await modal.alert({ title: '신고가 접수됐어요', message: '운영자가 빠르게 확인할게요. 고마워요!', tone: 'success' });
  }

  return (
    <button
      onClick={report}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs text-cocoa-400 shadow-softer hover:text-red-400"
      title="신고하기"
    >
      ⚠ 신고
    </button>
  );
}
