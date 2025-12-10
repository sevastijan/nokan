import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
     if (!supabaseInstance) {
          const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
     }
     return supabaseInstance;
}

// For backward compatibility - lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
     get(_, prop) {
          return (getSupabase() as Record<string | symbol, unknown>)[prop];
     },
});
