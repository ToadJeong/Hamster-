-- 0003: 익명 게시(비밀번호로 본인 확인) + 사이트 공지/문구 설정

create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- 1. guides·comments에 익명 필드 추가
--    - author_id가 NULL이면 익명 게시물
--    - anonymous_nickname: 표시 이름
--    - anonymous_password_hash: 본인 확인용 (bcrypt, crypt() + gen_salt('bf'))
-- ──────────────────────────────────────────────────────────────
alter table public.guides
  alter column author_id drop not null,
  add column if not exists anonymous_nickname text,
  add column if not exists anonymous_password_hash text;

alter table public.comments
  alter column author_id drop not null,
  add column if not exists anonymous_nickname text,
  add column if not exists anonymous_password_hash text;

-- 둘 다 익명이거나 둘 다 로그인이어야 함
alter table public.guides
  add constraint guides_author_or_anon check (
    (author_id is not null and anonymous_nickname is null and anonymous_password_hash is null)
    or
    (author_id is null and anonymous_nickname is not null and anonymous_password_hash is not null)
  );

alter table public.comments
  add constraint comments_author_or_anon check (
    (author_id is not null and anonymous_nickname is null and anonymous_password_hash is null)
    or
    (author_id is null and anonymous_nickname is not null and anonymous_password_hash is not null)
  );

-- 뷰 재정의: 익명 작성자 표시 우선
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

-- ──────────────────────────────────────────────────────────────
-- 2. RLS: INSERT는 익명/회원 모두 허용, UPDATE·DELETE는 회원 본인만(클라이언트 정책)
--    익명 글의 수정/삭제는 아래의 RPC를 통해서만 수행됨
-- ──────────────────────────────────────────────────────────────
drop policy if exists "authenticated users can insert guides"   on public.guides;
drop policy if exists "authenticated users can insert comments" on public.comments;

-- 익명 또는 본인 author_id로만 insert 가능
create policy "anyone can insert guides (anon or own)"
  on public.guides for insert
  with check (
    (author_id is null and anonymous_nickname is not null and anonymous_password_hash is not null)
    or
    (auth.uid() is not null and auth.uid() = author_id)
  );

create policy "anyone can insert comments (anon or own)"
  on public.comments for insert
  with check (
    (author_id is null and anonymous_nickname is not null and anonymous_password_hash is not null)
    or
    (auth.uid() is not null and auth.uid() = author_id)
  );

-- 익명 글/댓글은 비밀번호 컬럼을 응답에 노출하면 안 됨
-- (RLS는 row 단위만 막을 수 있어 컬럼 노출은 GRANT로 통제)
revoke select (anonymous_password_hash) on public.guides   from anon, authenticated;
revoke select (anonymous_password_hash) on public.comments from anon, authenticated;

-- ──────────────────────────────────────────────────────────────
-- 3. RPC: 익명 글/댓글 작성·수정·삭제 (비밀번호 검증)
--    클라이언트는 평문 비밀번호를 한 번만 전송하고, 서버에서 bcrypt 해싱한다.
-- ──────────────────────────────────────────────────────────────
create or replace function public.insert_anonymous_guide(
  p_nickname text,
  p_password text,
  p_title text,
  p_body text,
  p_species_id uuid,
  p_cover_url text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allow boolean;
  v_id uuid;
begin
  select coalesce((select value::text::boolean
                     from public.site_settings
                    where key = 'app.allow_anonymous'), true)
    into v_allow;
  if not v_allow then
    raise exception 'anonymous posting disabled';
  end if;
  if char_length(coalesce(p_nickname,'')) < 1 then raise exception 'nickname required'; end if;
  if char_length(coalesce(p_password,'')) < 4 then raise exception 'password too short'; end if;
  if char_length(coalesce(p_title,'')) < 1 then raise exception 'title required'; end if;
  if char_length(coalesce(p_body,''))  < 1 then raise exception 'body required'; end if;

  insert into public.guides
    (author_id, anonymous_nickname, anonymous_password_hash,
     species_id, title, body, cover_url)
  values
    (null, p_nickname, crypt(p_password, gen_salt('bf', 8)),
     p_species_id, p_title, p_body, p_cover_url)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.insert_anonymous_comment(
  p_guide_id uuid,
  p_nickname text,
  p_password text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allow boolean;
  v_id uuid;
begin
  select coalesce((select value::text::boolean
                     from public.site_settings
                    where key = 'app.allow_anonymous'), true)
    into v_allow;
  if not v_allow then
    raise exception 'anonymous posting disabled';
  end if;
  if char_length(coalesce(p_nickname,'')) < 1 then raise exception 'nickname required'; end if;
  if char_length(coalesce(p_password,'')) < 4 then raise exception 'password too short'; end if;
  if char_length(coalesce(p_body,''))    < 1 then raise exception 'body required'; end if;

  insert into public.comments
    (guide_id, author_id, anonymous_nickname, anonymous_password_hash, body)
  values
    (p_guide_id, null, p_nickname, crypt(p_password, gen_salt('bf', 8)), p_body)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.delete_anonymous_guide(p_guide_id uuid, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  select anonymous_password_hash into v_hash from public.guides where id = p_guide_id and author_id is null;
  if v_hash is null then return false; end if;
  if v_hash <> crypt(p_password, v_hash) then return false; end if;
  delete from public.guides where id = p_guide_id;
  return true;
end;
$$;

create or replace function public.update_anonymous_guide(
  p_guide_id uuid,
  p_password text,
  p_title text,
  p_body text,
  p_species_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  select anonymous_password_hash into v_hash from public.guides where id = p_guide_id and author_id is null;
  if v_hash is null then return false; end if;
  if v_hash <> crypt(p_password, v_hash) then return false; end if;
  update public.guides
     set title = p_title,
         body  = p_body,
         species_id = p_species_id,
         updated_at = now()
   where id = p_guide_id;
  return true;
end;
$$;

create or replace function public.delete_anonymous_comment(p_comment_id uuid, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  select anonymous_password_hash into v_hash from public.comments where id = p_comment_id and author_id is null;
  if v_hash is null then return false; end if;
  if v_hash <> crypt(p_password, v_hash) then return false; end if;
  delete from public.comments where id = p_comment_id;
  return true;
end;
$$;

-- 비밀번호를 받는 함수는 anon 키로도 호출 가능해야 함 (이미 security definer)
grant execute on function
  public.insert_anonymous_guide(text, text, text, text, uuid, text),
  public.insert_anonymous_comment(uuid, text, text, text),
  public.delete_anonymous_guide(uuid, text),
  public.update_anonymous_guide(uuid, text, text, text, uuid),
  public.delete_anonymous_comment(uuid, text)
to anon, authenticated;

-- ──────────────────────────────────────────────────────────────
-- 4. 사이트 설정 키 확장 (코드에 박지 않고 운영 중 변경 가능)
-- ──────────────────────────────────────────────────────────────
insert into public.site_settings (key, value) values
  ('site.notice',           '""'::jsonb),
  ('site.contact_email',    '""'::jsonb),
  ('legal.privacy_html',    '""'::jsonb),
  ('legal.terms_html',      '""'::jsonb),
  ('legal.deletion_html',   '""'::jsonb),
  ('app.allow_anonymous',   'true'::jsonb)
on conflict (key) do nothing;
