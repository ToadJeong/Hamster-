-- 0019: 모먼트(Moments) — 반려 햄찌 일상 기록 피드 + 내 햄찌 등록
-- 이미지는 기존 community-images 버킷을 재사용(별도 스토리지 설정 불필요).

-- ── 내 햄찌 ─────────────────────────────────────────────────────
create table if not exists public.pets (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  species_id   uuid references public.species(id) on delete set null,
  species_label text,
  birthday     date,
  photo_url    text,
  bio          text,
  created_at   timestamptz not null default now()
);
create index if not exists pets_owner_idx on public.pets (owner_id, created_at);
alter table public.pets enable row level security;
drop policy if exists "pets readable" on public.pets;
drop policy if exists "pets owner insert" on public.pets;
drop policy if exists "pets owner update" on public.pets;
drop policy if exists "pets owner delete" on public.pets;
create policy "pets readable"      on public.pets for select using (true);
create policy "pets owner insert"  on public.pets for insert with check (auth.uid() = owner_id);
create policy "pets owner update"  on public.pets for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "pets owner delete"  on public.pets for delete using (auth.uid() = owner_id);

-- ── 모먼트 ──────────────────────────────────────────────────────
create table if not exists public.moments (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  pet_id      uuid references public.pets(id) on delete set null,
  image_url   text not null,
  caption     text,
  created_at  timestamptz not null default now()
);
create index if not exists moments_created_idx on public.moments (created_at desc);
create index if not exists moments_author_idx  on public.moments (author_id, created_at desc);
alter table public.moments enable row level security;
drop policy if exists "moments readable" on public.moments;
drop policy if exists "moments insert by author" on public.moments;
drop policy if exists "moments update by author" on public.moments;
drop policy if exists "moments delete by author or staff" on public.moments;
create policy "moments readable" on public.moments for select using (true);
create policy "moments insert by author" on public.moments for insert with check (auth.uid() = author_id);
create policy "moments update by author" on public.moments for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "moments delete by author or staff" on public.moments for delete using (auth.uid() = author_id or public.is_staff());

-- 좋아요
create table if not exists public.moment_likes (
  moment_id uuid not null references public.moments(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moment_id, user_id)
);
alter table public.moment_likes enable row level security;
drop policy if exists "moment_likes readable" on public.moment_likes;
drop policy if exists "moment_likes insert" on public.moment_likes;
drop policy if exists "moment_likes delete" on public.moment_likes;
create policy "moment_likes readable" on public.moment_likes for select using (true);
create policy "moment_likes insert" on public.moment_likes for insert with check (auth.uid() = user_id);
create policy "moment_likes delete" on public.moment_likes for delete using (auth.uid() = user_id);

-- 댓글
create table if not exists public.moment_comments (
  id          uuid primary key default gen_random_uuid(),
  moment_id   uuid not null references public.moments(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists moment_comments_idx on public.moment_comments (moment_id, created_at);
alter table public.moment_comments enable row level security;
drop policy if exists "moment_comments readable" on public.moment_comments;
drop policy if exists "moment_comments insert" on public.moment_comments;
drop policy if exists "moment_comments delete" on public.moment_comments;
create policy "moment_comments readable" on public.moment_comments for select using (true);
create policy "moment_comments insert" on public.moment_comments for insert with check (auth.uid() = author_id);
create policy "moment_comments delete" on public.moment_comments for delete using (auth.uid() = author_id or public.is_staff());

-- 피드 뷰
drop view if exists public.moments_feed;
create view public.moments_feed
with (security_invoker = on) as
select
  m.id, m.author_id, m.pet_id, m.image_url, m.caption, m.created_at,
  p.username   as author_username,
  p.avatar_url as author_avatar_url,
  pet.name     as pet_name,
  coalesce((select count(*) from public.moment_likes l where l.moment_id = m.id), 0) as like_count,
  coalesce((select count(*) from public.moment_comments c where c.moment_id = m.id), 0) as comment_count
from public.moments m
left join public.profiles p on p.id = m.author_id
left join public.pets pet on pet.id = m.pet_id;

-- 댓글 알림
create or replace function public.notify_moment_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_who text;
begin
  select author_id into v_author from public.moments where id = new.moment_id;
  if v_author is null or v_author = new.author_id then return new; end if;
  select username into v_who from public.profiles where id = new.author_id;
  perform public.send_notification(v_author, 'new_comment', '내 모먼트에 댓글이 달렸어요',
    coalesce(v_who,'햄집사')||'님: '||left(new.body,60), '/moments/'||new.moment_id::text);
  return new;
end; $$;
drop trigger if exists moment_comment_notify on public.moment_comments;
create trigger moment_comment_notify after insert on public.moment_comments
  for each row execute function public.notify_moment_comment();

-- 감사 로그 트리거
do $$
begin
  if exists (select 1 from pg_proc where proname = 'log_audit') then
    drop trigger if exists audit_moments on public.moments;
    create trigger audit_moments after insert or update or delete on public.moments for each row execute function public.log_audit();
    drop trigger if exists audit_moment_comments on public.moment_comments;
    create trigger audit_moment_comments after insert or update or delete on public.moment_comments for each row execute function public.log_audit();
  end if;
end $$;
