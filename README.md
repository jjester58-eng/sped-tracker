# SPED Tracker

A Next.js  data tracker for special education teachers working in public schools. This app connects to Supabase and helps track student progress, accommodations, and IEP goals.

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
