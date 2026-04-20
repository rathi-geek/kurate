import type { Session } from '@supabase/supabase-js';

import { STORAGE_KEYS } from '@/constants/storageKeys';
import { storageGet, storageRemove, storageSet } from '@/utils/chromeStorage';
import { getSupabaseClient } from '@/utils/supabaseClient';

export async function getStoredSession(): Promise<Session | null> {
  return await storageGet<Session>(STORAGE_KEYS.SUPABASE_SESSION);
}

export async function setStoredSession(session: Session): Promise<void> {
  await storageSet(STORAGE_KEYS.SUPABASE_SESSION, session);
}

export async function clearStoredSession(): Promise<void> {
  await storageRemove(STORAGE_KEYS.SUPABASE_SESSION);
}

export async function restoreSupabaseSession(): Promise<Session | null> {
  let supabase: ReturnType<typeof getSupabaseClient>;
  try {
    supabase = getSupabaseClient();
  } catch {
    // Misconfigured env (popup should surface this). Treat as signed out.
    return null;
  }
  const session = await getStoredSession();
  if (!session) return null;

  // If already expired, clear it so UI doesn't flap
  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  if (expiresAtMs && Date.now() >= expiresAtMs) {
    await clearStoredSession();
    await supabase.auth.signOut();
    return null;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error || !data.session) {
    await clearStoredSession();
    await supabase.auth.signOut();
    return null;
  }

  await setStoredSession(data.session);
  return data.session;
}

export async function signOut(): Promise<void> {
  let supabase: ReturnType<typeof getSupabaseClient>;
  try {
    supabase = getSupabaseClient();
  } catch {
    await clearStoredSession();
    return;
  }
  await clearStoredSession();
  await supabase.auth.signOut();
}

export async function refreshIfNeeded(): Promise<Session | null> {
  let supabase: ReturnType<typeof getSupabaseClient>;
  try {
    supabase = getSupabaseClient();
  } catch {
    return null;
  }
  const session = await getStoredSession();
  if (!session) return null;

  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  const needsRefresh = !expiresAtMs || expiresAtMs - Date.now() <= 5 * 60 * 1000;
  if (!needsRefresh) return session;

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: session.refresh_token,
  });

  if (error || !data.session) {
    await signOut();
    return null;
  }

  await setStoredSession(data.session);
  return data.session;
}

