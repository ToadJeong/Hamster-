-- 0005: 공지사항, 커뮤니티 게시글, 유기햄 구조대 게시판

-- ──────────────────────────────────────────────────────────────
-- 1. 공지사항 (관리자가 작성, 모두 읽기)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  pinned      boolean not null default false,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index announcements_pinned_idx on public.announcements (pinned desc, created_at desc);

alter table public.announcements enable row level security;

create policy "announcements readable" on public.announcements
  for select using (true);

create policy "announcements writable by admins" on public.announcements
  for insert with check (public.is_admin());

create policy "announcements updatable by admins" on public.announcements
  for update using (public.is_admin()) with check (public.is_admin());

create policy "announcements deletable by admins" on public.announcements
  for delete using (public.is_admin());

drop trigger if exists announcements_touch_updated_at on public.announcements;
create trigger announcements_touch_updated_at
  before update on public.announcements
  for each row execute function public.touch_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 2. 커뮤니티 자유 게시판 (햄집사들의 잡담/질문)
--    가이드와 별개: 가이드는 정리된 사육 노하우, 커뮤니티는 자유 글
-- ──────────────────────────────────────────────────────────────
create table if not exists public.community_posts (
  id                      uuid primary key default gen_random_uuid(),
  author_id               uuid references public.profiles(id) on delete cascade,
  anonymous_nickname      text,
  anonymous_password_hash text,
  title                   text not null,
  body                    text not null,
  category                text not null default 'free',  -- 'free' | 'question' | 'show-off'
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint community_author_or_anon check (
    (author_id is not null and anonymous_nickname is null and anonymous_password_hash is null)
    or (author_id is null and anonymous_nickname is not null and anonymous_password_hash is not null)
  )
);

create index community_posts_created_idx on public.community_posts (created_at desc);
create index community_posts_category_idx on public.community_posts (category, created_at desc);

alter table public.community_posts enable row level security;

create policy "community readable" on public.community_posts
  for select using (true);

create policy "community insert (anon or own)" on public.community_posts
  for insert with check (
    (author_id is null and anonymous_nickname is not null and anonymous_password_hash is not null)
    or (auth.uid() is not null and auth.uid() = author_id)
  );

create policy "community update by own" on public.community_posts
  for update using (auth.uid() = author_id);

create policy "community delete by own or admin" on public.community_posts
  for delete using (auth.uid() = author_id or public.is_admin());

drop trigger if exists community_posts_touch on public.community_posts;
create trigger community_posts_touch
  before update on public.community_posts
  for each row execute function public.touch_updated_at();

revoke select (anonymous_password_hash) on public.community_posts from anon, authenticated;

-- 커뮤니티 댓글
create table if not exists public.community_comments (
  id                      uuid primary key default gen_random_uuid(),
  post_id                 uuid not null references public.community_posts(id) on delete cascade,
  author_id               uuid references public.profiles(id) on delete cascade,
  anonymous_nickname      text,
  anonymous_password_hash text,
  body                    text not null,
  created_at              timestamptz not null default now(),
  constraint community_comment_author_or_anon check (
    (author_id is not null and anonymous_nickname is null and anonymous_password_hash is null)
    or (author_id is null and anonymous_nickname is not null and anonymous_password_hash is not null)
  )
);
create index community_comments_post_idx on public.community_comments (post_id, created_at);
alter table public.community_comments enable row level security;
create policy "community_comments readable" on public.community_comments for select using (true);
create policy "community_comments insert" on public.community_comments for insert
  with check (
    (author_id is null and anonymous_nickname is not null and anonymous_password_hash is not null)
    or (auth.uid() is not null and auth.uid() = author_id)
  );
create policy "community_comments delete" on public.community_comments
  for delete using (auth.uid() = author_id or public.is_admin());
revoke select (anonymous_password_hash) on public.community_comments from anon, authenticated;

-- ──────────────────────────────────────────────────────────────
-- 3. 유기햄 구조대 (입양/구조 매칭 게시판)
--    회원만 작성 가능 (신뢰 이슈로 익명 금지)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.rescue_posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles(id) on delete cascade,
  species_id    uuid references public.species(id) on delete set null,
  kind          text not null default 'available',  -- 'available'(분양 가능) | 'needs-home'(긴급 입양처 구함) | 'lost'(잃어버림) | 'found'(발견)
  status        text not null default 'open',       -- 'open' | 'in_progress' | 'completed' | 'closed'
  title         text not null,
  body          text not null,
  region        text,                               -- "서울", "경기 분당" 등 시·구 단위
  cover_url     text,
  contact_hint  text,                               -- 연락 방법 힌트 (오픈채팅 링크 등)
  age_months    integer,                            -- 추정 나이(개월)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index rescue_status_idx  on public.rescue_posts (status, created_at desc);
create index rescue_region_idx  on public.rescue_posts (region, created_at desc);
create index rescue_kind_idx    on public.rescue_posts (kind, created_at desc);

alter table public.rescue_posts enable row level security;

create policy "rescue readable" on public.rescue_posts for select using (true);

create policy "rescue insert by authenticated" on public.rescue_posts
  for insert with check (auth.uid() = author_id);

create policy "rescue update by author" on public.rescue_posts
  for update using (auth.uid() = author_id);

create policy "rescue delete by author or admin" on public.rescue_posts
  for delete using (auth.uid() = author_id or public.is_admin());

drop trigger if exists rescue_posts_touch on public.rescue_posts;
create trigger rescue_posts_touch
  before update on public.rescue_posts
  for each row execute function public.touch_updated_at();

-- 작성자/종 정보를 함께 보여주는 뷰
drop view if exists public.rescue_posts_with_author;
create view public.rescue_posts_with_author as
select
  r.*,
  p.username      as author_username,
  p.avatar_url    as author_avatar_url,
  s.slug          as species_slug,
  s.name_ko       as species_name_ko
from public.rescue_posts r
left join public.profiles p on p.id = r.author_id
left join public.species  s on s.id = r.species_id;

-- ──────────────────────────────────────────────────────────────
-- 4. site_settings 확장 — 브랜드 명칭(코드에 박지 않음)
-- ──────────────────────────────────────────────────────────────
insert into public.site_settings (key, value) values
  ('brand.site_name',  '"햄랜드"'::jsonb),
  ('brand.user_label', '"햄집사"'::jsonb)
on conflict (key) do update set value = excluded.value;
