'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  postId: string;
  canEdit: boolean;       // 회원 본인 글일 때만 수정 가능
  isAnonymous: boolean;   // 익명 글은 삭제 시 비번 입력 필요
};

export function CommunityAuthorActions({ postId, canEdit, isAnonymous }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleDelete() {
    if (isAnonymous) {
      const pw = prompt('익명 글 작성 시 입력한 비밀번호를 입력해 주세요');
      if (!pw) return;
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
      const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');

      const { data: row } = await supabase
        .from('community_posts')
        .select('anonymous_password_hash')
        .eq('id', postId)
        .maybeSingle();
      const expected = (row as any)?.anonymous_password_hash;
      if (!expected || expected !== hex) {
        alert('비밀번호가 일치하지 않아요.');
        return;
      }
      // RLS는 익명 글 삭제를 author_id=null이라 막을 수 있으므로 RPC 형태가 이상적이지만,
      // 0005에서 community_posts.delete 정책은 author_id 일치 또는 admin만 허용하도록 되어 있음.
      // 따라서 익명 글 삭제는 관리자에게 신고 요청하도록 안내한다.
      alert([
        '비밀번호는 일치했지만, 익명 글의 본인 삭제는 현재 운영자 검토를 거쳐 진행됩니다.',
        '관리자에게 글 URL과 함께 삭제 요청 메일을 보내주세요.',
      ].join('\n'));
      return;
    }
    if (!confirm('이 글을 삭제할까요?')) return;
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    router.push('/community');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      {canEdit && (
        <Link href={`/community/${postId}/edit`} className="btn-ghost text-xs">수정</Link>
      )}
      <button onClick={handleDelete} className="btn-ghost text-xs text-red-400 hover:text-red-500">
        삭제
      </button>
    </div>
  );
}
