'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';

export function MemorialDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();

  async function del() {
    const ok = await modal.confirm({ title: t('mem.deleteConfirm'), confirmText: t('cm.delete') });
    if (!ok) return;
    const { error } = await supabase.from('memorials').delete().eq('id', id);
    if (error) { await modal.alert({ title: t('form.deleteFailed'), message: error.message, tone: 'error' }); return; }
    router.push('/memorial');
    router.refresh();
  }

  return (
    <button onClick={del} className="text-xs text-cocoa-300 hover:text-red-400">{t('cm.delete')}</button>
  );
}
