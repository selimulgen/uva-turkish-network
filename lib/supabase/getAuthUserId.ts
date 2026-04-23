import { createClient } from './client';

/**
 * Returns the authenticated user's ID.
 *
 * getSession() reads from local storage/cookies and is instant, but can return
 * null right after the middleware refreshes the token via Set-Cookie headers
 * before the client has synced. Falling back to getUser() makes a single
 * network round-trip to validate and refresh the token when needed — wrapped
 * in a timeout so a hung request can't freeze the page on the loading spinner.
 *
 * If getUser() comes back with an auth error (expired refresh token, revoked
 * session, etc.), we sign out to wipe the corrupted token so subsequent loads
 * don't keep failing the same way — previously users had to manually clear
 * site data to recover.
 */
export async function getAuthUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;

  const timeout = new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 8000));
  const fetchUser = supabase.auth.getUser().then(r => r);
  const result = await Promise.race([fetchUser, timeout]);
  if (result === 'timeout') return null;

  if (result.error) {
    await supabase.auth.signOut().catch(() => {});
    return null;
  }
  return result.data.user?.id ?? null;
}
