-- 0013: Supabase Security Advisor 대응
--   (1) SECURITY DEFINER 뷰 → security_invoker 로 전환 + 비밀번호 해시 컬럼 제외(실제 유출 위험 차단)
--   (2) search_path 미설정 함수 보정

-- ──────────────────────────────────────────────────────────────
-- 0. 안전장치: 0009가 실제로 적용되지 않은 환경 대비
--    아래 뷰들이 참조하는 view_count 컬럼을 보장한다(없으면 추가).
-- ──────────────────────────────────────────────────────────────
alter table public.guides          add column if not exists view_count int not null default 0;
alter table public.community_posts add column if not exists view_count int not null default 0;
alter table public.rescue_posts    add column if not exists view_count int not null default 0;

-- ──────────────────────────────────────────────────────────────
-- 1. 뷰 재정의 (security_invoker = on, 민감 컬럼 제외)
--    guides / community_posts 의 anonymous_password_hash 는 절대 노출하지 않는다.
-- ──────────────────────────────────────────────────────────────
drop view if exists public.guides_with_counts;
create view public.guides_with_counts
with (security_invoker = on) as
select
  g.id, g.author_id, g.anonymous_nickname, g.species_id,
  g.title, g.body, g.cover_url, g.created_at, g.updated_at, g.view_count,
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
create view public.community_posts_feed
with (security_invoker = on) as
select
  c.id, c.author_id, c.anonymous_nickname, c.title, c.body,
  c.category, c.tags, c.cover_url, c.created_at, c.updated_at, c.view_count,
  p.username   as author_username,
  p.avatar_url as author_avatar_url,
  coalesce((select count(*) from public.community_likes l where l.post_id = c.id), 0) as like_count,
  coalesce((select count(*) from public.community_comments cm where cm.post_id = c.id), 0) as comment_count
from public.community_posts c
left join public.profiles p on p.id = c.author_id;

drop view if exists public.rescue_posts_with_author;
create view public.rescue_posts_with_author
with (security_invoker = on) as
select
  r.*,
  p.username   as author_username,
  p.avatar_url as author_avatar_url,
  s.slug       as species_slug,
  s.name_ko    as species_name_ko
from public.rescue_posts r
left join public.profiles p on p.id = r.author_id
left join public.species  s on s.id = r.species_id;

-- ──────────────────────────────────────────────────────────────
-- 2. 함수 search_path 보정 (search_path injection 예방)
-- ──────────────────────────────────────────────────────────────
do $$
begin
  begin alter function public.touch_updated_at() set search_path = public; exception when others then null; end;
  begin alter function public.get_recent_lobby(int) set search_path = public; exception when others then null; end;
  begin alter function public.touch_dm_thread() set search_path = public; exception when others then null; end;
end $$;
