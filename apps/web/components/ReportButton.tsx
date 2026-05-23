'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  targetType: 'community' | 'guide' | 'rescue' | 'community_comment' | 'guide_comment';
  targetId: string;
};

export function ReportButton({ targetType, targetId }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [busy, setBusy] = useState(false);

  async function report() {
    const reason = prompt('신고 사유를 한 줄로 적어주세요 (선택)');
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
    if (error) alert('신고 실패: ' + error.message);
    else alert('신고가 접수되었어요. 운영자가 검토합니다.');
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
