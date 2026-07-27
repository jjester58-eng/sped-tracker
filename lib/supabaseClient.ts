import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

class FallbackQueryBuilder {
  constructor(private readonly message: string) {}

  select() {
    return this;
  }

  insert() {
    return this;
  }

  update() {
    return this;
  }

  delete() {
    return this;
  }

  eq() {
    return this;
  }

  in() {
    return this;
  }

  order() {
    return this;
  }

  single() {
    return Promise.resolve({ data: null, error: new Error(this.message) });
  }

  then(resolve: (value: any) => any) {
    return Promise.resolve({ data: [], error: new Error(this.message) }).then(resolve);
  }
}

const createFallbackClient = () => {
  const message =
    "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";

  return {
    from: () => new FallbackQueryBuilder(message),
    rpc: async () => ({ data: null, error: new Error(message) }),
  } as any;
};

export const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return createFallbackClient();
  }

  try {
    return createClient<Database>(url, key);
  } catch {
    return createFallbackClient();
  }
};
