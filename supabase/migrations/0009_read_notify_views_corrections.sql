-- 0009: 읽음 추적 + 알림 + 조회수 + 콘텐츠 제보 (한 파일에 통합)
--
-- 이 마이그레이션은 다음을 한 번에 추가합니다:
--   1. 읽음 마크 (회원: read_marks 테이블)
--   2. 조회수 카운터 (community_posts/guides에 view_count + bump RPC)
--   3. 알림 (notifications + 트리거)
--   4. 콘텐츠 제보 (species/guides 정보 수정 요청)

create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- 1. 읽음 마크 (회원 전용 — 비회원은 localStorage 사용)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.read_marks (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('guide','community','rescue','announcement')),
  target_id   uuid not null,
  read_at     timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index read_marks_user_idx on public.read_marks (user_id, read_at desc);

alter table public.read_marks enable row level security;
create policy "read_marks self" on public.read_marks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- 2. 조회수 카운터
-- ──────────────────────────────────────────────────────────────
alter table public.guides           add column if not exists view_count int not null default 0;
alter table public.community_posts  add column if not exists view_count int not null default 0;
alter table public.rescue_posts     add column if not exists view_count int not null default 0;

-- 뷰 재정의 — view_count 포함
drop view if exists public.guides_with_counts;
create view public.guides_with_counts as
select
  g.*,
  coalesce(p.username, g.anonymous_nickname) as author_username,
  p.avatar_url as author_avatar_url,
  s.slug      as species_slug,
  s.name_ko   as species_name_ko,
  coalesce((select count(*) from public.likes    l where l.guide_id = g.id), 0) as like_count,
  coalesce((select count(*) from public.comments c where c.guide_id = g.id), 0) as comment_count
from public.guides g
left join public.profiles p on p.id = g.author_id
left join public.species  s on s.id = g.species_id;

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

-- 조회수 증가 RPC (회원 1일 1회 제한, 비회원은 매번 카운트)
create or replace function public.bump_view(p_type text, p_id uuid)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_recent boolean := false;
  v_count int;
begin
  if v_user is not null then
    -- 회원: 같은 글을 24시간 안에 다시 봐도 카운트 안 함
    select exists(
      select 1 from public.read_marks
      where user_id = v_user and target_type = p_type and target_id = p_id
        and read_at > now() - interval '24 hours'
    ) into v_recent;
    -- 읽음 마크 갱신
    insert into public.read_marks (user_id, target_type, target_id, read_at)
    values (v_user, p_type, p_id, now())
    on conflict (user_id, target_type, target_id) do update set read_at = now();
  end if;

  if v_recent then
    if p_type = 'guide'     then select view_count into v_count from public.guides           where id = p_id;
    elsif p_type = 'community' then select view_count into v_count from public.community_posts  where id = p_id;
    elsif p_type = 'rescue'  then select view_count into v_count from public.rescue_posts     where id = p_id;
    end if;
    return coalesce(v_count, 0);
  end if;

  if p_type = 'guide' then
    update public.guides           set view_count = view_count + 1 where id = p_id returning view_count into v_count;
  elsif p_type = 'community' then
    update public.community_posts  set view_count = view_count + 1 where id = p_id returning view_count into v_count;
  elsif p_type = 'rescue' then
    update public.rescue_posts     set view_count = view_count + 1 where id = p_id returning view_count into v_count;
  end if;
  return coalesce(v_count, 0);
end;
$$;
grant execute on function public.bump_view(text, uuid) to anon, authenticated;

-- ──────────────────────────────────────────────────────────────
-- 3. 알림 시스템
-- ──────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in (
    'new_comment','new_like','new_follower','view_milestone','new_dm','rescue_status'
  )),
  title       text not null,
  body        text,
  link        text,         -- 클릭 시 이동할 경로 (예: /community/abc)
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;
create policy "notifications self read" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications self mark read" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications self delete" on public.notifications
  for delete using (auth.uid() = user_id);

-- 알림 전송 헬퍼
create or replace function public.send_notification(
  p_user uuid, p_kind text, p_title text, p_body text, p_link text
) returns void language sql security definer set search_path = public
as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select p_user, p_kind, p_title, p_body, p_link
  where p_user is not null;
