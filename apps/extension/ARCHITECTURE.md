# Kurate Chrome Extension — Architecture

## Why a separate app

The extension lives in `apps/extension/` as its own standalone app, separate from `apps/web/`. This is intentional and necessary — not a code organisation preference.

The two environments are fundamentally different:

| | Web (`apps/web`) | Extension (`apps/extension`) |
|---|---|---|
| Build system | Next.js / webpack | WXT / Vite |
| Auth storage | HttpOnly cookies (SSR) | `chrome.storage.local` |
| Supabase client | Cookie-based SSR client | Manual `setSession()` |
| React Query | Full `QueryProvider` tree | Not available |
| APIs | Browser + Node.js | Chrome extension APIs (`chrome.tabs`, `chrome.runtime`, `chrome.alarms`) |

Because of this, the web app's existing `useSaveItem` hook (`libs/hooks/src/useSaveItem.ts`) cannot be used directly in the extension — it depends on `useMutation` from React Query, which requires a `QueryProvider` that doesn't exist in the extension popup. The extension calls the same plain async save logic, just without the React Query wrapper.

---

## Folder structure

```
apps/extension/
├── entrypoints/
│   ├── background.ts        # MV3 service worker — owns session lifecycle
│   └── popup/
│       ├── App.tsx          # Popup UI
│       ├── App.css          # Popup styles
│       ├── main.tsx         # React entry point
│       ├── index.html       # WXT popup entry point
│       └── style.css        # Global reset
├── utils/
│   ├── auth.ts              # Session restore / refresh / sign-out
│   ├── chromeStorage.ts     # chrome.storage.local wrappers
│   ├── saveItem.ts          # Core save logic (upsert + duplicate check)
│   └── supabaseClient.ts    # Singleton Supabase client (no persistence, no auto-refresh)
├── constants/
│   └── storageKeys.ts       # chrome.storage key names
├── public/icon/             # Extension icons (WXT auto-discovers icon/{size}.png)
├── .env.example
├── package.json
├── tsconfig.json
└── wxt.config.ts            # Manifest V3 config, permissions, externally_connectable
```

---

## What is shared with the monorepo

The extension consumes shared libs like everything else in the monorepo:

- `@kurate/types` — DB-derived TypeScript types (`Database`, `ContentType`)
- `@kurate/utils` — `generateUrlHash` (SHA-256 of the URL, the dedup key on `logged_items`)

It does **not** use `@kurate/query` (React Query) or `@kurate/hooks` (React hooks) — those are browser/Next.js runtime dependencies.

### Note on `generateUrlHash`

`generateUrlHash` lives in `libs/utils/src/generateUrlHash.ts` and is exported from `@kurate/utils`. The extension imports it from there.

The web app (`apps/web`) and `@kurate/hooks` each keep their own local copy of the same function — this is intentional. Pulling `@kurate/utils` into those packages would add a cross-lib dependency with no real benefit, since the function is a pure one-liner. The extension is the only consumer that needed it added to `@kurate/utils`.

---

## Auth flow

### First open (extension not yet authenticated)

```
Popup opens
  → restoreSupabaseSession() checks chrome.storage
  → No session stored

  → trySyncSessionFromWeb() fetches GET /api/extension/session
      (credentials: include — sends browser cookies)
  → If web app session exists → background stores + binds it
  → Popup shows authenticated

  → If no web session → show "Sign in" button
```

### Login (clicking "Sign in to Kurate")

```
Popup opens /auth/login?extId=<extensionId> in a new tab
  → If user already logged in: proxy.ts detects extId → redirects to /auth/extension-callback?extId=...
  → If user not logged in: normal login flow → Supabase callback → /auth/extension-callback?extId=...

/auth/extension-callback
  → Gets session from Supabase client (code already exchanged)
  → Calls chrome.runtime.sendMessage(extId, { type: 'KURATE_AUTH_SESSION', session })
  → Extension background receives it via onMessageExternal
  → Validates sender.origin against NEXT_PUBLIC_APP_URL
  → Stores session in chrome.storage.local
  → Redirects tab to /

Popup polls chrome.storage every 1.2s (up to 90s)
  → Finds session → shows authenticated
```

### Session persistence

The Supabase client is created with `persistSession: false, autoRefreshToken: false` — the extension owns all session state in `chrome.storage.local`. A background alarm fires every 10 minutes to call `refreshIfNeeded()`, which refreshes the token if it expires within 5 minutes.

---

## Save flow

```
User clicks "Save to Vault"
  → restoreSupabaseSession() — re-validates current session
  → fetchMetadata(appUrl, url, accessToken)
      POST /api/extract with Authorization: Bearer <access_token>
      Returns: og:title, og:image, og:description, contentType, author, readTime
      (falls back gracefully — save always completes even if extraction fails)
  → saveItem(supabase, { url, title, preview_image, content_type, description, ... })
      1. Upsert logged_items on url_hash (shared catalog row, one per URL globally)
      2. SELECT user_logged_items — duplicate check for this user
      3. If duplicate → return { status: 'duplicate' }
      4. INSERT user_logged_items with save_source = 'web_extension'
  → Popup shows "Saved" / "Already in your Vault" / error
```

