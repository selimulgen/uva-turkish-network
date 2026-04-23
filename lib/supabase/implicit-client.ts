import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// A SECOND Supabase client used only by the password-reset pages. It uses the
// implicit flow (needed so a reset link works in a different browser/device
// than the one that requested it) and a DISTINCT storage key so it doesn't
// compete with the main auth client for the same GoTrue lock. Previously
// both clients shared `sb-<project>-auth-token`, triggering the
// "Multiple GoTrueClient instances" warning and "Lock was stolen" errors
// that broke auth state on refresh.
declare global {
  // eslint-disable-next-line no-var
  var __uvaSupabaseImplicitClient: SupabaseClient | undefined;
}

export function createImplicitClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { flowType: 'implicit', storageKey: 'sb-password-reset', persistSession: false } }
    );
  }
  if (!globalThis.__uvaSupabaseImplicitClient) {
    globalThis.__uvaSupabaseImplicitClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { flowType: 'implicit', storageKey: 'sb-password-reset', persistSession: false } }
    );
  }
  return globalThis.__uvaSupabaseImplicitClient;
}
