-- ⚙️ 자동 배포 전 "최초 1회"만 실행하세요. (Supabase SQL Editor)
--
-- 지금까지 마이그레이션을 SQL Editor로 직접 실행하셨기 때문에
-- Supabase의 마이그레이션 기록 테이블에는 "적용됨" 표시가 없습니다.
-- 이 스크립트는 0001~0010을 "이미 적용됨"으로 등록해, 앞으로
-- GitHub Action(supabase db push)이 이들을 다시 실행하지 않고
-- 새 마이그레이션만 적용하도록 만들어 줍니다.
--
-- 여러 번 실행해도 안전합니다.

create schema if not exists supabase_migrations;

create table if not exists supabase_migrations.schema_migrations (
  version    text primary key,
  statements text[],
  name       text
);

insert into supabase_migrations.schema_migrations (version, name) values
  ('0001', 'initial_schema'),
  ('0002', 'admin_and_settings'),
  ('0003', 'anonymous_posting'),
  ('0004', 'chat_and_pets'),
  ('0005', 'announcements_community_rescue'),
  ('0006', 'dm_follow_tags_chat_history'),
  ('0007', 'uploads_reports_notifications'),
  ('0008', 'admin_test_accounts_anon_delete'),
  ('0009', 'read_notify_views_corrections'),
  ('0010', 'enable_realtime')
on conflict (version) do nothing;

-- 확인
select version, name from supabase_migrations.schema_migrations order by version;
