-- 0018: 0009/0010이 baseline에 "적용됨"으로 표시됐지만 실제 실행되지 않은 환경 backfill
-- 읽음표시(read_marks) · 알림(notifications) · 조회수 RPC · 콘텐츠 제보 · 실시간 발행을 보장.
-- 전부 idempotent (if not exists / create or replace / drop policy if exists).

-- view_count (0013에서 이미 보장하지만 재확인)
alter table public.guides          add column if not exists view_count int not null default 0;
alter table public.community_posts add column if not exists view_count int not null default 0;
alter table public.rescue_posts    add column if not exists view_count int not null default 0;

-- ── 읽음 마크 ───────────────────────────────────────────────────
create table if not exists public.read_marks (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('guide','community','rescue','announcement')),
  target_id   uuid not null,
  read_at     timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index if not exists read_marks_user_idx on public.read_marks (user_id, read_at desc);
alter table public.read_marks enable row level security;
drop policy if exists "read_marks self" on public.read_marks;
create policy "read_marks self" on public.read_marks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 알림 ────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "notifications self read"      on public.notifications;
drop policy if exists "notifications self mark read" on public.notifications;
drop policy if exists "notifications self delete"    on public.notifications;
create policy "notifications self read"      on public.notifications for select using (auth.uid() = user_id);
create policy "notifications self mark read" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications self delete"    on public.notifications for delete using (auth.uid() = user_id);

create or replace function public.send_notification(p_user uuid, p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select p_user, p_kind, p_title, p_body, p_link where p_user is not null;
$$;

create or replace function public.notif_unread_count()
returns int language sql stable security definer set search_path = public as $$
  select coalesce(count(*)::int,0) from public.notifications where user_id = auth.uid() and read_at is null;
$$;
grant execute on function public.notif_unread_count() to authenticated;

create or replace function public.mark_all_notifications_read()
returns void language sql security definer set search_path = public as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null;
$$;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- 조회수 + 마일스톤 알림 RPC
create or replace function public.notify_view_milestone(p_type text, p_id uuid, p_count int, p_author uuid, p_title text)
returns void language plpgsql security definer set search_path = public as $$
declare v_m int[] := array[10,50,100,500,1000];
begin
  if p_author is null then return; end if;
  if p_count = any(v_m) then
    perform public.send_notification(p_author,'view_milestone','🎉 조회수 '||p_count||'회 돌파!',
      '"'||coalesce(p_title,'')||'" 글이 사랑받고 있어요',
      case p_type when 'guide' then '/guides/'||p_id::text when 'community' then '/community/'||p_id::text else '/rescue/'||p_id::text end);
  end if;
end; $$;

create or replace function public.bump_view(p_type text, p_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_recent boolean := false; v_count int; v_author uuid; v_title text;
begin
  if v_user is not null then
    select exists(select 1 from public.read_marks where user_id=v_user and target_type=p_type and target_id=p_id and read_at > now() - interval '24 hours') into v_recent;
    insert into public.read_marks (user_id,target_type,target_id,read_at) values (v_user,p_type,p_id,now())
      on conflict (user_id,target_type,target_id) do update set read_at = now();
  end if;
  if v_recent then
    if p_type='guide' then select view_count into v_count from public.guides where id=p_id;
    elsif p_type='community' then select view_count into v_count from public.community_posts where id=p_id;
    elsif p_type='rescue' then select view_count into v_count from public.rescue_posts where id=p_id; end if;
    return coalesce(v_count,0);
  end if;
  if p_type='guide' then update public.guides set view_count=view_count+1 where id=p_id returning view_count,author_id,title into v_count,v_author,v_title;
  elsif p_type='community' then update public.community_posts set view_count=view_count+1 where id=p_id returning view_count,author_id,title into v_count,v_author,v_title;
  elsif p_type='rescue' then update public.rescue_posts set view_count=view_count+1 where id=p_id returning view_count,author_id,title into v_count,v_author,v_title; end if;
  perform public.notify_view_milestone(p_type,p_id,coalesce(v_count,0),v_author,v_title);
  return coalesce(v_count,0);
end; $$;
grant execute on function public.bump_view(text, uuid) to anon, authenticated;

-- 댓글/좋아요/팔로우 알림 트리거 (0009 내용 재생성)
create or replace function public.notify_community_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_who text;
begin
  select author_id into v_author from public.community_posts where id = new.post_id;
  if v_author is null or v_author = new.author_id then return new; end if;
  select coalesce(username, new.anonymous_nickname, '익명') into v_who from public.profiles where id = new.author_id;
  perform public.send_notification(v_author,'new_comment','내 글에 댓글이 달렸어요', coalesce(v_who,'익명')||'님: '||left(new.body,60), '/community/'||new.post_id::text);
  return new;
end; $$;
drop trigger if exists community_comment_notify on public.community_comments;
create trigger community_comment_notify after insert on public.community_comments for each row execute function public.notify_community_comment();

create or replace function public.notify_guide_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_who text;
begin
  select author_id into v_author from public.guides where id = new.guide_id;
  if v_author is null or v_author = new.author_id then return new; end if;
  select coalesce(username, new.anonymous_nickname, '익명') into v_who from public.profiles where id = new.author_id;
  perform public.send_notification(v_author,'new_comment','내 가이드에 댓글이 달렸어요', coalesce(v_who,'익명')||'님: '||left(new.body,60), '/guides/'||new.guide_id::text);
  return new;
end; $$;
drop trigger if exists guide_comment_notify on public.comments;
create trigger guide_comment_notify after insert on public.comments for each row execute function public.notify_guide_comment();

create or replace function public.notify_new_follower()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_who text;
begin
  select username into v_who from public.profiles where id = new.follower_id;
  perform public.send_notification(new.followee_id,'new_follower','새 팔로워가 생겼어요', coalesce(v_who,'햄집사')||'님이 나를 팔로우해요','/profile');
  return new;
end; $$;
drop trigger if exists follow_notify on public.follows;
create trigger follow_notify after insert on public.follows for each row execute function public.notify_new_follower();

-- ── 콘텐츠 제보 ─────────────────────────────────────────────────
create table if not exists public.content_corrections (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  reporter_name text, target_type text not null, target_id uuid, target_slug text,
  field text, current_text text, suggested text not null, reason text,
  status text not null default 'open', created_at timestamptz not null default now()
);
alter table public.content_corrections enable row level security;
drop policy if exists "content_corrections insert anyone" on public.content_corrections;
drop policy if exists "content_corrections read by admin" on public.content_corrections;
drop policy if exists "content_corrections update by admin" on public.content_corrections;
drop policy if exists "content_corrections delete by admin" on public.content_corrections;
create policy "content_corrections insert anyone" on public.content_corrections for insert with check (true);
create policy "content_corrections read by admin"  on public.content_corrections for select using (public.is_admin());
create policy "content_corrections update by admin" on public.content_corrections for update using (public.is_admin()) with check (public.is_admin());
create policy "content_corrections delete by admin" on public.content_corrections for delete using (public.is_admin());

-- ── 실시간 발행 (0010 내용) ─────────────────────────────────────
do $$
begin
  begin alter publication supabase_realtime add table public.dm_messages; exception when others then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when others then null; end;
end $$;
