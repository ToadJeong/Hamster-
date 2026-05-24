-- 0010: 실시간(Realtime) 발행 대상 테이블 등록
-- DM 메시지와 알림이 즉시 화면에 반영되도록 supabase_realtime 퍼블리케이션에 추가한다.
-- (이미 등록돼 있으면 무시)

do $$
begin
  begin
    alter publication supabase_realtime add table public.dm_messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end $$;
