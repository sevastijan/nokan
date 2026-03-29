import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const CURRENCIES = ['EUR', 'USD'] as const;
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function getServiceSupabase() {
     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
     const serviceRoleKey = process.env.SERVICE_ROLE_KEY!;
     return createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
     });
}

async function fetchRateFromNBP(currency: string): Promise<number> {
     const res = await fetch(
          `https://api.nbp.pl/api/exchangerates/rates/a/${currency}/?format=json`,
          { cache: 'no-store' }
     );
     if (!res.ok) {
          throw new Error(`NBP API error for ${currency}: ${res.status}`);
     }
     const data = await res.json();
     return data.rates[0].mid;
}

/**
 * GET: Fetch EUR and USD exchange rates (PLN base) with 24h Supabase cache.
 */
export async function GET(_request: NextRequest) {
     try {
          const supabase = getServiceSupabase();

          // Fetch cached rates
          const { data: cached, error: cacheError } = await supabase
               .from('crm_exchange_rates')
               .select('*')
               .in('currency', [...CURRENCIES]);

          if (cacheError) {
               console.error('Error reading exchange rate cache:', cacheError);
          }

          const now = Date.now();
          const cachedMap = new Map(
               (cached || []).map((row: { currency: string; rate_to_pln: number; fetched_at: string }) => [
                    row.currency,
                    row,
               ])
          );

          const results: { currency: string; rate_to_pln: number; fetched_at: string }[] = [];

          for (const currency of CURRENCIES) {
               const cachedRow = cachedMap.get(currency) as
                    | { currency: string; rate_to_pln: number; fetched_at: string }
                    | undefined;

               const isFresh =
                    cachedRow &&
                    now - new Date(cachedRow.fetched_at).getTime() < CACHE_MAX_AGE_MS;

               if (isFresh && cachedRow) {
                    results.push(cachedRow);
                    continue;
               }

               // Fetch fresh rate from NBP
               const rate = await fetchRateFromNBP(currency);
               const fetchedAt = new Date().toISOString();

               const { data: upserted, error: upsertError } = await supabase
                    .from('crm_exchange_rates')
                    .upsert(
                         { currency, rate_to_pln: rate, fetched_at: fetchedAt },
                         { onConflict: 'currency' }
                    )
                    .select()
                    .single();

               if (upsertError) {
                    console.error(`Error upserting rate for ${currency}:`, upsertError);
                    // Still return the fetched rate even if cache write fails
                    results.push({ currency, rate_to_pln: rate, fetched_at: fetchedAt });
               } else {
                    results.push(upserted);
               }
          }

          return NextResponse.json(results);
     } catch (error) {
          console.error('Error in GET /api/crm/exchange-rates:', error);
          return NextResponse.json([], { status: 500 });
     }
}