$$;

-- 댓글 달림 → 가이드 작성자에게 알림
create or replace function public.notify_guide_comment()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_author uuid;
  v_title text;
  v_who text;
begin
  select author_id, title into v_author, v_title from public.guides where id = new.guide_id;
  if v_author is null or v_author = new.author_id then return new; end if;
  select coalesce(username, new.anonymous_nickname, '익명')
    into v_who from public.profiles where id = new.author_id;
  perform public.send_notification(
    v_author, 'new_comment',
    '내 가이드에 댓글이 달렸어요',
    coalesce(v_who, '익명') || '님: ' || left(new.body, 60),
    '/guides/' || new.guide_id::text
  );
  return new;
end; $$;
drop trigger if exists guide_comment_notify on public.comments;
create trigger guide_comment_notify after insert on public.comments
  for each row execute function public.notify_guide_comment();

-- 커뮤니티 댓글 → 글쓴이에게 알림
create or replace function public.notify_community_comment()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_author uuid;
  v_title text;
  v_who text;
begin
  select author_id, title into v_author, v_title from public.community_posts where id = new.post_id;
  if v_author is null or v_author = new.author_id then return new; end if;
  select coalesce(username, new.anonymous_nickname, '익명')
    into v_who from public.profiles where id = new.author_id;
  perform public.send_notification(
    v_author, 'new_comment',
    '내 글에 댓글이 달렸어요',
    coalesce(v_who, '익명') || '님: ' || left(new.body, 60),
    '/community/' || new.post_id::text
  );
  return new;
end; $$;
drop trigger if exists community_comment_notify on public.community_comments;
create trigger community_comment_notify after insert on public.community_comments
  for each row execute function public.notify_community_comment();

-- 좋아요 (커뮤니티/가이드) → 글쓴이에게 알림 (회원만)
create or replace function public.notify_community_like()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_author uuid;
  v_title text;
  v_who text;
begin
  select author_id, title into v_author, v_title from public.community_posts where id = new.post_id;
  if v_author is null or v_author = new.user_id then return new; end if;
  select username into v_who from public.profiles where id = new.user_id;
  perform public.send_notification(
    v_author, 'new_like',
    '내 글에 좋아요가 눌렸어요',
    coalesce(v_who, '햄집사') || '님이 "' || coalesce(v_title, '') || '" 글을 좋아해요',
    '/community/' || new.post_id::text
  );
  return new;
end; $$;
drop trigger if exists community_like_notify on public.community_likes;
create trigger community_like_notify after insert on public.community_likes
  for each row execute function public.notify_community_like();

create or replace function public.notify_guide_like()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_author uuid;
  v_title text;
  v_who text;
begin
  select author_id, title into v_author, v_title from public.guides where id = new.guide_id;
  if v_author is null or v_author = new.user_id then return new; end if;
  select username into v_who from public.profiles where id = new.user_id;
  perform public.send_notification(
    v_author, 'new_like',
    '내 가이드를 좋아해요',
    coalesce(v_who, '햄집사') || '님이 "' || coalesce(v_title, '') || '" 가이드를 좋아해요',
    '/guides/' || new.guide_id::text
  );
  return new;
end; $$;
drop trigger if exists guide_like_notify on public.likes;
create trigger guide_like_notify after insert on public.likes
  for each row execute function public.notify_guide_like();

-- 새 팔로워 알림
create or replace function public.notify_new_follower()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_who text;
begin
  select username into v_who from public.profiles where id = new.follower_id;
  perform public.send_notification(
    new.followee_id, 'new_follower',
    '새 팔로워가 생겼어요',
    coalesce(v_who, '햄집사') || '님이 나를 팔로우해요',
    '/profile'
  );
  return new;
end; $$;
drop trigger if exists follow_notify on public.follows;
create trigger follow_notify after insert on public.follows
  for each row execute function public.notify_new_follower();

