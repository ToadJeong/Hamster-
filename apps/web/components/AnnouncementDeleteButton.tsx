'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';

export function AnnouncementDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();

  async function handleDelete() {
    const ok = await modal.confirm({ title: t('act.delAnnTitle'), confirmText: t('cm.delConfirm') });
    if (!ok) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) { await modal.alert({ title: t('form.deleteFailed'), message: error.message, tone: 'error' }); return; }
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="text-red-400 hover:text-red-500">
      {t('cm.delete')}
    </button>
  );
}
