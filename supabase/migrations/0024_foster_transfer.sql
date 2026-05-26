-- 0024_foster_transfer.sql — 회원 간 임보(임시보호) 이관
--   원소유주(owner_id)는 유지하고, 현재 보호자(carer_id)를 옮기는 방식.
--   요청/수락/반환은 RPC(SECURITY DEFINER)로만 처리해 권한·알림을 보장한다.

alter table public.pets
  add column if not exists carer_id uuid references public.profiles(id) on delete set null,
  add column if not exists status   text not null default 'raising'
    check (status in ('raising', 'fostering'));

-- 기존 햄찌는 보호자 = 소유주
update public.pets set carer_id = owner_id where carer_id is null;
create index if not exists pets_carer_idx on public.pets (carer_id, created_at);

-- 임보 요청 기록
create table if not exists public.foster_transfers (
  id         uuid primary key default gen_random_uuid(),
  pet_id     uuid not null references public.pets(id) on delete cascade,
  from_user  uuid not null references public.profiles(id) on delete cascade,
  to_user    uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'pending'
              check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists foster_to_idx  on public.foster_transfers (to_user, status);
create index if not exists foster_pet_idx on public.foster_transfers (pet_id);
alter table public.foster_transfers enable row level security;
create policy "foster readable" on public.foster_transfers
  for select using (public.is_admin() or auth.uid() = from_user or auth.uid() = to_user);
create policy "foster delete by party" on public.foster_transfers
  for delete using (public.is_admin() or auth.uid() = from_user or auth.uid() = to_user);

-- 임보 보내기 요청 (현재 보호자만)
create or replace function public.request_foster(p_pet_id uuid, p_to_user uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_carer uuid; v_id uuid; v_name text;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select coalesce(carer_id, owner_id), name into v_carer, v_name from public.pets where id = p_pet_id;
  if v_carer is null then raise exception 'pet not found'; end if;
  if v_carer <> auth.uid() then raise exception 'only current carer can send'; end if;
  if p_to_user = auth.uid() then raise exception 'cannot send to self'; end if;

  update public.foster_transfers set status = 'cancelled' where pet_id = p_pet_id and status = 'pending';
  insert into public.foster_transfers (pet_id, from_user, to_user)
  values (p_pet_id, auth.uid(), p_to_user) returning id into v_id;

  perform public.send_notification(p_to_user, 'foster_request', '임보 요청이 도착했어요',
    '"' || v_name || '" 햄찌의 임시보호를 요청받았어요. 내 프로필에서 확인해 주세요.', '/profile');
  return v_id;
end $$;
grant execute on function public.request_foster(uuid, uuid) to authenticated;

-- 임보 수락 (수신자)
create or replace function public.accept_foster(p_transfer_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_pet uuid; v_to uuid; v_from uuid; v_name text;
begin
  select pet_id, to_user, from_user into v_pet, v_to, v_from
    from public.foster_transfers where id = p_transfer_id and status = 'pending';
  if v_pet is null then raise exception 'request not found'; end if;
  if v_to <> auth.uid() then raise exception 'not allowed'; end if;

  update public.pets set carer_id = v_to, status = 'fostering' where id = v_pet;
  update public.foster_transfers set status = 'accepted' where id = p_transfer_id;
  select name into v_name from public.pets where id = v_pet;
  perform public.send_notification(v_from, 'foster_accepted', '임보가 수락됐어요',
    '"' || v_name || '" 햄찌의 임시보호가 시작됐어요.', '/profile');
end $$;
grant execute on function public.accept_foster(uuid) to authenticated;

-- 돌려주기/회수 — 현재 보호자나 원소유주가 보호자를 원소유주로 복귀
create or replace function public.return_foster(p_pet_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_carer uuid; v_owner uuid; v_name text;
begin
  select coalesce(carer_id, owner_id), owner_id, name into v_carer, v_owner, v_name
    from public.pets where id = p_pet_id;
  if v_owner is null then raise exception 'pet not found'; end if;
  if auth.uid() <> v_carer and auth.uid() <> v_owner and not public.is_admin() then
    raise exception 'not allowed';
  end if;

  update public.pets set carer_id = v_owner, status = 'raising' where id = p_pet_id;
  update public.foster_transfers set status = 'cancelled' where pet_id = p_pet_id and status = 'accepted';

  if auth.uid() = v_carer and v_carer <> v_owner then
    perform public.send_notification(v_owner, 'foster_returned', '햄찌가 돌아왔어요',
      '"' || v_name || '" 햄찌가 원래 가족에게 돌아갔어요.', '/profile');
  end if;
end $$;
grant execute on function public.return_foster(uuid) to authenticated;
