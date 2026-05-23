'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function AnnouncementDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleDelete() {
    if (!confirm('공지를 삭제할까요?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="text-red-400 hover:text-red-500">
      삭제
    </button>
  );
}
