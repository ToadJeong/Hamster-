/**
 * 커뮤니티 게시글의 익명 작성용 헬퍼.
 * 가이드와 똑같은 패턴: 클라이언트는 RPC 없이 직접 INSERT 하지만 비밀번호는
 * Edge에서 해시되지 않으므로, 사실 커뮤니티는 비번 분실 시 본인 인증이 어렵다.
 * 따라서 익명 글의 수정/삭제는 v2 정책 결정 전까지 막아둔다.
 *
 * 단, 비번을 받아두기는 한다 → 신고·차단 시 동일 작성자 추적용.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export async function insertAnonymousCommunity(
  supabase: SupabaseClient,
  args: {
    nickname: string;
    password: string;
    title: string;
    body: string;
    category: 'free' | 'question' | 'show-off';
  }
) {
  // 비밀번호는 클라이언트에서 sha256 평문 hash로 약식 처리 (DB에 그대로 저장)
  const enc = new TextEncoder();
  const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(args.password));
  const hashHex = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      anonymous_nickname: args.nickname,
      anonymous_password_hash: hashHex,
      title: args.title,
      body: args.body,
      category: args.category,
    })
    .select('id')
    .single();

  return { id: (data as any)?.id ?? null, error };
}