-- 조회수 마일스톤: 10/50/100/500/1000에 도달하면 1회 알림
create or replace function public.notify_view_milestone(p_type text, p_id uuid, p_count int, p_author uuid, p_title text)
returns void language plpgsql security definer set search_path = public
as $$
declare v_milestones int[] := array[10, 50, 100, 500, 1000];
begin
  if p_author is null then return; end if;
  if p_count = any(v_milestones) then
    perform public.send_notification(
      p_author, 'view_milestone',
      '🎉 조회수 ' || p_count || '회 돌파!',
      '"' || coalesce(p_title, '') || '" 글이 사랑받고 있어요',
      case p_type
        when 'guide'     then '/guides/' || p_id::text
        when 'community' then '/community/' || p_id::text
        when 'rescue'    then '/rescue/' || p_id::text
      end
    );
  end if;
end; $$;

-- bump_view에 마일스톤 훅 추가 (replace 한 번 더)
create or replace function public.bump_view(p_type text, p_id uuid)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_recent boolean := false;
  v_count int;
  v_author uuid;
  v_title text;
begin
  if v_user is not null then
    select exists(
      select 1 from public.read_marks
      where user_id = v_user and target_type = p_type and target_id = p_id
        and read_at > now() - interval '24 hours'
    ) into v_recent;
    insert into public.read_marks (user_id, target_type, target_id, read_at)
    values (v_user, p_type, p_id, now())
    on conflict (user_id, target_type, target_id) do update set read_at = now();
  end if;

  if v_recent then
    if     p_type = 'guide'     then select view_count into v_count from public.guides          where id = p_id;
    elsif  p_type = 'community' then select view_count into v_count from public.community_posts where id = p_id;
    elsif  p_type = 'rescue'    then select view_count into v_count from public.rescue_posts    where id = p_id;
    end if;
    return coalesce(v_count, 0);
  end if;

  if p_type = 'guide' then
    update public.guides set view_count = view_count + 1 where id = p_id
      returning view_count, author_id, title into v_count, v_author, v_title;
  elsif p_type = 'community' then
    update public.community_posts set view_count = view_count + 1 where id = p_id
      returning view_count, author_id, title into v_count, v_author, v_title;
  elsif p_type = 'rescue' then
    update public.rescue_posts set view_count = view_count + 1 where id = p_id
      returning view_count, author_id, title into v_count, v_author, v_title;
  end if;

  perform public.notify_view_milestone(p_type, p_id, coalesce(v_count, 0), v_author, v_title);
  return coalesce(v_count, 0);
end;
$$;

-- 알림 카운트 RPC (헤더 뱃지용)
create or replace function public.notif_unread_count()
returns int language sql stable security definer set search_path = public
as $$
  select coalesce(count(*)::int, 0) from public.notifications
  where user_id = auth.uid() and read_at is null;
$$;
grant execute on function public.notif_unread_count() to authenticated;

-- 모두 읽음 처리 RPC
create or replace function public.mark_all_notifications_read()
returns void language sql security definer set search_path = public
as $$
  update public.notifications set read_at = now()
  where user_id = auth.uid() and read_at is null;
$$;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- ──────────────────────────────────────────────────────────────
-- 4. 콘텐츠 제보 (도감/가이드 정보 수정 요청)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.content_corrections (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid references public.profiles(id) on delete set null,
  reporter_name text,
  target_type   text not null check (target_type in ('species','guide','announcement')),
  target_id     uuid,         -- species 등 참조
  target_slug   text,         -- species slug 직접 참조 가능
  field         text,         -- 'description','care_tips','size_cm' 등
  current_text  text,
  suggested     text not null,
  reason        text,
  status        text not null default 'open' check (status in ('open','accepted','rejected')),
  created_at    timestamptz not null default now()
);
create index content_corrections_target_idx on public.content_corrections (target_type, status, created_at desc);

alter table public.content_corrections enable row level security;
create policy "content_corrections insert anyone" on public.content_corrections
  for insert with check (true);
create policy "content_corrections read by admin" on public.content_corrections
  for select using (public.is_admin());
create policy "content_corrections update by admin" on public.content_corrections
  for update using (public.is_admin()) with check (public.is_admin());
create policy "content_corrections delete by admin" on public.content_corrections
  for delete using (public.is_admin());
