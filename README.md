# SPED Tracker

A simple Next.js data tracker for special education teachers. This app is configured to connect to Supabase using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Setup

1. Copy environment variables into `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set the same Supabase environment variables in Vercel if you deploy there.

4. Create the Supabase table using `supabase.sql` in the Supabase SQL editor.

5. Run the development server:

   ```bash
   npm run dev
   ```

5. Open the app at `http://localhost:3000`.

## Supabase configuration

The app expects the following environment values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Data model

The tracker stores records in a `student_data` table with fields for:

- student name
- grade level
- IEP goal
- progress notes
- accommodations
- teacher/case manager
- next review date
- created timestamp

## Notes

This setup is intended for public school SPED teachers to record and review student data directly from the browser.
