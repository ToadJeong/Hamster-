'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';

export function MomentDetailActions({ momentId, canStaff }: { momentId: string; canStaff: boolean }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();

  async function handleDelete() {
    // RLS "moments delete by author or staff" 가 작성자/운영자 모두 허용
    const ok = await modal.confirm({
      title: canStaff ? t('act.delMomentStaff') : t('act.delMomentTitle'),
      message: t('act.cantUndo'),
      confirmText: t('cm.delete'),
    });
    if (!ok) return;
    const { error } = await supabase.from('moments').delete().eq('id', momentId);
    if (error) { await modal.alert({ title: t('form.deleteFailed'), message: error.message, tone: 'error' }); return; }
    router.push('/moments');
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="rounded-full px-2.5 py-1 text-xs font-medium text-cocoa-300 hover:bg-red-50 hover:text-red-400">
      {t('cm.delete')}
    </button>
  );
}
