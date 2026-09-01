-- SPED Tracker security hardening for the current Supabase schema
-- REVIEW BEFORE RUNNING. This script is not applied automatically.
-- It uses the existing admin_users, admins, user_id, classes, goals, and
-- data_entry_assignments columns discovered in the live database.
-- Run this as the Supabase project owner/admin after reviewing existing policies.

begin;

-- The app's admin login calls this function. Use the existing administrator tables.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and coalesce(au.active, true) = true
  )
  or exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- A student is accessible to an administrator, the assigned case manager,
-- or a data-entry person connected through the student's goal/class path.
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
    from public.students s
    join public.case_managers cm
      on lower(cm.name) = lower(s.case_manager)
    where s.id = target_student_id
      and cm.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.goals g
    join public.classes c on c.id = g.class_id
    left join public.data_entry_assignments a on a.class_id = c.id
    left join public.data_entry_people assigned_person
      on assigned_person.id = a.data_entry_person_id
    left join public.data_entry_people class_owner
      on class_owner.id = c.data_entry_person_id
    where g.student_id = target_student_id
      and coalesce(g.is_active, true) = true
      and coalesce(c.is_active, true) = true
      and coalesce(a.is_active, true) = true
      and (
        assigned_person.user_id = auth.uid()
        or class_owner.user_id = auth.uid()
      )
  )
  or exists (
    select 1
    from public.weekly_progress wp
    left join public.data_entry_people teacher_person
      on teacher_person.id = wp.teacher_id
    left join public.data_entry_people entered_person
      on entered_person.id = wp.entered_by_id
    where wp.student_id = target_student_id
      and (
        teacher_person.user_id = auth.uid()
        or entered_person.user_id = auth.uid()
      )
  )
  or exists (
    select 1
    from public.weekly_progress wp
    join public.case_managers cm on cm.id = wp.case_manager_id
    where wp.student_id = target_student_id
      and cm.user_id = auth.uid()
  );
$$;

revoke all on function public.can_access_student(uuid) from public;
grant execute on function public.can_access_student(uuid) to authenticated;

-- Remove anonymous table privileges. Existing authenticated policies should
-- still be reviewed because permissive policies combine with OR semantics.
revoke all on table public.students, public.goals, public.weekly_progress,
  public.data_entry_assignments, public.data_entry_people, public.case_managers,
  public.classes, public.class_periods, public.teachers,
  public.admin_users, public.admins from anon;

alter table public.students enable row level security;
alter table public.goals enable row level security;
alter table public.weekly_progress enable row level security;
alter table public.data_entry_assignments enable row level security;
alter table public.data_entry_people enable row level security;
alter table public.case_managers enable row level security;
alter table public.classes enable row level security;
alter table public.class_periods enable row level security;
alter table public.teachers enable row level security;
alter table public.admin_users enable row level security;
alter table public.admins enable row level security;

-- Students
 drop policy if exists "sped2 students select assigned" on public.students;
create policy "sped2 students select assigned" on public.students
  for select to authenticated
  using (public.can_access_student(id));
 drop policy if exists "sped2 students admin write" on public.students;
create policy "sped2 students admin write" on public.students
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Goals
 drop policy if exists "sped2 goals select assigned" on public.goals;
create policy "sped2 goals select assigned" on public.goals
  for select to authenticated
  using (public.can_access_student(student_id));
 drop policy if exists "sped2 goals admin write" on public.goals;
create policy "sped2 goals admin write" on public.goals
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Weekly progress
 drop policy if exists "sped2 progress select assigned" on public.weekly_progress;
create policy "sped2 progress select assigned" on public.weekly_progress
  for select to authenticated
  using (public.can_access_student(student_id));
 drop policy if exists "sped2 progress assigned insert" on public.weekly_progress;
create policy "sped2 progress assigned insert" on public.weekly_progress
  for insert to authenticated
  with check (public.can_access_student(student_id));
 drop policy if exists "sped2 progress admin update delete" on public.weekly_progress;
create policy "sped2 progress admin update delete" on public.weekly_progress
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Assignments: only the assigned data-entry person or an administrator can read.
 drop policy if exists "sped2 assignments own read" on public.data_entry_assignments;
create policy "sped2 assignments own read" on public.data_entry_assignments
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.data_entry_people p
      where p.id = data_entry_assignments.data_entry_person_id
        and p.user_id = auth.uid()
    )
  );
 drop policy if exists "sped2 assignments admin write" on public.data_entry_assignments;
create policy "sped2 assignments admin write" on public.data_entry_assignments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Staff and lookup data
 drop policy if exists "sped2 data people own read" on public.data_entry_people;
create policy "sped2 data people own read" on public.data_entry_people
  for select to authenticated
  using (public.is_admin() or user_id = auth.uid());
 drop policy if exists "sped2 data people admin write" on public.data_entry_people;
create policy "sped2 data people admin write" on public.data_entry_people
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

 drop policy if exists "sped2 case managers own read" on public.case_managers;
create policy "sped2 case managers own read" on public.case_managers
  for select to authenticated
  using (public.is_admin() or user_id = auth.uid());
 drop policy if exists "sped2 case managers admin write" on public.case_managers;
create policy "sped2 case managers admin write" on public.case_managers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

 drop policy if exists "sped2 teachers own read" on public.teachers;
create policy "sped2 teachers own read" on public.teachers
  for select to authenticated
  using (public.is_admin() or user_id = auth.uid());
 drop policy if exists "sped2 teachers admin write" on public.teachers;
create policy "sped2 teachers admin write" on public.teachers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

 drop policy if exists "sped2 classes assigned read" on public.classes;
create policy "sped2 classes assigned read" on public.classes
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.data_entry_people p
      where p.id = classes.data_entry_person_id
        and p.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.data_entry_assignments a
      join public.data_entry_people p on p.id = a.data_entry_person_id
      where a.class_id = classes.id
        and p.user_id = auth.uid()
    )
  );
 drop policy if exists "sped2 classes admin write" on public.classes;
create policy "sped2 classes admin write" on public.classes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Class periods contain schedule metadata, not student records.
 drop policy if exists "sped2 class periods authenticated read" on public.class_periods;
create policy "sped2 class periods authenticated read" on public.class_periods
  for select to authenticated
  using (true);
 drop policy if exists "sped2 class periods admin write" on public.class_periods;
create policy "sped2 class periods admin write" on public.class_periods
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Keep administrator membership private and administrator-managed.
 drop policy if exists "sped2 admin users admin only" on public.admin_users;
create policy "sped2 admin users admin only" on public.admin_users
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
 drop policy if exists "sped2 admins admin only" on public.admins;
create policy "sped2 admins admin only" on public.admins
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

commit;
