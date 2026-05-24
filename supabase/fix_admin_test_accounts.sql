-- 관리자(admin) / 테스트(test) 계정 생성·복구 스크립트
-- 0008이 실패했거나 계정이 안 만들어졌을 때 이 파일만 단독 실행하세요.
-- 여러 번 실행해도 안전합니다 (기존 계정을 깨끗이 지우고 다시 만듭니다).
--
-- 로그인:  아이디 admin / 비밀번호 admin   ·   아이디 test / 비밀번호 test
-- (로그인 창에 "admin" 또는 "test"만 입력하면 됩니다)

create extension if not exists "pgcrypto";

-- 1) 기존(혹은 깨진) 계정 정리 — 프로필은 on delete cascade로 함께 정리됨
delete from auth.users where email in ('admin@hamland.local', 'test@hamland.local');

-- 2) 계정 재생성
do $$
declare
  v_id uuid;
  rec record;
begin
  for rec in
    select 'admin@hamland.local' as email, 'admin' as pw, 'admin' as uname, true  as is_admin
    union all
    select 'test@hamland.local',  'test',  'test',  false
  loop
    v_id := gen_random_uuid();

    -- auth.users : 이메일+비밀번호 로그인에 필요한 모든 컬럼 채우기
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      rec.email, crypt(rec.pw, gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', rec.uname),
      now(), now(),
      '', '', '', ''
    );

    -- auth.identities : 이메일 provider 연결 (generated 컬럼 email은 넣지 않음)
    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      v_id::text, v_id,
      jsonb_build_object('sub', v_id::text, 'email', rec.email, 'email_verified', true),
      'email', now(), now(), now()
    );

    -- profiles : 트리거가 자동 생성하지만, 확실히 보장 + 권한 설정
    insert into public.profiles (id, username, is_admin)
    values (v_id, rec.uname, rec.is_admin)
    on conflict (id) do update
      set username = excluded.username, is_admin = excluded.is_admin;
  end loop;
end $$;

-- 3) 확인
select p.username, p.is_admin, u.email,
       (u.email_confirmed_at is not null) as email_confirmed,
       exists(select 1 from auth.identities i where i.user_id = u.id) as has_identity
from public.profiles p
join auth.users u on u.id = p.id
where p.username in ('admin', 'test');
-- 두 줄이 나오고 email_confirmed = true, has_identity = true 면 성공입니다.
