-- 0012: 누락 테이블 복구(post_reports 등) + 운영자 권한 + 개인정보(본명/생년월일/성별) + 관리자 삭제 RPC
-- 모두 idempotent (있으면 통과). 자동배포로 반영됨.

create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- 1. 0007에서 롤백되었을 수 있는 것들 복구
-- ──────────────────────────────────────────────────────────────

-- 1-1. 글 신고
create table if not exists public.post_reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references public.profiles(id) on delete set null,
  target_type  text not null check (target_type in ('community','guide','rescue','community_comment','guide_comment')),
  target_id    uuid not null,
  reason       text,
  created_at   timestamptz not null default now()
);
create index if not exists post_reports_created_idx on public.post_reports (created_at desc);
alter table public.post_reports enable row level security;
drop policy if exists "post_reports insert"      on public.post_reports;
drop policy if exists "post_reports read by admin" on public.post_reports;
drop policy if exists "post_reports delete by admin" on public.post_reports;
create policy "post_reports insert"        on public.post_reports for insert with check (true);
create policy "post_reports read by admin" on public.post_reports for select using (public.is_admin());
create policy "post_reports delete by admin" on public.post_reports for delete using (public.is_admin());

-- 1-2. cover_url 컬럼 (커뮤니티/공지)
alter table public.community_posts add column if not exists cover_url text;
alter table public.announcements  add column if not exists cover_url text;

-- 1-3. 스토리지 버킷
insert into storage.buckets (id, name, public) values
  ('community-images','community-images',true),
  ('rescue-images','rescue-images',true),
  ('announcement-images','announcement-images',true)
on conflict (id) do nothing;

drop policy if exists "community-images readable"          on storage.objects;
drop policy if exists "community-images writable by owner" on storage.objects;
drop policy if exists "community-images deletable by owner" on storage.objects;
create policy "community-images readable" on storage.objects for select using (bucket_id='community-images');
create policy "community-images writable by owner" on storage.objects for insert
  with check (bucket_id='community-images' and auth.uid()::text=(storage.foldername(name))[1]);
create policy "community-images deletable by owner" on storage.objects for delete
  using (bucket_id='community-images' and auth.uid()::text=(storage.foldername(name))[1]);

drop policy if exists "rescue-images readable"          on storage.objects;
drop policy if exists "rescue-images writable by owner" on storage.objects;
drop policy if exists "rescue-images deletable by owner" on storage.objects;
create policy "rescue-images readable" on storage.objects for select using (bucket_id='rescue-images');
create policy "rescue-images writable by owner" on storage.objects for insert
  with check (bucket_id='rescue-images' and auth.uid()::text=(storage.foldername(name))[1]);
create policy "rescue-images deletable by owner" on storage.objects for delete
  using (bucket_id='rescue-images' and auth.uid()::text=(storage.foldername(name))[1]);

drop policy if exists "announcement-images readable"           on storage.objects;
drop policy if exists "announcement-images writable by admins" on storage.objects;
drop policy if exists "announcement-images deletable by admins" on storage.objects;
create policy "announcement-images readable" on storage.objects for select using (bucket_id='announcement-images');
create policy "announcement-images writable by admins" on storage.objects for insert
  with check (bucket_id='announcement-images' and public.is_admin());
create policy "announcement-images deletable by admins" on storage.objects for delete
  using (bucket_id='announcement-images' and public.is_admin());

-- 1-4. 콘텐츠 제보 (0009 보강 — 없으면 생성)
create table if not exists public.content_corrections (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid references public.profiles(id) on delete set null,
  reporter_name text,
  target_type   text not null,
  target_id     uuid,
  target_slug   text,
  field         text,
  current_text  text,
  suggested     text not null,
  reason        text,
  status        text not null default 'open',
  created_at    timestamptz not null default now()
);
alter table public.content_corrections enable row level security;
drop policy if exists "content_corrections insert anyone" on public.content_corrections;
create policy "content_corrections insert anyone" on public.content_corrections for insert with check (true);

-- ──────────────────────────────────────────────────────────────
-- 2. 운영자(moderator) 권한 + is_staff()
--    is_admin = 마스터(권한 관리 가능), is_moderator = 운영자(글 삭제·공지 가능)
-- ──────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists is_moderator boolean not null default false;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce((select is_admin or is_moderator from public.profiles where id = auth.uid()), false);
$$;
grant execute on function public.is_staff() to authenticated;

-- ──────────────────────────────────────────────────────────────
-- 3. 개인정보(본명/생년월일/성별) — 별도 테이블 + 엄격 RLS
--    본인과 관리자만 조회 가능 (공개 profiles와 분리)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.profile_private (
  id          uuid primary key references public.profiles(id) on delete cascade,
  real_name   text,
  birth_date  date,
  gender      text check (gender in ('male','female','other','undisclosed')),
  created_at  timestamptz not null default now()
);
alter table public.profile_private enable row level security;
drop policy if exists "private self or admin read"   on public.profile_private;
drop policy if exists "private self upsert"           on public.profile_private;
drop policy if exists "private self update"           on public.profile_private;
create policy "private self or admin read" on public.profile_private
  for select using (auth.uid() = id or public.is_admin());
