-- 0017: 운영 감사 로그 (게시글/댓글/업로드/수정/신고/삭제 자동 기록)
-- 최고 관리자(is_admin = 마스터)만 열람 가능. 트리거로 자동 적재.

create table if not exists public.audit_logs (
  id           bigint generated always as identity primary key,
  actor_id     uuid references public.profiles(id) on delete set null,
  actor_label  text,
  action       text not null,          -- create | update | delete
  entity_type  text not null,          -- 테이블명
  entity_id    uuid,
  summary      text,
  created_at   timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx  on public.audit_logs (entity_type, created_at desc);

alter table public.audit_logs enable row level security;
drop policy if exists "audit read by master" on public.audit_logs;
create policy "audit read by master" on public.audit_logs
  for select using (public.is_admin());
-- 트리거(security definer)가 직접 insert 하므로 insert 정책은 불필요.

-- 한글 라벨 매핑용 (앱에서 처리하지만 참고)
-- entity_type: community_posts/community_comments/guides/comments/
--              rescue_posts/product_posts/announcements/post_reports/
--              content_corrections/chat_reports

create or replace function public.log_audit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_row jsonb;
  v_action text;
  v_id uuid;
  v_summary text;
  v_actor uuid := auth.uid();
  v_actor_label text;
begin
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old); v_action := 'delete';
  elsif tg_op = 'UPDATE' then
    v_row := to_jsonb(new); v_action := 'update';
    -- 조회수/타임스탬프만 바뀐 경우는 로그 남기지 않음(노이즈 방지)
    if (to_jsonb(new) - 'view_count' - 'updated_at') = (to_jsonb(old) - 'view_count' - 'updated_at') then
      return new;
    end if;
  else
    v_row := to_jsonb(new); v_action := 'create';
  end if;

  begin v_id := (v_row->>'id')::uuid; exception when others then v_id := null; end;

  v_summary := coalesce(
    v_row->>'title',
    v_row->>'suggested',
    v_row->>'reason',
    v_row->>'message_body',
    left(v_row->>'body', 50),
    v_row->>'word',
    ''
  );

  if v_actor is not null then
    select username into v_actor_label from public.profiles where id = v_actor;
  end if;
  v_actor_label := coalesce(
    v_actor_label,
    v_row->>'anonymous_nickname',
    v_row->>'reporter_label',
    v_row->>'sender_label',
    '비회원'
  );

  insert into public.audit_logs (actor_id, actor_label, action, entity_type, entity_id, summary)
  values (v_actor, v_actor_label, v_action, tg_table_name, v_id, left(v_summary, 200));

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

-- 대상 테이블에 트리거 부착
do $$
declare t text;
begin
  foreach t in array array[
    'community_posts','community_comments','guides','comments',
    'rescue_posts','product_posts','announcements',
    'post_reports','content_corrections','chat_reports'
  ]
  loop
    -- 테이블이 존재할 때만
    if exists (select 1 from information_schema.tables where table_schema='public' and table_name=t) then
      execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
      execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function public.log_audit()', t);
    end if;
  end loop;
end $$;