---

## Web app changes (extension touchpoints)

Two routes were added to `apps/web` to support the extension. Both are isolated behind `extId` / extension-origin checks and have zero effect on normal app users.

| File | Purpose |
|---|---|
| `app/(public)/auth/extension-callback/page.tsx` | Receives the post-login redirect, sends session to extension via `chrome.runtime.sendMessage` |
| `app/api/extension/session/route.ts` | Returns the current web session to the extension popup for auto-sync on first open |
| `app/api/extract/route.ts` | Extended to accept `Authorization: Bearer` token (extension has no cookies) |
| `src/proxy.ts` | Extended to redirect logged-in users with `extId` to the callback page instead of `/home` |

---

## File-by-file reference

### `constants/storageKeys.ts`
A single object `STORAGE_KEYS` with one key: `SUPABASE_SESSION = 'supabase.session'`. This is the key used in `chrome.storage.local` to store the session JSON. Centralising it means if you ever rename the key you only change one place.

---

### `utils/chromeStorage.ts`
Three thin wrappers around the raw `chrome.storage.local` API:
- `storageGet<T>(key)` — gets a value, returns `null` if missing (typed generic)
- `storageSet<T>(key, value)` — stores any JSON-serialisable value
- `storageRemove(key)` — deletes a key

Why wrap it: `chrome.storage.local` returns `{ [key]: value }` objects instead of the value directly, and needs a bit of boilerplate. These wrappers are async/await clean.

---

### `utils/supabaseClient.ts`
Creates a **singleton** Supabase client. Key config decisions:
```ts
persistSession: false   // extension owns storage — Supabase must NOT write to localStorage (it doesn't exist in SW)
autoRefreshToken: false // background alarm handles refresh instead
detectSessionInUrl: false // not a browser page, no hash to parse
```
`getSupabaseClient()` reads env from `import.meta.env` (Vite convention, not `process.env`). Throws a descriptive error if any env var is missing — this surfaces in the popup as "Extension isn't configured."

`getAppUrl()` strips trailing slashes from `NEXT_PUBLIC_APP_URL` so URL concatenation never creates `//api/...`.

---

### `utils/auth.ts`
The session lifecycle layer. Four exported functions:

**`restoreSupabaseSession()`** — called on every popup open and background init.
1. Reads raw session JSON from `chrome.storage.local`
2. Checks `expires_at` — clears immediately if already expired
3. Calls `supabase.auth.setSession({ access_token, refresh_token })` to bind it into the in-memory Supabase client
4. Persists the returned session (tokens may have been refreshed by Supabase)
5. Returns the live `Session` object or `null`

**`refreshIfNeeded()`** — called by the background alarm every 10 min.
1. Reads stored session
2. Only refreshes if expiry is within 5 minutes: `expiresAtMs - Date.now() <= 5 * 60 * 1000`
3. Calls `supabase.auth.refreshSession({ refresh_token })`
4. Persists the new tokens

**`signOut()`** — clears storage AND calls `supabase.auth.signOut()` to revoke server-side.

**`setStoredSession` / `clearStoredSession` / `getStoredSession`** — thin pass-throughs to `chromeStorage` using the typed key.

---

### `utils/saveItem.ts`
The core DB write logic. Takes a `SupabaseClient` and `SaveItemInput`, returns a typed `SaveItemResult`.

Three-step process:
1. **Upsert `logged_items`** — the shared global catalog. `url_hash` (SHA-256 of the URL) is the conflict key. If two users save the same URL, there is only one `logged_items` row — this is the dedup strategy. Stores metadata: title, content_type, preview_image_url, description, tags, and a `raw_metadata` JSON blob (source, author, read_time).

2. **Check `user_logged_items`** for this user + logged_item_id pair. If it already exists → returns `{ status: 'duplicate' }` without inserting.

3. **Insert `user_logged_items`** — the ownership row. Stores `user_id`, `logged_item_id`, `save_source: 'web_extension'`. Handles Postgres error code `23505` (unique constraint race condition) gracefully — re-fetches and returns duplicate status.

`generateUrlHash` from `@kurate/utils` is used here — it's a `crypto.subtle.digest('SHA-256')` of the lowercased, trimmed URL, returned as a hex string.

---

### `entrypoints/background.ts`
The MV3 service worker. Runs headless in the background (not in a tab, no DOM).

**On startup:**
- Calls `restoreSupabaseSession()` immediately — binds any persisted session into the Supabase client
- Creates a repeating alarm `supabase.refresh` every 10 minutes

**`onMessage` (popup → background):**
Handles three internal message types:
| Message | What it does |
|---|---|
| `AUTH_SET_SESSION` | Calls `supabase.auth.setSession()` and stores the result |
| `AUTH_GET_STATUS` | Calls `restoreSupabaseSession()` and returns `authenticated` or `unauthenticated` |
| `AUTH_LOGOUT` | Calls `signOut()` |

