-- 관리자(admin)/테스트(test) 계정 생성·복구 v2 (SQL Editor에서 1회 실행)
-- 로그인: 아이디 admin / 비번 admin,  아이디 test / 비번 test
-- 여러 번 실행해도 안전. identities 삽입이 실패해도 계정은 생성됩니다.

create extension if not exists "pgcrypto";

-- 기존(혹은 깨진) 계정 정리 (프로필은 cascade로 함께 정리)
delete from auth.users where email in ('admin@hamland.local', 'test@hamland.local');

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

    -- identities 삽입은 버전에 따라 실패할 수 있으나, 실패해도 로그인은 동작하므로 무시
    begin
      insert into auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        v_id::text, v_id,
        jsonb_build_object('sub', v_id::text, 'email', rec.email, 'email_verified', true),
        'email', now(), now(), now()
      );
    exception when others then
      raise notice 'identities insert skipped for %: %', rec.email, sqlerrm;
    end;

    -- 프로필 (트리거가 만들었으면 갱신)
    insert into public.profiles (id, username, is_admin)
    values (v_id, rec.uname, rec.is_admin)
    on conflict (id) do update
      set username = excluded.username, is_admin = excluded.is_admin;
    update public.profiles set username = rec.uname, is_admin = rec.is_admin where id = v_id;
  end loop;
end $$;

-- 확인: 두 줄이 나오면 성공
select p.username, p.is_admin, u.email,
       (u.email_confirmed_at is not null) as confirmed,
       exists(select 1 from auth.identities i where i.user_id = u.id) as has_identity
from public.profiles p
join auth.users u on u.id = p.id
where p.username in ('admin', 'test');
