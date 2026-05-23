'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  postId: string;
  canEdit: boolean;
  isAnonymous: boolean;
};

export function CommunityAuthorActions({ postId, canEdit, isAnonymous }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleDelete() {
    if (isAnonymous) {
      const pw = prompt('익명 글 작성 시 입력한 비밀번호를 입력해 주세요');
      if (!pw) return;
      const { data, error } = await supabase.rpc('delete_anonymous_community_post', {
        p_post_id: postId,
        p_password: pw,
      });
      if (error || !data) {
        alert('비밀번호가 일치하지 않아요.');
        return;
      }
      router.push('/community');
      router.refresh();
      return;
    }
    if (!confirm('이 글을 삭제할까요?')) return;
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (error) { alert('삭제 실패: ' + error.message); return; }
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
