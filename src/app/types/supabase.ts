// src/app/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Debug — możesz to potem usunąć
console.log("→ SUPABASE_URL:", SUPABASE_URL);
console.log("→ SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY.slice(0, 10) + "...");

// Inicjalizacja klienta
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
