-- 1) 테이블 생성
create table if not exists public.medicine_inventory (
  id bigserial primary key,
  no integer not null,
  name text not null,
  code text not null,
  expiry_date date null,
  created_at timestamptz default now()
);

-- 2) 공개 조회 허용
alter table public.medicine_inventory enable row level security;

drop policy if exists "public_read_medicine" on public.medicine_inventory;
create policy "public_read_medicine"
on public.medicine_inventory
for select
to anon, authenticated
using (true);

-- 3) 익명 업데이트 허용(주의: 관리자 비밀번호는 프론트에서만 제어되므로 완전보안 아님)
-- 나중에 auth 로그인 기반으로 강화 권장
drop policy if exists "public_update_medicine" on public.medicine_inventory;
create policy "public_update_medicine"
on public.medicine_inventory
for update
to anon, authenticated
using (true)
with check (true);

-- 4) 익명 insert 허용(초기 적재 시 필요)
drop policy if exists "public_insert_medicine" on public.medicine_inventory;
create policy "public_insert_medicine"
on public.medicine_inventory
for insert
to anon, authenticated
with check (true);
