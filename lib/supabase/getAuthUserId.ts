import { createClient } from './client';

/**
 * Returns the authenticated user's ID.
 *
 * getSession() reads from local storage/cookies and is instant, but can return
 * null right after the middleware refreshes the token via Set-Cookie headers
 * before the client has synced. Falling back to getUser() makes a single
 * network round-trip to validate and refresh the token when needed.
 */
export async function getAuthUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
