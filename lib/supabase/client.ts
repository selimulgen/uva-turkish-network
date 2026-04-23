import { createBrowserClient } from '@supabase/ssr';

type SupabaseClient = ReturnType<typeof createBrowserClient>;

// Code-splitting can evaluate this module more than once (one copy per chunk),
// so a module-scoped `let _client` isn't a real singleton — each chunk gets
// its own. Multiple GoTrueClient instances then fight over the same
// localStorage lock ("Lock was released because another request stole it")
// and auth state breaks on refresh. Pinning the client to window makes it
// truly global across all chunks in the tab.
declare global {
  // eslint-disable-next-line no-var
  var __uvaSupabaseClient: SupabaseClient | undefined;
}

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  if (!globalThis.__uvaSupabaseClient) {
    globalThis.__uvaSupabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return globalThis.__uvaSupabaseClient;
}
