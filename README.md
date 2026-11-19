# SPED Tracker

A   Next.js data tracker for special education teachers working in public schools. This app connects to Supabase and helps track student progress, accommodations, and IEP goals.

## Setup

1. Copy environment variables into `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and replace the placeholders with your Supabase values.

3. Install dependencies:

   ```bash
   npm install
   ```

4. Set the same Supabase environment variables in Vercel if you deploy there.

5. Verify your Supabase database tables exist (see Data Model below).

6. Run the development server:

   ```bash
   npm run dev
   ```

7. Open the app at `http://localhost:3000`.

## Supabase configuration

The app expects the following environment values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Data model

The tracker works with the following Supabase tables:

### Core tables
- **students** - Student roster with name and grade level
- **case_managers** - Teachers or case managers assigned to students
- **goals** - IEP goals linked to students
- **weekly_progress** - Weekly progress entries tracking student performance

### Supporting tables
- **classes** - Class/period information
- **data_entry_people** - Staff who enter data
- **data_entry_assignments** - Assignments linking data entry staff to students and case managers

### Weekly Progress fields
The tracker records:
- student_id (required)
- case_manager_id (required)
- goal_id (optional)
- progress_notes (required)
- accommodations_used (optional)
- review_date (optional)
- created_at (auto timestamp)

## Typical workflow

1. Populate **students** table with your student roster
2. Populate **case_managers** table with teacher/case manager names
3. Create IEP **goals** for each student as needed
4. Use the SPED Tracker UI to log weekly progress entries
5. View recent entries and track accommodations per student

## Notes

This setup is intended for special education teams in public schools to record and review student progress data in real time.


## Master Schedule and Inclusion Support

The Master Schedule, Teacher Availability, and Inclusion Support pages use one shared schedule data model. They are administrator-only and require the existing Supabase `is_admin()` function.

Before using these pages on a deployment:

1. Open the Supabase project SQL Editor.
2. Run the contents of `supabase/setup_master_schedule.sql` once. It creates the schedule-entry and inclusion-assignment tables, conflict protections, administrator-only RLS policies, and authenticated-role grants. It does not modify the existing student, class, teacher, or progress records.
3. Confirm the `class_periods` table contains the campus periods and their correct sort order. The app intentionally does not invent period names or times.
4. Confirm `teachers` contains the staff directory. Master Schedule and Inclusion Support both use that same list.
5. In Supabase Data API settings, make sure the new tables are exposed to the Data API if your project uses the newer opt-in table exposure setting. The SQL script grants access to the authenticated role and enables RLS; both controls are required.
6. Sign in with an administrator account, open Master Schedule, select the school year, and enter the campus schedule. Record Conference, PLC, and Off period blocks explicitly. A blank period is displayed as **Unrecorded**, never automatically as available.

### Shared schedule behavior

- A teacher can have only one active schedule entry per period and school year.
- Inclusion assignments reference a real teaching section from Master Schedule.
- An inclusion teacher cannot be assigned when they already have another schedule entry in that period. This is checked in the interface and enforced by a database trigger.
- Inclusion assignments count as teaching time in availability and teacher schedule views.
- Conference, PLC, and explicit Off period entries are treated as non-teaching time.
- Subject-family colors are based on the subject/department, so all Math courses share the same color.
- The Inclusion Support coverage flag is stored on the shared master-schedule section, not in a separate sample-data list.

The Supabase connection used by the GitHub/Vercel preview must point to the same project as production. The SQL setup must be applied to that project before testing the connected pages.
