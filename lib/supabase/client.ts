import { createBrowserClient } from '@supabase/ssr';

type SupabaseClient = ReturnType<typeof createBrowserClient>;

// Code-splitting can evaluate this module more than once (one copy per chunk),
// so a module-scoped `let _client` isn't a real singleton — each chunk gets
// its own. Multiple GoTrueClient instances then fight over the same
// localStorage lock ("Lock was released because another request stole it")
// and auth state breaks on refresh. Pinning the client to `globalThis` makes
// it truly global across all chunks in the tab.
declare global {
  // eslint-disable-next-line no-var
  var __uvaSupabaseClient: SupabaseClient | undefined;
  // eslint-disable-next-line no-var
  var __uvaSupabaseStorageHealed: boolean | undefined;
}

// Earlier versions of this app accidentally spawned multiple GoTrueClient
// instances against the same storage key. When they raced on token refresh,
// localStorage ended up with partially-written / unparseable entries. The
// browser then hangs on every load waiting to "heal" the orphaned lock.
// This one-shot scrub drops any `sb-*` entry that isn't valid JSON, so
// existing users don't have to manually clear site data to recover.
function healCorruptedAuthStorage() {
  if (typeof window === 'undefined') return;
  if (globalThis.__uvaSupabaseStorageHealed) return;
  globalThis.__uvaSupabaseStorageHealed = true;
  try {
    const suspect: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) suspect.push(key);
    }
    for (const key of suspect) {
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      try { JSON.parse(raw); } catch { localStorage.removeItem(key); }
    }
  } catch { /* localStorage blocked (private mode, quota, etc.) — ignore */ }
}

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  if (!globalThis.__uvaSupabaseClient) {
    healCorruptedAuthStorage();
    globalThis.__uvaSupabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return globalThis.__uvaSupabaseClient;
}
