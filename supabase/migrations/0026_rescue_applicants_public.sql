-- 0026_rescue_applicants_public.sql
-- 구조 역할의 "누가 지원했는지/누가 맡고 있는지"를 모두가 볼 수 있도록
-- 지원자 이름/아바타만 공개하는 뷰 (지원 메시지는 제외 — 작성자만 원본 테이블에서 봄).
-- definer 뷰로 RLS 를 우회해 공개 읽기를 허용한다.

create or replace view public.rescue_applicants_public as
select
  a.role_id,
  a.post_id,
  a.applicant_id,
  a.status,
  p.username   as applicant_username,
  p.avatar_url as applicant_avatar_url
from public.rescue_role_applications a
join public.profiles p on p.id = a.applicant_id;

grant select on public.rescue_applicants_public to anon, authenticated;
