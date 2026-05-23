/**
 * 익명 게시물의 본인 확인용 비밀번호 처리.
 *
 * 서버(Postgres)에는 pgcrypto의 bcrypt 해시로 저장하지만,
 * 클라이언트에서는 평문을 그대로 INSERT 컬럼으로 보낼 수 없다
 * (DB에서 자동 해시되지 않으므로).
 *
 * 그래서 익명 게시 INSERT는 RPC 함수로 처리한다.
 * 이 모듈에는 RPC 호출 헬퍼를 둔다.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

/** 익명 게시물의 비밀번호는 4자리 이상으로 강제 */
export const MIN_ANON_PASSWORD_LENGTH = 4;
export const MAX_ANON_PASSWORD_LENGTH = 32;

export function validateAnonPassword(pw: string): string | null {
  if (pw.length < MIN_ANON_PASSWORD_LENGTH) return `${MIN_ANON_PASSWORD_LENGTH}자 이상 입력해 주세요`;
  if (pw.length > MAX_ANON_PASSWORD_LENGTH) return `${MAX_ANON_PASSWORD_LENGTH}자 이내로 입력해 주세요`;
  return null;
}

/**
 * 평문 비밀번호를 받아 익명 가이드를 생성한다.
 * SQL: bcrypt 해시는 INSERT 시 select crypt(?, gen_salt('bf'))로 만든다 — 클라이언트는 평문 한 번만 전송.
 */
export async function insertAnonymousGuide(
  supabase: SupabaseClient,
  args: {
    nickname: string;
    password: string;
    title: string;
    body: string;
    species_id: string | null;
    cover_url: string | null;
  }
) {
  // 평문 비번을 받아 DB에서 bcrypt 해시
  const { data, error } = await supabase.rpc('insert_anonymous_guide', {
    p_nickname: args.nickname,
    p_password: args.password,
    p_title: args.title,
    p_body: args.body,
    p_species_id: args.species_id,
    p_cover_url: args.cover_url,
  });
  return { id: data as string | null, error };
}

export async function insertAnonymousComment(
  supabase: SupabaseClient,
  args: {
    guide_id: string;
    nickname: string;
    password: string;
    body: string;
  }
) {
  const { data, error } = await supabase.rpc('insert_anonymous_comment', {
    p_guide_id: args.guide_id,
    p_nickname: args.nickname,
    p_password: args.password,
    p_body: args.body,
  });
  return { id: data as string | null, error };
}
