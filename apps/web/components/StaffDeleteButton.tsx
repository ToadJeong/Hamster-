'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';

type Props = {
  type: 'community' | 'guide' | 'rescue' | 'community_comment' | 'guide_comment';
  id: string;
  redirectTo?: string;   // 글 삭제 후 이동 (댓글이면 생략 → refresh)
  onDeleted?: () => void;
};

const LABEL_KEY: Record<string, string> = {
  community: 'act.labelPost', guide: 'act.labelGuide', rescue: 'act.labelRescue',
  community_comment: 'act.labelComment', guide_comment: 'act.labelComment',
};

export function StaffDeleteButton({ type, id, redirectTo, onDeleted }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();

  async function handle() {
    const reason = await modal.prompt({
      title: t('act.staffDelTitle').replace('{label}', t(LABEL_KEY[type])),
      message: t('act.staffDelMsg'),
      placeholder: t('act.staffDelPh'),
      confirmText: t('act.staffDelConfirm'),
    });
    if (reason === null) return;
    const { data, error } = await supabase.rpc('admin_delete_post', {
      p_type: type, p_id: id, p_reason: reason.trim() || null,
    });
    if (error || !data) {
      await modal.alert({ title: t('form.deleteFailed'), message: error?.message ?? t('act.staffDelNoPerm'), tone: 'error' });
      return;
    }
    await modal.alert({ title: t('act.deleted'), tone: 'success' });
    onDeleted?.();
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-1 rounded-full border border-lilac-200 bg-white px-3 py-1.5 text-sm font-medium text-lilac-400 shadow-softer hover:bg-lilac-50"
      title={t('act.staffDelHint')}
    >
      {t('act.staffDelete')}
    </button>
  );
}
