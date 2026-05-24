'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';

type Props = {
  targetType: 'community' | 'guide' | 'rescue' | 'community_comment' | 'guide_comment';
  targetId: string;
};

export function ReportButton({ targetType, targetId }: Props) {
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function report() {
    const reason = await modal.prompt({
      title: t('act.reportTitle'),
      message: t('act.reportMsg'),
      placeholder: t('act.reportPh'),
      confirmText: t('act.reportConfirm'),
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
    if (error) await modal.alert({ title: t('act.reportFail'), message: error.message, tone: 'error' });
    else await modal.alert({ title: t('act.reportDoneTitle'), message: t('act.reportDoneMsg'), tone: 'success' });
  }

  return (
    <button
      onClick={report}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs text-cocoa-400 shadow-softer hover:text-red-400"
      title={t('act.reportConfirm')}
    >
      {t('act.report')}
    </button>
  );
}
