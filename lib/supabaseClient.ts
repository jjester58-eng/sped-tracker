// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!isSupabaseConfigured) {
    console.error("Supabase is not configured. Check your .env.local file.");
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseInstance;
}