-- 0022_rescue_system.sql
-- 유기햄 구조대 체계화
--   1) 다중 사진 갤러리 + 긴급/마감(타임어택)
--   2) 구조 글 댓글 (회원 전용 — 신뢰 이슈로 익명 금지)
--   3) 역할 슬롯(서류입양/단기임보/이동봉사/장기임보/평생입양) + 지원/수락
--      지원·수락은 RPC(SECURITY DEFINER)로만 처리해 알림을 보장한다.

-- ──────────────────────────────────────────────────────────────
-- 1. rescue_posts 확장
-- ──────────────────────────────────────────────────────────────
alter table public.rescue_posts
  add column if not exists images   text[] not null default '{}',
  add column if not exists urgent   boolean not null default false,
  add column if not exists deadline timestamptz;

-- 새 컬럼이 뷰에 반영되도록 재생성 (security_invoker 유지)
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
-- 2. 구조 글 댓글
-- ──────────────────────────────────────────────────────────────
create table if not exists public.rescue_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.rescue_posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists rescue_comments_post_idx on public.rescue_comments (post_id, created_at);
alter table public.rescue_comments enable row level security;
create policy "rescue_comments readable" on public.rescue_comments for select using (true);
create policy "rescue_comments insert" on public.rescue_comments
  for insert with check (auth.uid() = author_id);
create policy "rescue_comments delete" on public.rescue_comments
  for delete using (auth.uid() = author_id or public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 3. 역할 슬롯
-- ──────────────────────────────────────────────────────────────
create table if not exists public.rescue_roles (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.rescue_posts(id) on delete cascade,
  role_type   text not null check (role_type in
                ('paper_adopter','short_foster','transporter','long_foster','forever_adopter')),
  status      text not null default 'open' check (status in ('open','filled')),
  assignee_id uuid references public.profiles(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now(),
  unique (post_id, role_type)
);
create index if not exists rescue_roles_post_idx on public.rescue_roles (post_id);
alter table public.rescue_roles enable row level security;

create policy "rescue_roles readable" on public.rescue_roles for select using (true);
create policy "rescue_roles insert by author" on public.rescue_roles
  for insert with check (
    public.is_admin() or auth.uid() = (select author_id from public.rescue_posts where id = post_id)
  );
create policy "rescue_roles update by author" on public.rescue_roles
  for update using (
    public.is_admin() or auth.uid() = (select author_id from public.rescue_posts where id = post_id)
  );
create policy "rescue_roles delete by author" on public.rescue_roles
  for delete using (
    public.is_admin() or auth.uid() = (select author_id from public.rescue_posts where id = post_id)
  );

-- ──────────────────────────────────────────────────────────────
-- 4. 역할 지원 (insert/update 는 RPC 로만 → 직접 정책 없음)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.rescue_role_applications (
  id           uuid primary key default gen_random_uuid(),
  role_id      uuid not null references public.rescue_roles(id) on delete cascade,
  post_id      uuid not null references public.rescue_posts(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  message      text,
  status       text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at   timestamptz not null default now(),
  unique (role_id, applicant_id)
);
create index if not exists rescue_apps_post_idx on public.rescue_role_applications (post_id);
create index if not exists rescue_apps_role_idx on public.rescue_role_applications (role_id);
alter table public.rescue_role_applications enable row level security;

-- 신청자 본인 / 글 작성자 / 관리자만 열람
create policy "rescue_apps readable" on public.rescue_role_applications
  for select using (
    public.is_admin()
    or auth.uid() = applicant_id
    or auth.uid() = (select author_id from public.rescue_posts where id = post_id)
  );
-- 신청자 본인 철회만 직접 허용 (생성/수락은 RPC)
create policy "rescue_apps delete by applicant" on public.rescue_role_applications
  for delete using (auth.uid() = applicant_id or public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 5. RPC: 역할 지원 (+작성자 알림)
-- ──────────────────────────────────────────────────────────────
create or replace function public.apply_rescue_role(p_role_id uuid, p_message text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_post uuid; v_author uuid; v_app uuid;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select rr.post_id, rp.author_id into v_post, v_author
    from public.rescue_roles rr join public.rescue_posts rp on rp.id = rr.post_id
   where rr.id = p_role_id;
  if v_post is null then raise exception 'role not found'; end if;
  if v_author = auth.uid() then raise exception 'cannot apply to own post'; end if;

  insert into public.rescue_role_applications (role_id, post_id, applicant_id, message)
  values (p_role_id, v_post, auth.uid(), nullif(btrim(coalesce(p_message,'')), ''))
  on conflict (role_id, applicant_id)
    do update set message = excluded.message, status = 'pending', created_at = now()
  returning id into v_app;

  perform public.send_notification(
    v_author, 'rescue_apply', '구조 역할 지원이 도착했어요',
    '내 구조 글에 도움을 주겠다는 지원이 도착했어요.', '/rescue/' || v_post::text);
  return v_app;
end $$;
grant execute on function public.apply_rescue_role(uuid, text) to authenticated;

-- ──────────────────────────────────────────────────────────────
-- 6. RPC: 지원 수락 (작성자/관리자) — 역할 충원 + 신청자 알림
-- ──────────────────────────────────────────────────────────────
create or replace function public.accept_rescue_application(p_app_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_post uuid; v_author uuid; v_role uuid; v_applicant uuid;
begin
  select a.post_id, a.role_id, a.applicant_id, rp.author_id
    into v_post, v_role, v_applicant, v_author
    from public.rescue_role_applications a join public.rescue_posts rp on rp.id = a.post_id
   where a.id = p_app_id;
  if v_post is null then raise exception 'application not found'; end if;
  if v_author <> auth.uid() and not public.is_admin() then raise exception 'not allowed'; end if;

  update public.rescue_roles set status = 'filled', assignee_id = v_applicant where id = v_role;
  update public.rescue_role_applications set status = 'accepted' where id = p_app_id;
  update public.rescue_role_applications set status = 'rejected'
    where role_id = v_role and id <> p_app_id and status = 'pending';

  perform public.send_notification(
    v_applicant, 'rescue_accept', '구조 역할이 확정됐어요',
    '지원하신 구조 역할을 작성자가 수락했어요. 함께 햄찌를 구해주세요! 🐹', '/rescue/' || v_post::text);
end $$;
grant execute on function public.accept_rescue_application(uuid) to authenticated;

-- ──────────────────────────────────────────────────────────────
-- 7. 역할 슬롯을 다시 열기 (작성자/관리자) — 담당자 해제
-- ──────────────────────────────────────────────────────────────
create or replace function public.reopen_rescue_role(p_role_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  select rp.author_id into v_author
    from public.rescue_roles rr join public.rescue_posts rp on rp.id = rr.post_id
   where rr.id = p_role_id;
  if v_author is null then raise exception 'role not found'; end if;
  if v_author <> auth.uid() and not public.is_admin() then raise exception 'not allowed'; end if;
  update public.rescue_roles set status = 'open', assignee_id = null where id = p_role_id;
  update public.rescue_role_applications set status = 'pending'
    where role_id = p_role_id and status = 'accepted';
end $$;
grant execute on function public.reopen_rescue_role(uuid) to authenticated;
