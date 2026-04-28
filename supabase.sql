-- This file documents the SPED Tracker database schema.
-- The following tables should already exist in your Supabase project:

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  grade_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case managers (teachers) table
CREATE TABLE IF NOT EXISTS case_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IEP Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  goal_description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly progress tracking
CREATE TABLE IF NOT EXISTS weekly_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  case_manager_id UUID REFERENCES case_managers(id),
  goal_id UUID REFERENCES goals(id),
  progress_notes TEXT,
  accommodations_used TEXT,
  review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data entry people
CREATE TABLE IF NOT EXISTS data_entry_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data entry assignments
CREATE TABLE IF NOT EXISTS data_entry_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES data_entry_people(id),
  student_id UUID REFERENCES students(id),
  case_manager_id UUID REFERENCES case_managers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
