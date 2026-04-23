import { createClient } from './client';

/**
 * Returns the authenticated user's ID.
 *
 * Recent versions of @supabase/ssr wrap even `getSession()` in the
 * `navigator.locks` mutex used for token refresh. If the lock is orphaned
 * (a previous page left it held), `getSession()` blocks for ~5 seconds
 * before GoTrue forcefully reclaims it. We race every auth call against
 * a timeout so the UI can't hang on that. If nothing returns in time, we
 * sign out to wipe whatever corrupted state is holding the lock — this is
 * what "clear site data" used to do manually, now automated.
 */
const AUTH_CALL_TIMEOUT_MS = 6000;

function withTimeout<T>(promise: Promise<T>, ms = AUTH_CALL_TIMEOUT_MS): Promise<T | 'timeout'> {
  return Promise.race([
    promise,
    new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), ms)),
  ]);
}

export async function getAuthUserId(): Promise<string | null> {
  const supabase = createClient();

  const sessionRes = await withTimeout(supabase.auth.getSession());
  if (sessionRes !== 'timeout' && sessionRes.data.session?.user?.id) {
    return sessionRes.data.session.user.id;
  }

  const userRes = await withTimeout(supabase.auth.getUser());
  if (userRes === 'timeout') {
    // Lock is wedged — nuke the session so the next load starts clean.
    await withTimeout(supabase.auth.signOut());
    return null;
  }
  if (userRes.error) {
    await withTimeout(supabase.auth.signOut());
    return null;
  }
  return userRes.data.user?.id ?? null;
}
