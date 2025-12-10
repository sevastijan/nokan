import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get Supabase client instance (lazy initialization for build compatibility).
 */
export function getSupabase(): SupabaseClient {
     if (!supabaseInstance) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
     }
     return supabaseInstance;
}

// For backward compatibility - lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
     get(_, prop) {
          return (getSupabase() as Record<string | symbol, unknown>)[prop];
     },
});
