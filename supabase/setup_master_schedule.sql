-- SPED Tracker shared master schedule + inclusion support
-- Run this script once in Supabase SQL Editor before using the connected schedule pages.

create table if not exists public.master_schedule_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  class_period_id uuid not null references public.class_periods(id) on delete restrict,
  entry_type text not null default 'teaching'
    check (entry_type in ('teaching','conference','plc','off')),
  course_name text,
  subject text,
  department text,
  room text,
  capacity integer check (capacity is null or capacity between 1 and 60),
  school_year text not null,
  needs_inclusion boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint master_schedule_entry_period_year_key unique (id, class_period_id, school_year),
  constraint master_schedule_teaching_fields_check check (
    entry_type <> 'teaching' or
    (nullif(trim(course_name), '') is not null and nullif(trim(room), '') is not null)
  )
);

create unique index if not exists master_schedule_teacher_period_year_active_idx
  on public.master_schedule_entries (teacher_id, class_period_id, school_year)
  where is_active;

create index if not exists master_schedule_period_year_idx
  on public.master_schedule_entries (class_period_id, school_year)
  where is_active;

create table if not exists public.inclusion_assignments (
  id uuid primary key default gen_random_uuid(),
  schedule_entry_id uuid not null,
  inclusion_teacher_id uuid not null references public.teachers(id) on delete restrict,
  class_period_id uuid not null,
  school_year text not null,
  created_at timestamptz not null default now(),
  constraint inclusion_assignments_section_period_year_fkey
    foreign key (schedule_entry_id, class_period_id, school_year)
    references public.master_schedule_entries (id, class_period_id, school_year)
    on delete cascade,
  constraint inclusion_teacher_period_year_unique
    unique (inclusion_teacher_id, class_period_id, school_year),
  constraint inclusion_section_teacher_unique
    unique (schedule_entry_id, inclusion_teacher_id)
);

create index if not exists inclusion_assignments_year_period_idx
  on public.inclusion_assignments (school_year, class_period_id);

create or replace function public.validate_inclusion_assignment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  classroom_teacher_id uuid;
  section_type text;
  section_active boolean;
begin
  select teacher_id, entry_type, is_active
    into classroom_teacher_id, section_type, section_active
  from public.master_schedule_entries
  where id = new.schedule_entry_id
    and class_period_id = new.class_period_id
    and school_year = new.school_year;

  if not found or section_type <> 'teaching' or not section_active then
    raise exception 'Inclusion support can only be assigned to an active teaching section.';
  end if;

  if classroom_teacher_id = new.inclusion_teacher_id then
    raise exception 'The classroom teacher cannot also be the inclusion teacher for the same section.';
  end if;

  if exists (
    select 1 from public.master_schedule_entries
    where teacher_id = new.inclusion_teacher_id
      and class_period_id = new.class_period_id
      and school_year = new.school_year
      and is_active = true
  ) then
    raise exception 'The inclusion teacher already has a schedule entry during this period. Remove or change that entry before assigning inclusion support.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_inclusion_assignment_before_write on public.inclusion_assignments;
create trigger validate_inclusion_assignment_before_write
before insert or update on public.inclusion_assignments
for each row execute function public.validate_inclusion_assignment();

create or replace function public.validate_master_schedule_teacher_period()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from public.inclusion_assignments
    where inclusion_teacher_id = new.teacher_id
      and class_period_id = new.class_period_id
      and school_year = new.school_year
  ) then
    raise exception 'This teacher is already assigned as inclusion support during this period.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_master_schedule_teacher_period_before_write on public.master_schedule_entries;
create trigger validate_master_schedule_teacher_period_before_write
before insert or update on public.master_schedule_entries
for each row execute function public.validate_master_schedule_teacher_period();

alter table public.master_schedule_entries enable row level security;
alter table public.inclusion_assignments enable row level security;

drop policy if exists "Admins manage master schedule entries" on public.master_schedule_entries;
create policy "Admins manage master schedule entries"
on public.master_schedule_entries for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage inclusion assignments" on public.inclusion_assignments;
create policy "Admins manage inclusion assignments"
on public.inclusion_assignments for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant select, insert, update, delete on public.master_schedule_entries to authenticated;
grant select, insert, update, delete on public.inclusion_assignments to authenticated;
