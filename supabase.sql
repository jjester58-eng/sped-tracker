-- Run this in your Supabase SQL editor to create the student_data table.

create table if not exists student_data (
  id uuid primary key default uuid_generate_v4(),
  student_name text not null,
  grade_level text not null,
  iep_goal text not null,
  progress_notes text not null,
  accommodations text,
  teacher_name text not null,
  review_date date,
  created_at timestamptz not null default now()
);
