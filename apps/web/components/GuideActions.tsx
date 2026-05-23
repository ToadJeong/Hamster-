'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';

type Props = {
  guideId: string;
  isAnonymous: boolean;
  canEdit: boolean;
};

export function GuideActions({ guideId, isAnonymous, canEdit }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();

  async function handleDelete() {
    if (isAnonymous) {
      const pw = await modal.prompt({
        title: '익명 가이드 삭제',
        message: '작성하실 때 입력한 비밀번호를 입력해 주세요.',
        inputType: 'password',
        confirmText: '삭제하기',
      });
      if (!pw) return;
      const { data, error } = await supabase.rpc('delete_anonymous_guide', {
        p_guide_id: guideId,
        p_password: pw,
      });
      if (error || !data) {
        await modal.alert({ title: '비밀번호가 일치하지 않아요', tone: 'error' });
        return;
      }
      await modal.alert({ title: '가이드가 삭제됐어요', tone: 'success' });
      router.push('/guides');
      router.refresh();
      return;
    }
    const ok = await modal.confirm({
      title: '이 가이드를 삭제할까요?',
      message: '댓글과 좋아요도 함께 사라져요.',
      confirmText: '삭제하기',
    });
    if (!ok) return;
    const { error } = await supabase.from('guides').delete().eq('id', guideId);
    if (error) {
      await modal.alert({ title: '삭제 실패', message: error.message, tone: 'error' });
      return;
    }
    router.push('/guides');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <Link
          href={`/guides/${guideId}/edit`}
          className="inline-flex items-center gap-1 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-sm font-medium text-cocoa-500 shadow-softer hover:bg-cream-50"
        >
          ✏️ 수정
        </Link>
      )}
      <button
        onClick={handleDelete}
        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-500 shadow-softer hover:bg-red-50"
      >
        🗑 삭제
      </button>
    </div>
  );
}