create policy "private self upsert" on public.profile_private
  for insert with check (auth.uid() = id);
create policy "private self update" on public.profile_private
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- 가입 시 본명/생년월일/성별까지 저장하도록 트리거 갱신
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username',
             split_part(new.email,'@',1) || '_' || substr(new.id::text,1,6)),
    new.raw_user_meta_data->>'phone'
  ) on conflict (id) do nothing;

  begin
    insert into public.profile_private (id, real_name, birth_date, gender)
    values (
      new.id,
      nullif(new.raw_user_meta_data->>'real_name',''),
      nullif(new.raw_user_meta_data->>'birth_date','')::date,
      nullif(new.raw_user_meta_data->>'gender','')
    ) on conflict (id) do nothing;
  exception when others then
    -- 생년월일 형식 오류 등은 무시하고 계정 생성은 진행
    insert into public.profile_private (id, real_name, gender)
    values (new.id, nullif(new.raw_user_meta_data->>'real_name',''), nullif(new.raw_user_meta_data->>'gender',''))
    on conflict (id) do nothing;
  end;
  return new;
end;
$$;

-- ──────────────────────────────────────────────────────────────
-- 4. 관리자/운영자용 RPC
-- ──────────────────────────────────────────────────────────────

-- 4-1. 글 삭제 (비번 무시, 운영자 이상). 회원 글이면 작성자에게 알림.
create or replace function public.admin_delete_post(p_type text, p_id uuid, p_reason text default null)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_author uuid; v_title text;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;

  if p_type = 'community' then
    select author_id, title into v_author, v_title from public.community_posts where id = p_id;
    delete from public.community_posts where id = p_id;
  elsif p_type = 'guide' then
    select author_id, title into v_author, v_title from public.guides where id = p_id;
    delete from public.guides where id = p_id;
  elsif p_type = 'rescue' then
    select author_id, title into v_author, v_title from public.rescue_posts where id = p_id;
    delete from public.rescue_posts where id = p_id;
  elsif p_type = 'community_comment' then
    select author_id, left(body,30) into v_author, v_title from public.community_comments where id = p_id;
    delete from public.community_comments where id = p_id;
  elsif p_type = 'guide_comment' then
    select author_id, left(body,30) into v_author, v_title from public.comments where id = p_id;
    delete from public.comments where id = p_id;
  else
    raise exception 'unknown type %', p_type;
  end if;

  -- 회원(익명 아님) 글이면 알림
  if v_author is not null and v_author <> auth.uid() then
    insert into public.notifications (user_id, kind, title, body, link)
    values (
      v_author, 'rescue_status',
      '운영진이 회원님의 글을 삭제했어요',
      coalesce('“'||v_title||'” · ', '') || coalesce(p_reason, '커뮤니티 운영정책에 따라 삭제되었습니다.'),
      null
    );
  end if;
  return true;
end;
$$;
grant execute on function public.admin_delete_post(text, uuid, text) to authenticated;

-- 4-2. 회원 검색 (관리자 전용)
create or replace function public.admin_search_users(p_q text)
returns table (id uuid, username text, email text, is_admin boolean, is_moderator boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
    select p.id, p.username, u.email::text, p.is_admin, p.is_moderator, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where p_q is null or p_q = ''
       or p.username ilike '%'||p_q||'%'
       or u.email ilike '%'||p_q||'%'
    order by p.created_at desc
    limit 50;
end;
$$;
grant execute on function public.admin_search_users(text) to authenticated;

-- 4-3. 운영자 권한 부여/회수 (마스터=admin 전용, admin 본인은 변경 불가)
create or replace function public.admin_set_moderator(p_user uuid, p_value boolean)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.profiles set is_moderator = p_value
  where id = p_user and is_admin = false;  -- 마스터 계정은 대상에서 제외
  return true;
end;
$$;
grant execute on function public.admin_set_moderator(uuid, boolean) to authenticated;

-- 4-4. 공지 작성·삭제, 글 모더레이션을 운영자도 가능하게 (RLS 보강)
-- 공지: 기존 admin 정책에 더해 staff 허용
drop policy if exists "announcements writable by admins"  on public.announcements;
drop policy if exists "announcements updatable by admins"  on public.announcements;
drop policy if exists "announcements deletable by admins"  on public.announcements;
create policy "announcements writable by staff"  on public.announcements for insert with check (public.is_staff());
create policy "announcements updatable by staff" on public.announcements for update using (public.is_staff()) with check (public.is_staff());
create policy "announcements deletable by staff" on public.announcements for delete using (public.is_staff());
