-- 0004: 실시간 채팅 신고·금지어 / 펫 햄스터 기본값

-- ──────────────────────────────────────────────────────────────
-- 1. 채팅 신고 (메시지는 DB에 저장하지 않고 broadcast로만 흘러가지만,
--    신고가 들어온 메시지는 스냅샷을 저장한다)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.chat_reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid references public.profiles(id) on delete set null,
  reporter_label  text,         -- 비로그인 신고자 닉네임 (선택)
  target_label    text not null, -- 신고당한 메시지의 화자 이름
  target_session  text,          -- broadcast presence id
  message_body    text not null,
  reason          text,
  created_at      timestamptz not null default now()
);

alter table public.chat_reports enable row level security;

-- 누구나 신고 가능
create policy "anyone can insert chat_reports"
  on public.chat_reports for insert
  with check (true);

-- 관리자만 조회·삭제
create policy "admins can read chat_reports"
  on public.chat_reports for select using (public.is_admin());

create policy "admins can delete chat_reports"
  on public.chat_reports for delete using (public.is_admin());

create index chat_reports_created_at_idx on public.chat_reports (created_at desc);

-- ──────────────────────────────────────────────────────────────
-- 2. 채팅 금지어 (관리자 편집 가능)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.chat_banned_words (
  id          uuid primary key default gen_random_uuid(),
  word        text unique not null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.chat_banned_words enable row level security;

-- 누구나 읽기 (클라이언트 필터링용)
create policy "banned words readable"
  on public.chat_banned_words for select using (true);

create policy "banned words writable by admins"
  on public.chat_banned_words for insert
  with check (public.is_admin());

create policy "banned words deletable by admins"
  on public.chat_banned_words for delete
  using (public.is_admin());

-- 기본 금지어 (필요 시 관리자가 추가)
insert into public.chat_banned_words (word) values
  ('병신'), ('씨발'), ('개새끼'), ('좆'), ('니애미'), ('fuck'), ('shit')
on conflict (word) do nothing;

-- ──────────────────────────────────────────────────────────────
-- 3. site_settings: 채팅 기능 ON/OFF
-- ──────────────────────────────────────────────────────────────
insert into public.site_settings (key, value) values
  ('chat.enabled', 'true'::jsonb)
on conflict (key) do nothing;
