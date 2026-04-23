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

// In-process async lock that replaces GoTrue's default `navigator.locks` mutex.
// We observed a real user whose browser had a wedged `navigator.locks` entry
// for the auth-token key from a prior session — every call to getSession()
// then hung forever because the lock was never released. Since we already
// guarantee exactly one client per tab via the globalThis singleton, a
// per-process queue is enough; we don't need cross-tab coordination.
const lockQueues = new Map<string, Promise<unknown>>();
function inMemoryLock<R>(name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  const prev = lockQueues.get(name) ?? Promise.resolve();
  const next = prev.then(() => fn(), () => fn());
  lockQueues.set(name, next.catch(() => {}));
  return next;
}

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
  } catch { /* localStorage blocked — ignore */ }
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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { lock: inMemoryLock } }
    );
  }
  return globalThis.__uvaSupabaseClient;
}
