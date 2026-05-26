-- 0023_memorial.sql — 추모 "햄스터 별 🌟"
--   짧은 생을 살다 별이 된 햄찌들을 밝게 기억하는 공간.
--   memorials(추모) + memorial_tributes(별빛/묵념) + memorial_comments(댓글)

create table if not exists public.memorials (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  pet_id        uuid references public.pets(id) on delete set null,
  name          text not null,
  species_label text,
  emoji         text not null default '🐹',
  photo_url     text,
  born_at       date,
  passed_at     date,
  message       text,
  created_at    timestamptz not null default now()
);
create index if not exists memorials_created_idx on public.memorials (created_at desc);
alter table public.memorials enable row level security;
create policy "memorials readable" on public.memorials for select using (true);
create policy "memorials insert by owner" on public.memorials
  for insert with check (auth.uid() = owner_id);
create policy "memorials update by owner" on public.memorials
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "memorials delete by owner" on public.memorials
  for delete using (auth.uid() = owner_id or public.is_admin());

-- 별빛 보내기(묵념) — 회원당 1회 토글
create table if not exists public.memorial_tributes (
  memorial_id uuid not null references public.memorials(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (memorial_id, user_id)
);
alter table public.memorial_tributes enable row level security;
create policy "tributes readable" on public.memorial_tributes for select using (true);
create policy "tributes insert by self" on public.memorial_tributes
  for insert with check (auth.uid() = user_id);
create policy "tributes delete by self" on public.memorial_tributes
  for delete using (auth.uid() = user_id);

-- 추모 댓글 (회원 전용)
create table if not exists public.memorial_comments (
  id          uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists memorial_comments_idx on public.memorial_comments (memorial_id, created_at);
alter table public.memorial_comments enable row level security;
create policy "memorial_comments readable" on public.memorial_comments for select using (true);
create policy "memorial_comments insert" on public.memorial_comments
  for insert with check (auth.uid() = author_id);
create policy "memorial_comments delete" on public.memorial_comments
  for delete using (auth.uid() = author_id or public.is_admin());

-- 목록/카운트 뷰
drop view if exists public.memorials_feed;
create view public.memorials_feed with (security_invoker = on) as
select
  m.*,
  p.username as owner_username,
  (select count(*) from public.memorial_tributes t where t.memorial_id = m.id) as tribute_count,
  (select count(*) from public.memorial_comments c where c.memorial_id = m.id) as comment_count
from public.memorials m
left join public.profiles p on p.id = m.owner_id;
