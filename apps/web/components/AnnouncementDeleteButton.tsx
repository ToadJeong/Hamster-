'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';

export function AnnouncementDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();

  async function handleDelete() {
    const ok = await modal.confirm({ title: '공지를 삭제할까요?', confirmText: '삭제하기' });
    if (!ok) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) { await modal.alert({ title: '삭제 실패', message: error.message, tone: 'error' }); return; }
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="text-red-400 hover:text-red-500">
      삭제
    </button>
  );
}
