import './App.css';
import { useEffect, useState } from 'react';

import { getAppUrl, getSupabaseClient } from '@/utils/supabaseClient';
import { restoreSupabaseSession } from '@/utils/auth';
import { saveItem, type SaveItemResult } from '@/utils/saveItem';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContentType, Database } from '@kurate/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type PageInfo = { url: string; title: string; domain: string; faviconUrl?: string | null };

async function getCurrentPage(): Promise<PageInfo | null> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const url = tab?.url ?? '';
  if (!url) return null;
  const title = tab?.title ?? url;
  let domain = '';
  try {
    domain = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    domain = url;
  }
  return { url, title, domain, faviconUrl: tab?.favIconUrl ?? null };
}

async function bgMessage<T>(message: any): Promise<T> {
  return await chrome.runtime.sendMessage(message);
}

interface ExtractedMeta {
  title?: string | null;
  description?: string | null;
  previewImage?: string | null;
  contentType?: ContentType | null;
  source?: string | null;
  author?: string | null;
  readTime?: string | null;
}

async function fetchMetadata(appUrl: string, url: string, accessToken: string): Promise<ExtractedMeta | null> {
  try {
    const res = await fetch(`${appUrl}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return await res.json() as ExtractedMeta;
  } catch {
    return null;
  }
}

async function trySyncSessionFromWeb(appUrl: string): Promise<any | null> {
  try {
    const res = await fetch(`${appUrl}/api/extension/session`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.session ?? null;
  } catch {
    return null;
  }
}

function App() {
  const [initError, setInitError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const [appUrl, setAppUrl] = useState<string>('');

  const [auth, setAuth] = useState<AuthStatus>('loading');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [page, setPage] = useState<PageInfo | null>(null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<SaveItemResult | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    (async () => {
      let app = '';
      try {
        setSupabase(getSupabaseClient());
        app = getAppUrl();
        setAppUrl(app);
      } catch (e) {
        setInitError(e instanceof Error ? e.message : 'Extension is misconfigured');
        setAuth('unauthenticated');
        setUserEmail(null);
        return;
      }

      // Restore session from storage and bind into supabase client
      let session = await restoreSupabaseSession();
      if (session) {
        setAuth('authenticated');
        setUserEmail(session.user.email ?? null);
      } else {
        // If the user is already logged into the web app, import that session.
        const webSession = await trySyncSessionFromWeb(app);
        if (webSession?.access_token && webSession?.refresh_token) {
          await bgMessage<any>({ type: 'AUTH_SET_SESSION', session: webSession });
          session = await restoreSupabaseSession();
        }

        if (session) {
          setAuth('authenticated');
          setUserEmail(session.user.email ?? null);
        } else {
          setAuth('unauthenticated');
          setUserEmail(null);
        }
      }

      const pageInfo = await getCurrentPage();
      setPage(pageInfo);
    })().catch((e) => {
      setAuth('unauthenticated');
      setUserEmail(null);
      setAuthError(e instanceof Error ? e.message : 'Failed to initialize');
    });
  }, []);

  const statusPill =
    auth === 'loading'
      ? '…'
      : auth === 'authenticated'
        ? 'Logged in'
        : 'Logged out';

  async function onLogin() {
    setAuthError(null);
    setFeedback(null);
    setAuthBusy(true);
    try {
      if (!appUrl) throw new Error('Missing NEXT_PUBLIC_APP_URL');
      // Grammarly-style: open web app login in a tab, then wait for bridge.
      const loginUrl = new URL(`${appUrl}/auth/login`);
      loginUrl.searchParams.set('extId', chrome.runtime.id);
      loginUrl.searchParams.set('next', '/home');
      await chrome.tabs.create({ url: loginUrl.toString(), active: true });

      const start = Date.now();
      while (Date.now() - start < 90_000) {
        await new Promise((r) => setTimeout(r, 1500));
        const session = await restoreSupabaseSession();
        if (session) {
          setAuth('authenticated');
          setUserEmail(session.user.email ?? null);
          return;
        }
      }

      throw new Error('Login not completed. If you closed the tab, try again.');
    } catch (e) {
      setAuth('unauthenticated');
      setUserEmail(null);
      setAuthError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setAuthBusy(false);
    }
  }

  async function onLogout() {
    setAuthError(null);
    setFeedback(null);
    const res = await bgMessage<any>({ type: 'AUTH_LOGOUT' });
    if (!res?.ok) {
      setAuthError(res?.error ?? 'Logout failed');
      return;
    }
    setAuth('unauthenticated');
    setUserEmail(null);
  }

  async function onSave() {
    setAuthError(null);
    setFeedback(null);
    setSaving(true);
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const pageInfo = page ?? (await getCurrentPage());
      setPage(pageInfo);

      if (!pageInfo?.url) {
        setFeedback({ status: 'error', url: '', message: 'No active tab URL found' });
        return;
      }

      const session = await restoreSupabaseSession();
      if (!session) {
        setAuth('unauthenticated');
        setUserEmail(null);
        setFeedback({ status: 'error', url: pageInfo.url, message: 'Please login first' });
        return;
      }

      // Fetch rich metadata (og:image, description, content type, author, read time).
      // Falls back gracefully — if extraction fails, we still save with tab title.
      const meta = await fetchMetadata(appUrl, pageInfo.url, session.access_token);

      const result = await saveItem(supabase, {
        url: pageInfo.url,
        title: meta?.title ?? pageInfo.title,
        preview_image: meta?.previewImage ?? null,
        content_type: meta?.contentType ?? 'link',
        description: meta?.description ?? null,
        source: meta?.source ?? null,
        author: meta?.author ?? null,
        read_time: meta?.readTime ?? null,
      });
      setFeedback(result);
    } finally {
      setSaving(false);
    }
  }

  if (initError) {
    return (
      <div className="popup">
        <div className="header">
          <div className="brand">
            <div className="brandTitle">Kurate</div>
            <div className="brandSub">Setup required</div>
          </div>
          <div className="pill pillError">Error</div>
        </div>
        <div className="card">
          <div className="title">Extension isn’t configured</div>
          <div className="msg msgError" style={{ whiteSpace: 'pre-wrap' }}>
            {initError}
          </div>
          <div className="msg muted">
            Check `apps/extension/.env`, then rebuild (`pnpm --filter ./apps/extension build`) and reload the extension.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup">
      <div className="header">
        <div className="brand">
          <div className="brandTitle">Kurate</div>
          <div className="brandSub">{userEmail ? userEmail : 'Save this page to your vault'}</div>
        </div>
        <div className={`pill${auth === 'authenticated' ? ' pillAuth' : ''}`}>{statusPill}</div>
      </div>

      <div className="card">
        <div className="pageRow">
          <div className="favicon" aria-hidden="true">
            {page?.faviconUrl ? <img className="faviconImg" src={page.faviconUrl} alt="" /> : null}
          </div>
          <div className="pageText">
            <div className="title">{page?.title ?? 'Open a page to save it'}</div>
            <div className="url">{page ? page.domain : 'Switch to a normal web page tab (not chrome://)'}</div>
          </div>
        </div>

        {auth === 'unauthenticated' ? (
          <div className="row">
            <button className="btn btnPrimary" onClick={onLogin} disabled={authBusy}>
              {authBusy ? 'Opening login…' : 'Sign in to Kurate to start saving'}
            </button>
          </div>
        ) : (
          <div className="row">
            <button className="btn btnPrimary" onClick={onSave} disabled={saving || auth !== 'authenticated'}>
              {saving ? 'Saving…' : 'Save to Vault'}
            </button>
            <button className="btn btnGhost" onClick={onLogout} disabled={saving}>
              Sign out
            </button>
          </div>
        )}

        {authError ? <div className="msg msgError">{authError}</div> : null}

        {feedback ? (
          <div
            className={[
              'msg',
              feedback.status === 'error'
                ? 'msgError'
                : feedback.status === 'saved'
                  ? 'msgSuccess'
                  : 'muted',
            ].join(' ')}
          >
            {feedback.status === 'saved'
              ? 'Saved. You’ll see it in your Vault.'
              : feedback.status === 'duplicate'
                ? 'Already in your Vault.'
                : feedback.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
