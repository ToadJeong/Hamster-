-- 0006: 회원 간 채팅(DM), 팔로우, 태그, 채팅 기록, 휴대폰번호

-- ──────────────────────────────────────────────────────────────
-- 1. profiles 확장: 휴대폰번호, 관심 태그
-- ──────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists phone text,
  add column if not exists interest_tags text[] default array[]::text[];

-- ──────────────────────────────────────────────────────────────
-- 2. 라운지 채팅 영구 기록 (최근 N시간만 표시용)
--    broadcast로 실시간 분배는 유지, 신규 접속자가 과거 메시지를 볼 수 있도록 DB에도 저장
--    스스로 정리되도록 24시간 이전 메시지는 cron으로 삭제 권장(별도 작업)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.lobby_messages (
  id              uuid primary key default gen_random_uuid(),
  sender_id       uuid references public.profiles(id) on delete set null,
  sender_label    text not null,
  sender_session  text not null,
  is_admin        boolean not null default false,
  body            text not null,
  created_at      timestamptz not null default now()
);

create index lobby_messages_created_at_idx on public.lobby_messages (created_at desc);

alter table public.lobby_messages enable row level security;
create policy "lobby readable" on public.lobby_messages for select using (true);
-- 누구나 작성 가능 (broadcast와 동기 작성). 단, label은 클라이언트가 정직하게 입력했다고 가정
create policy "lobby insert" on public.lobby_messages for insert with check (true);
create policy "lobby delete by admin" on public.lobby_messages for delete using (public.is_admin());

-- 1시간 이전 기록 가져오기 RPC (성능을 위해 인덱스 사용)
create or replace function public.get_recent_lobby(p_hours int default 1)
returns setof public.lobby_messages
language sql stable
as $$
  select * from public.lobby_messages
  where created_at > now() - (p_hours || ' hours')::interval
  order by created_at asc
  limit 200;
$$;

-- ──────────────────────────────────────────────────────────────
-- 3. 회원 간 1:1 채팅 (DM)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.dm_threads (
  id              uuid primary key default gen_random_uuid(),
  -- 두 참여자: ID가 작은 순서로 a/b에 저장해 (a,b) 유니크
  user_a          uuid not null references public.profiles(id) on delete cascade,
  user_b          uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint dm_thread_user_order check (user_a < user_b),
  unique (user_a, user_b)
);

create index dm_threads_user_a_idx on public.dm_threads (user_a, last_message_at desc);
create index dm_threads_user_b_idx on public.dm_threads (user_b, last_message_at desc);

create table if not exists public.dm_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.dm_threads(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index dm_messages_thread_idx on public.dm_messages (thread_id, created_at);

alter table public.dm_threads  enable row level security;
alter table public.dm_messages enable row level security;

-- 본인이 포함된 스레드만 조회/사용 가능
create policy "dm_threads accessible by participants" on public.dm_threads
  for all using (auth.uid() = user_a or auth.uid() = user_b)
  with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "dm_messages accessible by participants" on public.dm_messages
  for select using (
    exists (
      select 1 from public.dm_threads t
      where t.id = thread_id and (auth.uid() = t.user_a or auth.uid() = t.user_b)
    )
  );

create policy "dm_messages send by participants" on public.dm_messages
  for insert with check (
    auth.uid() = sender_id and exists (
      select 1 from public.dm_threads t
      where t.id = thread_id and (auth.uid() = t.user_a or auth.uid() = t.user_b)
    )
  );

create policy "dm_messages mark read" on public.dm_messages
  for update using (
    exists (
      select 1 from public.dm_threads t
      where t.id = thread_id and (auth.uid() = t.user_a or auth.uid() = t.user_b)
    )
  );

-- DM 메시지 추가 시 thread.last_message_at 갱신
create or replace function public.touch_dm_thread()
returns trigger language plpgsql as $$
begin
  update public.dm_threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end;
$$;
drop trigger if exists dm_messages_touch on public.dm_messages;
create trigger dm_messages_touch after insert on public.dm_messages
  for each row execute function public.touch_dm_thread();

-- 두 사용자 간 스레드 가져오거나 새로 만드는 RPC
create or replace function public.open_dm_thread(p_other uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_a uuid;
  v_b uuid;
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  if v_me = p_other then raise exception 'cannot dm self'; end if;
  if v_me < p_other then v_a := v_me; v_b := p_other;
  else                   v_a := p_other; v_b := v_me; end if;

  select id into v_id from public.dm_threads where user_a = v_a and user_b = v_b;
  if v_id is null then
    insert into public.dm_threads (user_a, user_b) values (v_a, v_b) returning id into v_id;
  end if;
  return v_id;
end;
$$;
grant execute on function public.open_dm_thread(uuid) to authenticated;

-- ──────────────────────────────────────────────────────────────
-- 4. 팔로우 (트위터식 관심사 연결)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  followee_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;
create policy "follows readable" on public.follows for select using (true);
create policy "follows insert by self" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows delete by self" on public.follows for delete using (auth.uid() = follower_id);

-- ──────────────────────────────────────────────────────────────
-- 5. 커뮤니티 포스트에 태그/좋아요 (트위터식 피드)
-- ──────────────────────────────────────────────────────────────
alter table public.community_posts
  add column if not exists tags text[] default array[]::text[];

create index community_posts_tags_gin on public.community_posts using gin (tags);

create table if not exists public.community_likes (
  post_id     uuid not null references public.community_posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.community_likes enable row level security;
create policy "community_likes readable" on public.community_likes for select using (true);
create policy "community_likes insert" on public.community_likes for insert with check (auth.uid() = user_id);
create policy "community_likes delete" on public.community_likes for delete using (auth.uid() = user_id);

-- 커뮤니티 피드 뷰 (좋아요/댓글 수, 작성자 정보 포함)
drop view if exists public.community_posts_feed;
create view public.community_posts_feed as
select
  c.*,
  p.username       as author_username,
  p.avatar_url     as author_avatar_url,
  coalesce((select count(*) from public.community_likes l where l.post_id = c.id), 0) as like_count,
  coalesce((select count(*) from public.community_comments cm where cm.post_id = c.id), 0) as comment_count
from public.community_posts c
left join public.profiles p on p.id = c.author_id;

-- ──────────────────────────────────────────────────────────────
-- 6. 회원가입 시 phone 받기 위해 handle_new_user 함수 갱신
--    raw_user_meta_data에서 username, phone 둘 다 읽음
-- ──────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, phone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 6)
    ),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
