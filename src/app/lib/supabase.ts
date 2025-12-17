import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Get Supabase client instance (anon key, respects RLS).
 */
export function getSupabase(): SupabaseClient {
     if (!supabaseInstance) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
          supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
     }
     return supabaseInstance;
}

/**
 * Get Supabase admin client (service role key, bypasses RLS).
 * Use only in server-side code (Route Handlers, Server Actions).
 */
export function getSupabaseAdmin(): SupabaseClient {
     if (!supabaseAdminInstance) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const serviceRoleKey = process.env.SERVICE_ROLE_KEY!;

          if (!supabaseUrl || !serviceRoleKey) {
               throw new Error('Missing Supabase URL or SERVICE_ROLE_KEY');
          }

          supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
               auth: {
                    autoRefreshToken: false,
                    persistSession: false,
               },
          });
     }
     return supabaseAdminInstance;
}

// Backward compatibility (opcjonalnie możesz usunąć później)
export const supabase = new Proxy({} as SupabaseClient, {
     get(_, prop) {
          return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
     },
});
