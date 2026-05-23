-- 0008: 관리자/테스트 계정, 아이디(닉네임) 로그인 지원, 익명 글 본인 삭제 RPC

-- ──────────────────────────────────────────────────────────────
-- 1. 익명 커뮤니티 글/댓글 본인 삭제·수정 (SHA-256 해시 비교)
--    클라이언트가 sha256(평문)을 보내고 서버가 그대로 비교한다.
--    pgcrypto의 digest() 함수와 일치한지 검증.
-- ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

create or replace function public.delete_anonymous_community_post(p_post_id uuid, p_password text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_hash text;
  v_provided text;
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

create or replace function public.update_anonymous_community_post(
  p_post_id uuid, p_password text,
  p_title text, p_body text, p_category text, p_tags text[], p_cover_url text
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_hash text;
  v_provided text;
begin
  select anonymous_password_hash into v_hash
    from public.community_posts where id = p_post_id and author_id is null;
  if v_hash is null then return false; end if;
  select encode(digest(p_password, 'sha256'), 'hex') into v_provided;
  if v_hash <> v_provided then return false; end if;
  update public.community_posts
    set title = p_title, body = p_body, category = p_category,
        tags = coalesce(p_tags, array[]::text[]),
        cover_url = p_cover_url,
        updated_at = now()
    where id = p_post_id;
  return true;
end;
$$;

create or replace function public.delete_anonymous_community_comment(p_id uuid, p_password text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_hash text;
  v_provided text;
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

-- ──────────────────────────────────────────────────────────────
-- 2. 아이디(username) 로그인 지원: 이메일 조회 RPC
--    클라이언트는 입력값에 '@'가 없으면 이 함수로 이메일을 먼저 받아 로그인
-- ──────────────────────────────────────────────────────────────
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

-- ──────────────────────────────────────────────────────────────
-- 3. 관리자(admin) / 테스트(test) 계정 시드
--    이메일은 admin@hamland.local / test@hamland.local
--    아이디(username)로도 로그인 가능 (get_email_by_username 사용)
--    이미 존재하면 건너뜀
-- ──────────────────────────────────────────────────────────────
do $$
declare
  v_admin_id uuid;
  v_test_id  uuid;
begin
  -- admin 계정 생성
  if not exists (select 1 from auth.users where email = 'admin@hamland.local') then
    v_admin_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id, 'authenticated', 'authenticated',
      'admin@hamland.local',
      crypt('admin', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"admin"}'::jsonb,
      now(), now(),
      '', '', '', ''
    );
    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      v_admin_id::text, v_admin_id,
      format('{"sub":"%s","email":"%s"}', v_admin_id::text, 'admin@hamland.local')::jsonb,
      'email', now(), now(), now()
    );
    -- profiles는 handle_new_user 트리거가 자동 생성하지만,
    -- 트리거가 안 걸렸다면 직접 insert
    insert into public.profiles (id, username, is_admin)
    values (v_admin_id, 'admin', true)
    on conflict (id) do update set username = excluded.username, is_admin = true;
    -- 트리거가 이미 만들어 둔 경우에도 관리자 권한은 부여
    update public.profiles set is_admin = true, username = 'admin' where id = v_admin_id;
  else
    -- 이미 있다면 관리자 권한만 다시 부여
    update public.profiles
       set is_admin = true, username = 'admin'
     where id = (select id from auth.users where email = 'admin@hamland.local');
  end if;

  -- test 계정 생성
  if not exists (select 1 from auth.users where email = 'test@hamland.local') then
    v_test_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_test_id, 'authenticated', 'authenticated',
      'test@hamland.local',
      crypt('test', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"test"}'::jsonb,
      now(), now(),
      '', '', '', ''
    );
    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      v_test_id::text, v_test_id,
      format('{"sub":"%s","email":"%s"}', v_test_id::text, 'test@hamland.local')::jsonb,
      'email', now(), now(), now()
    );
    insert into public.profiles (id, username, is_admin)
    values (v_test_id, 'test', false)
    on conflict (id) do update set username = excluded.username;
    update public.profiles set username = 'test' where id = v_test_id;
  end if;
end $$;
