-- 0002: 관리자 권한, 사이트 설정(소셜 로그인 ON/OFF), 스토리지 버킷

-- ──────────────────────────────────────────────────────────────
-- 1. 관리자 컬럼
-- ──────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 관리자 여부 헬퍼
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ──────────────────────────────────────────────────────────────
-- 2. 사이트 설정 (key/value)
--    소셜 로그인 ON/OFF 등을 보관
-- ──────────────────────────────────────────────────────────────
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id) on delete set null
);

alter table public.site_settings enable row level security;

-- 모두 읽기 (로그인 화면에서 토글 상태를 보려면 비로그인도 읽어야 함)
create policy "site_settings readable by everyone"
  on public.site_settings for select using (true);

-- 관리자만 수정·추가
create policy "site_settings writable by admins"
  on public.site_settings for insert
  with check (public.is_admin());

create policy "site_settings updatable by admins"
  on public.site_settings for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "site_settings deletable by admins"
  on public.site_settings for delete
  using (public.is_admin());

-- 기본값 (둘 다 OFF로 시작)
insert into public.site_settings (key, value) values
  ('auth.google_enabled', 'false'::jsonb),
  ('auth.kakao_enabled',  'false'::jsonb)
on conflict (key) do nothing;

-- ──────────────────────────────────────────────────────────────
-- 3. species 관리 (관리자만 추가/수정/삭제)
-- ──────────────────────────────────────────────────────────────
create policy "species insertable by admins"
  on public.species for insert
  with check (public.is_admin());

create policy "species updatable by admins"
  on public.species for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "species deletable by admins"
  on public.species for delete
  using (public.is_admin());

-- updated_at 자동 갱신
alter table public.species
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists species_touch_updated_at on public.species;
create trigger species_touch_updated_at
  before update on public.species
  for each row execute function public.touch_updated_at();

drop trigger if exists guides_touch_updated_at on public.guides;
create trigger guides_touch_updated_at
  before update on public.guides
  for each row execute function public.touch_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 4. 스토리지 버킷 (가이드 커버, 종 이미지, 프로필 아바타)
--    Supabase Storage는 storage 스키마로 관리됨
-- ──────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('species-images', 'species-images', true),
  ('guide-covers',   'guide-covers',   true),
  ('avatars',        'avatars',        true)
on conflict (id) do nothing;

-- species-images: 누구나 읽기, 관리자만 쓰기
create policy "species-images readable"
  on storage.objects for select
  using (bucket_id = 'species-images');

create policy "species-images writable by admins"
  on storage.objects for insert
  with check (bucket_id = 'species-images' and public.is_admin());

create policy "species-images updatable by admins"
  on storage.objects for update
  using (bucket_id = 'species-images' and public.is_admin());

create policy "species-images deletable by admins"
  on storage.objects for delete
  using (bucket_id = 'species-images' and public.is_admin());

-- guide-covers: 누구나 읽기, 본인 폴더(uid)만 쓰기
create policy "guide-covers readable"
  on storage.objects for select
  using (bucket_id = 'guide-covers');

create policy "guide-covers writable by owner"
  on storage.objects for insert
  with check (
    bucket_id = 'guide-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "guide-covers updatable by owner"
  on storage.objects for update
  using (
    bucket_id = 'guide-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "guide-covers deletable by owner"
  on storage.objects for delete
  using (
    bucket_id = 'guide-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- avatars: 누구나 읽기, 본인 폴더(uid)만 쓰기
create policy "avatars readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars writable by owner"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars updatable by owner"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars deletable by owner"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
