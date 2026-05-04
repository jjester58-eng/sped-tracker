import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Safety check (optional but helpful)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase env vars");
}

// SINGLE exported client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);