-- 0007: 이미지 업로드 버킷, 글 신고, DM 미읽음 카운트

-- ──────────────────────────────────────────────────────────────
-- 1. 스토리지 버킷 추가 (community / rescue / announcement 이미지)
-- ──────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values
  ('community-images',   'community-images',   true),
  ('rescue-images',      'rescue-images',      true),
  ('announcement-images','announcement-images',true)
on conflict (id) do nothing;

-- community-images: 누구나 읽기, 본인 폴더(uid)만 쓰기
create policy "community-images readable"
  on storage.objects for select using (bucket_id = 'community-images');
create policy "community-images writable by owner"
  on storage.objects for insert with check (
    bucket_id = 'community-images' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "community-images deletable by owner"
  on storage.objects for delete using (
    bucket_id = 'community-images' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- rescue-images: 동일
create policy "rescue-images readable"
  on storage.objects for select using (bucket_id = 'rescue-images');
create policy "rescue-images writable by owner"
  on storage.objects for insert with check (
    bucket_id = 'rescue-images' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "rescue-images deletable by owner"
  on storage.objects for delete using (
    bucket_id = 'rescue-images' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- announcement-images: 관리자만 쓰기
create policy "announcement-images readable"
  on storage.objects for select using (bucket_id = 'announcement-images');
create policy "announcement-images writable by admins"
  on storage.objects for insert with check (
    bucket_id = 'announcement-images' and public.is_admin()
  );
create policy "announcement-images deletable by admins"
  on storage.objects for delete using (
    bucket_id = 'announcement-images' and public.is_admin()
  );

-- ──────────────────────────────────────────────────────────────
-- 2. 커뮤니티 / 구조대 글에 cover_url 컬럼 (이미 rescue에는 있음)
-- ──────────────────────────────────────────────────────────────
alter table public.community_posts
  add column if not exists cover_url text;
alter table public.announcements
  add column if not exists cover_url text;

-- ──────────────────────────────────────────────────────────────
-- 3. 글 신고 시스템 (커뮤니티/가이드/구조대 공통)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.post_reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid references public.profiles(id) on delete set null,
  target_type     text not null check (target_type in ('community','guide','rescue','community_comment','guide_comment')),
  target_id       uuid not null,
  reason          text,
  created_at      timestamptz not null default now()
);
create index post_reports_created_idx on public.post_reports (created_at desc);

alter table public.post_reports enable row level security;
create policy "post_reports insert" on public.post_reports for insert with check (true);
create policy "post_reports read by admin" on public.post_reports for select using (public.is_admin());
create policy "post_reports delete by admin" on public.post_reports for delete using (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 4. DM 미읽음 카운트 RPC
--    헤더의 ✉ 버튼 옆에 빨간 점을 띄우기 위함
-- ──────────────────────────────────────────────────────────────
create or replace function public.dm_unread_count()
returns integer
language sql stable security definer set search_path = public
as $$
  select coalesce((
    select count(*)::int
    from public.dm_messages m
    join public.dm_threads t on t.id = m.thread_id
    where m.read_at is null
      and m.sender_id <> auth.uid()
      and (t.user_a = auth.uid() or t.user_b = auth.uid())
  ), 0);
$$;
grant execute on function public.dm_unread_count() to authenticated;

-- 스레드 진입 시 메시지 일괄 읽음 처리 RPC
create or replace function public.mark_dm_read(p_thread_id uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.dm_messages
  set read_at = now()
  where thread_id = p_thread_id
    and sender_id <> auth.uid()
    and read_at is null;
$$;
grant execute on function public.mark_dm_read(uuid) to authenticated;
