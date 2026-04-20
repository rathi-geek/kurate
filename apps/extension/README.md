# Kurate Web Extension (Chrome MV3) guide.

Team, this isa Chrome extension that lets you **login with Supabase (Google OAuth)** and **save the current tab (URL + title)** into Kurate’s Supabase tables using the same dedupe + ownership flow as the web app (`logged_items` + `user_logged_items`), with `save_source="web_extension"`.

## Setup

1. Copy env vars:

```bash
cp apps/extension/.env.example apps/extension/.env
```

2. Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Install deps (from repo root):

```bash
pnpm --filter ./apps/extension install
```

## Run (dev)

```bash
pnpm --filter ./apps/extension dev
```

WXT will output a Chrome MV3 build under `apps/extension/.output/chrome-mv3`.

## Test in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select: `wtf-platform/apps/extension/.output/chrome-mv3`
5. Click the Kurate extension icon:
   - Login with Google
   - Save the current page
   - Try saving again to verify **duplicate** handling

