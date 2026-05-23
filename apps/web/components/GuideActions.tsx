'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  guideId: string;
  isAnonymous: boolean;
  canEdit: boolean;
};

export function GuideActions({ guideId, isAnonymous, canEdit }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleDelete() {
    if (isAnonymous) {
      const pw = prompt('익명 글 작성 시 입력했던 비밀번호를 입력해 주세요');
      if (!pw) return;
      const { data, error } = await supabase.rpc('delete_anonymous_guide', {
        p_guide_id: guideId,
        p_password: pw,
      });
      if (error || !data) { alert('비밀번호가 일치하지 않아요.'); return; }
      router.push('/guides');
      router.refresh();
      return;
    }
    if (!confirm('가이드를 삭제할까요? 댓글과 좋아요도 함께 삭제됩니다.')) return;
    const { error } = await supabase.from('guides').delete().eq('id', guideId);
    if (!error) {
      router.push('/guides');
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <Link href={`/guides/${guideId}/edit`} className="btn-ghost text-sm">수정</Link>
      )}
      <button onClick={handleDelete} className="btn-ghost text-sm text-red-400 hover:text-red-500">
        삭제
      </button>
    </div>
  );
}
