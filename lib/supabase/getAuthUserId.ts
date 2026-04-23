import { createClient } from './client';

/**
 * Returns the authenticated user's ID.
 *
 * getSession() reads from local storage/cookies and is instant, but can return
 * null right after the middleware refreshes the token via Set-Cookie headers
 * before the client has synced. Falling back to getUser() makes a single
 * network round-trip to validate and refresh the token when needed — wrapped
 * in a timeout so a hung request can't freeze the page on the loading spinner.
 */
export async function getAuthUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;

  const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 8000));
  const fetchUser = supabase.auth.getUser().then(r => r.data.user?.id ?? null);
  return Promise.race([fetchUser, timeout]);
}
