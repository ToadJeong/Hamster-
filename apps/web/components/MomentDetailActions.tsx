'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';

export function MomentDetailActions({ momentId, canStaff }: { momentId: string; canStaff: boolean }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();

  async function handleDelete() {
    // RLS "moments delete by author or staff" 가 작성자/운영자 모두 허용
    const ok = await modal.confirm({
      title: canStaff ? '운영자 권한으로 이 모먼트를 삭제할까요?' : '이 모먼트를 삭제할까요?',
      message: '되돌릴 수 없어요.',
      confirmText: '삭제',
    });
    if (!ok) return;
    const { error } = await supabase.from('moments').delete().eq('id', momentId);
    if (error) { await modal.alert({ title: '삭제 실패', message: error.message, tone: 'error' }); return; }
    router.push('/moments');
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="rounded-full px-2.5 py-1 text-xs font-medium text-cocoa-300 hover:bg-red-50 hover:text-red-400">
      삭제
    </button>
  );
}
