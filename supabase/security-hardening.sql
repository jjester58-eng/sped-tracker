-- SPED Tracker security hardening
-- REVIEW BEFORE RUNNING. This file is intentionally not applied automatically.
-- Replace the email below with the owner/admin email before running it.
-- It assumes the core tables described in ../supabase.sql already exist.

begin;

create table if not exists public.sped_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'case_manager', 'data_entry', 'viewer')),
  created_at timestamptz not null default now()
);

revoke all on table public.sped_user_roles from anon, authenticated;
alter table public.sped_user_roles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sped_user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Add the administrator account. Edit this value first.
insert into public.sped_user_roles (user_id, role)
select id, 'admin'
from auth.users
where lower(email) = lower('REPLACE_WITH_ADMIN_EMAIL@example.com')
on conflict (user_id) do update set role = excluded.role;

create or replace function public.can_access_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.sped_user_roles r
      join public.data_entry_people p on lower(p.email) = lower((select email from auth.users where id = auth.uid()))
      join public.data_entry_assignments a on a.person_id = p.id
      where r.user_id = auth.uid()
        and r.role in ('case_manager', 'data_entry', 'viewer')
        and a.student_id = target_student_id
    )
    or exists (
      select 1
      from public.sped_user_roles r
      join public.case_managers cm on lower(cm.email) = lower((select email from auth.users where id = auth.uid()))
      join public.data_entry_assignments a on a.case_manager_id = cm.id
      where r.user_id = auth.uid()
        and r.role in ('case_manager', 'data_entry', 'viewer')
        and a.student_id = target_student_id
    );
$$;

revoke all on function public.can_access_student(uuid) from public;
grant execute on function public.can_access_student(uuid) to authenticated;

-- No anonymous access to student or progress data. Named policies are dropped
-- and recreated so this script is safe to re-run after review.

 alter table public.students enable row level security;
 alter table public.goals enable row level security;
 alter table public.weekly_progress enable row level security;
 alter table public.data_entry_assignments enable row level security;
 alter table public.data_entry_people enable row level security;
 alter table public.case_managers enable row level security;
 alter table public.classes enable row level security;

drop policy if exists "sped students select assigned" on public.students;
create policy "sped students select assigned" on public.students
  for select to authenticated using (public.can_access_student(id));
drop policy if exists "sped students admin write" on public.students;
create policy "sped students admin write" on public.students
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sped goals select assigned" on public.goals;
create policy "sped goals select assigned" on public.goals
  for select to authenticated using (public.can_access_student(student_id));
drop policy if exists "sped goals admin write" on public.goals;
create policy "sped goals admin write" on public.goals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sped progress select assigned" on public.weekly_progress;
create policy "sped progress select assigned" on public.weekly_progress
  for select to authenticated using (public.can_access_student(student_id));
drop policy if exists "sped progress assigned insert" on public.weekly_progress;
create policy "sped progress assigned insert" on public.weekly_progress
  for insert to authenticated with check (public.can_access_student(student_id));
drop policy if exists "sped progress admin update delete" on public.weekly_progress;
create policy "sped progress admin update delete" on public.weekly_progress
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sped assignments own read" on public.data_entry_assignments;
create policy "sped assignments own read" on public.data_entry_assignments
  for select to authenticated using (public.is_admin() or exists (select 1 from public.sped_user_roles r where r.user_id = auth.uid() and r.role in ('case_manager','data_entry','viewer')));
drop policy if exists "sped assignments admin write" on public.data_entry_assignments;
create policy "sped assignments admin write" on public.data_entry_assignments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sped lookups authenticated read" on public.data_entry_people;
create policy "sped lookups authenticated read" on public.data_entry_people
  for select to authenticated using (public.is_admin() or lower(email) = lower((select email from auth.users where id = auth.uid())));
drop policy if exists "sped data entry admin write" on public.data_entry_people;
create policy "sped data entry admin write" on public.data_entry_people
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sped case managers authenticated read" on public.case_managers;
create policy "sped case managers authenticated read" on public.case_managers
  for select to authenticated using (public.is_admin() or lower(email) = lower((select email from auth.users where id = auth.uid())));
drop policy if exists "sped case managers admin write" on public.case_managers;
create policy "sped case managers admin write" on public.case_managers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sped classes authenticated read" on public.classes;
create policy "sped classes authenticated read" on public.classes
  for select to authenticated using (public.is_admin() or exists (select 1 from public.sped_user_roles where user_id = auth.uid()));
drop policy if exists "sped classes admin write" on public.classes;
create policy "sped classes admin write" on public.classes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

commit;
