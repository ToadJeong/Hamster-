-- 0011: 0008에서 롤백되었을 수 있는 핵심 RPC들을 안전하게 재정의
-- (계정 생성 같은 위험한 auth 삽입은 제외 — 그건 별도 스크립트로 1회 실행)
-- create or replace 라 여러 번 적용해도 안전하고, 자동배포로 반영된다.

create extension if not exists "pgcrypto";

-- 아이디(username)로 이메일 조회 — 아이디 로그인용
create or replace function public.get_email_by_username(p_username text)
returns text
language sql stable security definer set search_path = public
as $$
  select u.email::text
  from auth.users u
  join public.profiles p on p.id = u.id
  where p.username = p_username
  limit 1;
$$;
grant execute on function public.get_email_by_username(text) to anon, authenticated;

-- 익명 커뮤니티 글 삭제 (SHA-256 비번 검증)
create or replace function public.delete_anonymous_community_post(p_post_id uuid, p_password text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_hash text; v_provided text;
begin
  select anonymous_password_hash into v_hash
    from public.community_posts where id = p_post_id and author_id is null;
  if v_hash is null then return false; end if;
  select encode(digest(p_password, 'sha256'), 'hex') into v_provided;
  if v_hash <> v_provided then return false; end if;
  delete from public.community_posts where id = p_post_id;
  return true;
end;
$$;

-- 익명 커뮤니티 글 수정
create or replace function public.update_anonymous_community_post(
  p_post_id uuid, p_password text,
  p_title text, p_body text, p_category text, p_tags text[], p_cover_url text
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_hash text; v_provided text;
begin
  select anonymous_password_hash into v_hash
    from public.community_posts where id = p_post_id and author_id is null;
  if v_hash is null then return false; end if;
  select encode(digest(p_password, 'sha256'), 'hex') into v_provided;
  if v_hash <> v_provided then return false; end if;
  update public.community_posts
    set title = p_title, body = p_body, category = p_category,
        tags = coalesce(p_tags, array[]::text[]), cover_url = p_cover_url,
        updated_at = now()
    where id = p_post_id;
  return true;
end;
$$;

-- 익명 커뮤니티 댓글 삭제
create or replace function public.delete_anonymous_community_comment(p_id uuid, p_password text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_hash text; v_provided text;
begin
  select anonymous_password_hash into v_hash
    from public.community_comments where id = p_id and author_id is null;
  if v_hash is null then return false; end if;
  select encode(digest(p_password, 'sha256'), 'hex') into v_provided;
  if v_hash <> v_provided then return false; end if;
  delete from public.community_comments where id = p_id;
  return true;
end;
$$;

grant execute on function
  public.delete_anonymous_community_post(uuid, text),
  public.update_anonymous_community_post(uuid, text, text, text, text, text[], text),
  public.delete_anonymous_community_comment(uuid, text)
to anon, authenticated;
