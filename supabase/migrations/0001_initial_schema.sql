-- 햄스터 커뮤니티 초기 스키마
-- 종(species), 프로필(profiles), 가이드(guides), 댓글(comments), 좋아요(likes)

create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- 1. 프로필 (auth.users 1:1)
-- ──────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now()
);

-- auth.users 가입 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 6)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- 2. 햄스터 종 (도감)
-- ──────────────────────────────────────────────────────────────
create table public.species (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name_ko         text not null,
  name_en         text,
  scientific_name text,
  size_cm         text,
  lifespan_years  text,
  temperament     text,
  origin          text,
  image_url       text,
  summary         text not null,
  description     text not null,
  care_tips       text,
  created_at      timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- 3. 가이드 게시글
-- ──────────────────────────────────────────────────────────────
create table public.guides (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  species_id  uuid references public.species(id) on delete set null,
  title       text not null,
  body        text not null,
  cover_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index guides_created_at_idx on public.guides (created_at desc);
create index guides_species_idx    on public.guides (species_id);
create index guides_author_idx     on public.guides (author_id);

-- ──────────────────────────────────────────────────────────────
-- 4. 댓글
-- ──────────────────────────────────────────────────────────────
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  guide_id    uuid not null references public.guides(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index comments_guide_idx on public.comments (guide_id, created_at);

-- ──────────────────────────────────────────────────────────────
-- 5. 좋아요
-- ──────────────────────────────────────────────────────────────
create table public.likes (
  guide_id   uuid not null references public.guides(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (guide_id, user_id)
);

create index likes_guide_idx on public.likes (guide_id);

-- ──────────────────────────────────────────────────────────────
-- 6. 가이드 카운트 뷰 (좋아요/댓글 수 한 번에 조회)
-- ──────────────────────────────────────────────────────────────
create or replace view public.guides_with_counts as
select
  g.*,
  p.username     as author_username,
  p.avatar_url   as author_avatar_url,
  s.slug         as species_slug,
  s.name_ko      as species_name_ko,
  coalesce((select count(*) from public.likes    l where l.guide_id = g.id), 0) as like_count,
  coalesce((select count(*) from public.comments c where c.guide_id = g.id), 0) as comment_count
from public.guides g
left join public.profiles p on p.id = g.author_id
left join public.species  s on s.id = g.species_id;

-- ──────────────────────────────────────────────────────────────
-- 7. RLS (Row Level Security)
-- ──────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.species  enable row level security;
alter table public.guides   enable row level security;
alter table public.comments enable row level security;
alter table public.likes    enable row level security;

-- profiles: 모두 읽기, 본인만 수정
create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- species: 모두 읽기 (관리자만 수정 — 일반 사용자 정책 없음)
create policy "species are viewable by everyone"
  on public.species for select using (true);

-- guides: 모두 읽기, 로그인 사용자가 본인 글 작성/수정/삭제
create policy "guides are viewable by everyone"
  on public.guides for select using (true);

create policy "authenticated users can insert guides"
  on public.guides for insert
  with check (auth.uid() = author_id);

create policy "authors can update their guides"
  on public.guides for update using (auth.uid() = author_id);

create policy "authors can delete their guides"
  on public.guides for delete using (auth.uid() = author_id);

-- comments: 모두 읽기, 로그인 사용자가 본인 댓글 작성/삭제
create policy "comments are viewable by everyone"
  on public.comments for select using (true);

create policy "authenticated users can insert comments"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "authors can delete their comments"
  on public.comments for delete using (auth.uid() = author_id);

-- likes: 모두 읽기, 본인 좋아요만 추가/삭제
create policy "likes are viewable by everyone"
  on public.likes for select using (true);

create policy "users can insert their own likes"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "users can delete their own likes"
  on public.likes for delete using (auth.uid() = user_id);
