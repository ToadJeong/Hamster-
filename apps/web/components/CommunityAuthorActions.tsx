'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';

type Props = {
  postId: string;
  canEdit: boolean;
  isAnonymous: boolean;
};

export function CommunityAuthorActions({ postId, canEdit, isAnonymous }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();

  async function handleDelete() {
    if (isAnonymous) {
      const pw = await modal.prompt({
        title: '익명 글 삭제',
        message: '작성하실 때 입력한 비밀번호를 입력해 주세요.',
        inputType: 'password',
        placeholder: '4자 이상',
        confirmText: '삭제하기',
      });
      if (!pw) return;
      const { data, error } = await supabase.rpc('delete_anonymous_community_post', {
        p_post_id: postId,
        p_password: pw,
      });
      if (error || !data) {
        await modal.alert({ title: '비밀번호가 일치하지 않아요', tone: 'error' });
        return;
      }
      await modal.alert({ title: '글이 삭제됐어요', tone: 'success' });
      router.push('/community');
      router.refresh();
      return;
    }
    const ok = await modal.confirm({
      title: '이 글을 삭제할까요?',
      message: '한 번 삭제하면 되돌릴 수 없어요.',
      confirmText: '삭제하기',
    });
    if (!ok) return;
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (error) {
      await modal.alert({ title: '삭제 실패', message: error.message, tone: 'error' });
      return;
    }
    router.push('/community');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <Link
          href={`/community/${postId}/edit`}
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
