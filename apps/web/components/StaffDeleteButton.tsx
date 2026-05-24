'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';

type Props = {
  type: 'community' | 'guide' | 'rescue' | 'community_comment' | 'guide_comment';
  id: string;
  redirectTo?: string;   // 글 삭제 후 이동 (댓글이면 생략 → refresh)
  onDeleted?: () => void;
};

const LABEL: Record<string, string> = {
  community: '글', guide: '가이드', rescue: '구조대 글',
  community_comment: '댓글', guide_comment: '댓글',
};

export function StaffDeleteButton({ type, id, redirectTo, onDeleted }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();

  async function handle() {
    const reason = await modal.prompt({
      title: `운영자 권한으로 ${LABEL[type]} 삭제`,
      message: '작성자에게 전달될 삭제 사유를 적어주세요. (회원 글이면 알림이 갑니다)',
      placeholder: '예: 광고/도배, 운영정책 위반',
      confirmText: '삭제 실행',
    });
    if (reason === null) return;
    const { data, error } = await supabase.rpc('admin_delete_post', {
      p_type: type, p_id: id, p_reason: reason.trim() || null,
    });
    if (error || !data) {
      await modal.alert({ title: '삭제 실패', message: error?.message ?? '권한이 없거나 이미 삭제됐어요.', tone: 'error' });
      return;
    }
    await modal.alert({ title: '삭제 완료', tone: 'success' });
    onDeleted?.();
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-1 rounded-full border border-lilac-200 bg-white px-3 py-1.5 text-sm font-medium text-lilac-400 shadow-softer hover:bg-lilac-50"
      title="운영자 삭제 (비밀번호 무시)"
    >
      🛡 운영자 삭제
    </button>
  );
}
