-- 0025_images_and_hide.sql
--   커뮤니티/가이드 다중 사진(images), 추모 숨김(hidden)

alter table public.community_posts add column if not exists images text[] not null default '{}';
alter table public.guides          add column if not exists images text[] not null default '{}';
alter table public.memorials       add column if not exists hidden boolean not null default false;

-- memorials_feed 뷰에 hidden 컬럼이 보이도록 재생성
drop view if exists public.memorials_feed;
create view public.memorials_feed with (security_invoker = on) as
select
  m.*,
  p.username as owner_username,
  (select count(*) from public.memorial_tributes t where t.memorial_id = m.id) as tribute_count,
  (select count(*) from public.memorial_comments c where c.memorial_id = m.id) as comment_count
from public.memorials m
left join public.profiles p on p.id = m.owner_id;
