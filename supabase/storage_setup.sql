-- 스토리지 버킷 + 업로드 정책 (Supabase SQL Editor에서 1회 실행)
--
-- 왜 SQL Editor인가:
--   storage.objects 는 supabase_storage_admin 소유라, CLI(postgres) 권한으로는
--   정책 생성이 막힌다. SQL Editor는 상위 권한으로 실행되므로 여기서 만든다.
-- 여러 번 실행해도 안전 (drop if exists + create).

-- 1) 버킷 (공개 읽기)
insert into storage.buckets (id, name, public) values
  ('species-images','species-images',true),
  ('guide-covers','guide-covers',true),
  ('avatars','avatars',true),
  ('community-images','community-images',true),
  ('rescue-images','rescue-images',true),
  ('announcement-images','announcement-images',true),
  ('product-images','product-images',true)
on conflict (id) do nothing;

-- 2) 공통: 본인 UID 폴더에만 업로드/삭제 가능한 버킷들
do $$
declare b text;
begin
  foreach b in array array['avatars','guide-covers','community-images','rescue-images','product-images']
  loop
    execute format('drop policy if exists %I on storage.objects', b||' read');
    execute format('drop policy if exists %I on storage.objects', b||' write');
    execute format('drop policy if exists %I on storage.objects', b||' delete');
    execute format($f$create policy %I on storage.objects for select using (bucket_id=%L)$f$, b||' read', b);
    execute format($f$create policy %I on storage.objects for insert with check (bucket_id=%L and auth.uid()::text=(storage.foldername(name))[1])$f$, b||' write', b);
    execute format($f$create policy %I on storage.objects for delete using (bucket_id=%L and auth.uid()::text=(storage.foldername(name))[1])$f$, b||' delete', b);
  end loop;
end $$;

-- 3) 관리자 전용 쓰기 버킷 (species-images, announcement-images)
do $$
declare b text;
begin
  foreach b in array array['species-images','announcement-images']
  loop
    execute format('drop policy if exists %I on storage.objects', b||' read');
    execute format('drop policy if exists %I on storage.objects', b||' write');
    execute format('drop policy if exists %I on storage.objects', b||' delete');
    execute format($f$create policy %I on storage.objects for select using (bucket_id=%L)$f$, b||' read', b);
    execute format($f$create policy %I on storage.objects for insert with check (bucket_id=%L and public.is_admin())$f$, b||' write', b);
    execute format($f$create policy %I on storage.objects for delete using (bucket_id=%L and public.is_admin())$f$, b||' delete', b);
  end loop;
end $$;

-- 확인: 버킷 목록
select id, public from storage.buckets order by id;
