'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { RESCUE_STATUS_LABEL, type RescueStatus } from '@hamster/shared';

type Props = {
  postId: string;
  currentStatus: RescueStatus;
};

export function RescueAuthorActions({ postId, currentStatus }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const [status, setStatus] = useState<RescueStatus>(currentStatus);
  const [busy, setBusy] = useState(false);

  async function changeStatus(next: RescueStatus) {
    setBusy(true);
    const prev = status;
    setStatus(next);
    const { error } = await supabase.from('rescue_posts').update({ status: next }).eq('id', postId);
    setBusy(false);
    if (error) {
      setStatus(prev);
      await modal.alert({ title: '상태 변경 실패', message: error.message, tone: 'error' });
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    const ok = await modal.confirm({
      title: '이 글을 삭제할까요?',
      message: '한 번 삭제하면 되돌릴 수 없어요.',
      confirmText: '삭제하기',
    });
    if (!ok) return;
    const { error } = await supabase.from('rescue_posts').delete().eq('id', postId);
    if (error) {
      await modal.alert({ title: '삭제 실패', message: error.message, tone: 'error' });
      return;
    }
    router.push('/rescue');
    router.refresh();
  }

  const STATUSES: RescueStatus[] = ['open', 'in_progress', 'completed', 'closed'];

  return (
    <div className="card space-y-3">
      <div>
        <p className="mb-2 text-sm font-semibold text-cocoa-500">진행 상태</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              disabled={busy || s === status}
              className={
                'rounded-full px-3 py-1 text-xs transition ' +
                (s === status
                  ? 'bg-peach-400 text-white'
                  : 'border border-cream-200 text-cocoa-400 hover:bg-cream-50')
              }
            >
              {RESCUE_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-cream-100 pt-3">
        <Link href={`/rescue/${postId}/edit`} className="btn-ghost text-sm">수정</Link>
        <button onClick={handleDelete} className="btn-ghost text-sm text-red-400 hover:text-red-500">
          삭제
        </button>
      </div>
    </div>
  );
}