All handlers return `true` at the end of `onMessage` — this is required by Chrome to keep the response channel open for async replies.

**`onMessageExternal` (web app → background):**
Called by `chrome.runtime.sendMessage(extId, ...)` from the web app's callback page.
- Validates `sender.origin` against `NEXT_PUBLIC_APP_URL` (and its www/non-www variant)
- Accepts only `KURATE_AUTH_SESSION` message type
- Calls `supabase.auth.setSession()` + `setStoredSession()` to bind and persist the session

---

### `entrypoints/popup/App.tsx`
The popup UI (~300 lines). One React component with local state only (no React Query).

**State:**
- `auth: 'loading' | 'authenticated' | 'unauthenticated'`
- `page: { url, title, domain, faviconUrl }` — pulled from `chrome.tabs.query`
- `feedback: SaveItemResult | null` — shown after save
- `supabase` — the singleton client
- `saving`, `authBusy` — button loading states

**Init `useEffect` (runs once on open):**
1. Initialises Supabase client and `appUrl`
2. `restoreSupabaseSession()` — checks local storage
3. If no session: calls `trySyncSessionFromWeb()` → `GET /api/extension/session` with `credentials: include` (sends browser cookies). If the web app is logged in, this returns a session → forwards it to the background via `AUTH_SET_SESSION` message
4. `getCurrentPage()` — queries the active tab for URL, title, favicon

**`onLogin()`:**
Opens `${appUrl}/auth/login?extId=${chrome.runtime.id}&next=/home` in a new tab. Then polls `restoreSupabaseSession()` every 1.2s for up to 90 seconds, waiting for the background to receive the session from the web callback page.

**`onSave()`:**
1. Re-validates session
2. Calls `fetchMetadata(appUrl, url, accessToken)` — `POST /api/extract` with `Authorization: Bearer <access_token>`. Falls back gracefully if this fails (still saves with tab title).
3. Calls `saveItem(supabase, {...})` and sets `feedback`

---

### Web: `useLoginAuth.ts` (modified)
Added `extId` detection from search params. When `extId` is present:
- Sets `callbackUrl` to `/auth/extension-callback?extId=<id>` instead of the normal auth callback
- This makes both Google OAuth and magic link redirect to the extension callback page after login

---

### Web: `auth/extension-callback/page.tsx` (new)
Client component. On mount:
1. Gets `extId` from URL params
2. Gets the current Supabase session (already established by the OAuth redirect)
3. Calls `chrome.runtime.sendMessage(extId, { type: 'KURATE_AUTH_SESSION', session })` — this sends the session directly into the extension's `onMessageExternal` handler
4. Redirects to `/home` after 600ms

---

### Web: `api/extension/session/route.ts` (new)
GET endpoint. Validates the request origin against `chrome-extension://<EXTENSION_ID>`. Returns the current server-side session (access_token, refresh_token, expires_at, user) so the popup can auto-sync without requiring a new login if the user is already logged into the web app. Returns `{ session: null }` (not 401) if not logged in.

---

### Web: `api/extract/route.ts` (modified)
Previously cookie-auth only. Now also accepts `Authorization: Bearer <token>` for extension requests. The change:
```ts
const authHeader = req.headers.get("Authorization");
if (authHeader?.startsWith("Bearer ")) {
  const { data } = await supabase.auth.getUser(token);  // validates JWT
} else {
  const { data } = await supabase.auth.getUser();  // cookie path
}
```
Also added `OPTIONS` preflight handler and CORS headers when the origin is the extension.

---

### Web: `proxy.ts` (modified)
Two additions:
1. `/auth/extension-callback` is excluded from the "redirect logged-in users away from auth pages" rule — this page must run while the user IS logged in.
2. When a logged-in user hits any auth page with `?extId=...`, redirects to `/auth/extension-callback?extId=...` instead of `/home`. This handles the case where the user was already logged into the web app when they clicked "Sign in" in the popup.

---

### Lib: `libs/utils/src/generateUrlHash.ts` (new)
Pure function: SHA-256 of `url.toLowerCase().trim()`, returned as hex string. Uses the browser-native `crypto.subtle.digest` API (works in both browser and service worker). Added to `libs/utils/src/index.ts` exports so the extension can import it as `@kurate/utils`.

---

## Security model

- **`externally_connectable`** in `wxt.config.ts` restricts which web origins can call `chrome.runtime.sendMessage` into the extension (only `kurate.co.in` and `localhost:3000`)
- **`onMessageExternal`** in `background.ts` validates `sender.origin` in code as a second layer
- **`/api/extension/session`** validates the requesting origin against `EXTENSION_ID` env var in production (set this after publishing to Chrome Web Store)
- **Anon key only** — no service role key anywhere in the extension; all DB access goes through RLS with the user's JWT
