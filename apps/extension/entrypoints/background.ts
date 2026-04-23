import { clearStoredSession, refreshIfNeeded, restoreSupabaseSession, setStoredSession, signOut } from '@/utils/auth';
import { getAppUrl, getSupabaseClient } from '@/utils/supabaseClient';
import type { Session } from '@supabase/supabase-js';

type BgRequest =
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_GET_STATUS' }
  | { type: 'AUTH_SET_SESSION'; session: Session };

type BgResponse =
  | { ok: true; type: 'AUTH_LOGOUT' }
  | { ok: true; type: 'AUTH_GET_STATUS'; status: 'authenticated' | 'unauthenticated'; session?: { userId: string; email?: string | null } }
  | { ok: false; error: string };

const REFRESH_ALARM_NAME = 'supabase.refresh';

async function buildStatus(): Promise<BgResponse> {
  const session = await restoreSupabaseSession();
  if (!session) return { ok: true, type: 'AUTH_GET_STATUS', status: 'unauthenticated' };
  return {
    ok: true,
    type: 'AUTH_GET_STATUS',
    status: 'authenticated',
    session: { userId: session.user.id, email: session.user.email },
  };
}

export default defineBackground(() => {
  // Restore session as early as possible
  void restoreSupabaseSession();

  // Periodic refresh
  chrome.alarms.create(REFRESH_ALARM_NAME, { periodInMinutes: 10 });
  chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
    if (alarm.name !== REFRESH_ALARM_NAME) return;
    void refreshIfNeeded();
  });

  chrome.runtime.onMessage.addListener((message: BgRequest, _sender: chrome.runtime.MessageSender, sendResponse: (response: BgResponse) => void) => {
    (async () => {
      try {
        if (!message?.type) return { ok: false, error: 'Invalid message' } satisfies BgResponse;

        if (message.type === 'AUTH_SET_SESSION') {
          const session = message.session;
          if (!session?.access_token || !session?.refresh_token) {
            return { ok: false, error: 'Invalid session' } satisfies BgResponse;
          }
          const supabase = getSupabaseClient();
          const { data, error: setErr } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          if (setErr || !data.session) {
            await clearStoredSession();
            return { ok: false, error: setErr?.message ?? 'Failed to bind session' } satisfies BgResponse;
          }
          // Persist the session Supabase returned (tokens may have been refreshed)
          await setStoredSession(data.session);
          return {
            ok: true,
            type: 'AUTH_GET_STATUS',
            status: 'authenticated',
            session: { userId: data.session.user.id, email: data.session.user.email },
          } satisfies BgResponse;
        }

        if (message.type === 'AUTH_LOGOUT') {
          await signOut();
          return { ok: true, type: 'AUTH_LOGOUT' } satisfies BgResponse;
        }

        if (message.type === 'AUTH_GET_STATUS') {
          return await buildStatus();
        }

        return { ok: false, error: 'Unknown message type' } satisfies BgResponse;
      } catch (e) {
        const error = e instanceof Error ? e.message : 'Unknown error';
        return { ok: false, error } satisfies BgResponse;
      }
    })().then(sendResponse);

    return true;
  });

  // Web app → extension auth bridge (Grammarly-style)
  chrome.runtime.onMessageExternal.addListener((message: any, sender, sendResponse) => {
    (async () => {
      try {
        // Defense-in-depth: Chrome enforces externally_connectable, but also validate origin in code.
        let appOrigin: string;
        try {
          appOrigin = new URL(getAppUrl()).origin;
        } catch {
          return { ok: false, error: 'Extension misconfigured' };
        }
        // Allow appUrl origin and its www/non-www counterpart.
        const altOrigin = appOrigin.includes('://www.')
          ? appOrigin.replace('://www.', '://')
          : appOrigin.replace('://', '://www.');
        if (!sender.origin || (sender.origin !== appOrigin && sender.origin !== altOrigin)) {
          return { ok: false, error: 'Untrusted origin' };
        }

        if (message?.type === 'KURATE_PING') {
          return { ok: true, type: 'KURATE_PONG' };
        }

        if (message?.type !== 'KURATE_AUTH_SESSION') {
          return { ok: false, error: 'Unknown external message' };
        }
        const session = message?.session as Session | undefined;
        if (!session?.access_token || !session?.refresh_token) {
          return { ok: false, error: 'Invalid session payload' };
        }

        // Bind into supabase client first, then persist what Supabase returned
        // (tokens may be refreshed during setSession).
        const supabase = getSupabaseClient();
        const { data, error: setErr } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        if (setErr || !data.session) {
          return { ok: false, error: setErr?.message ?? 'Failed to bind session' };
        }
        await setStoredSession(data.session);

        return { ok: true };
      } catch (e) {
        const error = e instanceof Error ? e.message : 'Unknown error';
        return { ok: false, error };
      }
    })().then(sendResponse);

    return true;
  });
});
