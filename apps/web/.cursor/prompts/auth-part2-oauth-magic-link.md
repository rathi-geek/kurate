# Auth Part 2 — Google OAuth + Magic Link

## Scope
Add two new sign-in methods to existing auth pages:
1. **Google OAuth** — button on both login and signup forms
2. **Magic Link** — tab on login form only (email-only, passwordless)

Do NOT touch: callback/route.ts (already handles both flows), proxy.ts, auth-context.tsx, forgot/reset password pages.

## How the flows work
- **Google OAuth**: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })` → browser redirects to Google → Google redirects to `/auth/callback?code=...` → callback exchanges code → user lands on `/chat`
- **Magic Link**: `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })` → Supabase emails a link → user clicks link → hits `/auth/callback?code=...` → lands on `/chat`
- Both use the same existing `/auth/callback` route. No changes needed there.
- `redirectTo` / `emailRedirectTo` value: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.AUTH.CALLBACK}`

## Project conventions (always apply)
- All paths from `ROUTES` constants — never hardcoded strings
- `env.NEXT_PUBLIC_APP_URL` for the app origin — never `window.location.origin`
- `Link`, `useRouter` from `"@/i18n"` — never `next/link` / `next/navigation`
- `"use client"` only on the form component, never on `page.tsx`
- Spring physics for all animations — `springGentle = { type: "spring", stiffness: 260, damping: 25 }`
- `useReducedMotion()` — disable animations when true
- Token classes only — never hardcoded hex, never arbitrary values for colors
- No `bg-cream` on page wrappers — body already has `bg-background` (cream) in base.css
- Both `messages/en-US.json` and `messages/en-GB.json` must stay in sync
- Use TypeScript enums for all state machine values — never string union types or raw string literals

---

## 1. i18n keys — add to both `messages/en-US.json` and `messages/en-GB.json`

Add to `auth.login`:
```json
"or_divider": "or",
"google": "Continue with Google",
"tab_password": "Password",
"tab_magic_link": "Magic link",
"magic_link_email_label": "Email",
"magic_link_email_placeholder": "you@example.com",
"magic_link_submit": "Send sign-in link",
"magic_link_sent_title": "Check your inbox",
"magic_link_sent_message": "We sent a sign-in link to {email}."
```

Add to `auth.signup`:
```json
"or_divider": "or",
"google": "Continue with Google"
```

---

## 2. `src/app/(public)/auth/login/_components/login-form.tsx`

### New structure
```
[Google button]        ← outline, white bg (bg-card), shadow-xs
── or ──               ← thin divider with centered "or" label
[Segmented control: Password | Magic Link]   ← iOS-style, NO black
  password tab  → existing email/password form
  magic link tab → email input + send → sent confirmation screen
[No account? Sign up]
```

### Enums (add at top of file, outside the component)
```ts
enum LoginMethod {
  Password = "password",
  MagicLink = "magic-link",
}

enum MagicStep {
  Form = "form",
  Sent = "sent",
}
```

### State additions
```ts
const [method, setMethod] = useState<LoginMethod>(LoginMethod.Password);
const [magicEmail, setMagicEmail] = useState("");
const [magicStep, setMagicStep] = useState<MagicStep>(MagicStep.Form);
const [magicLoading, setMagicLoading] = useState(false);
const [magicError, setMagicError] = useState("");
```

### Additional imports needed
```ts
import { env } from "env";
import { cn } from "@/app/_libs/utils/cn";
import { AnimatePresence } from "framer-motion"; // add to existing framer-motion import
```

Add alongside existing `fadeUp` variants:
```ts
const springGentle = { type: "spring" as const, stiffness: 260, damping: 25 };
```

### Google handler
```ts
async function handleGoogle() {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.AUTH.CALLBACK}`,
    },
  });
  // No client-side redirect — browser follows OAuth flow
}
```

### Magic link handler
```ts
async function handleMagicLink(e: React.FormEvent) {
  e.preventDefault();
  setMagicError("");
  setMagicLoading(true);

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: magicEmail,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.AUTH.CALLBACK}`,
    },
  });

  if (error) {
    setMagicError(t("error_invalid"));
    setMagicLoading(false);
    return;
  }

  setMagicStep(MagicStep.Sent);
  setMagicLoading(false);
}
```

### Google button + divider (insert inside the `<main>`, after the heading block, before the tab bar)
```tsx
{/* Google OAuth */}
<motion.div
  custom={2}
  initial={prefersReducedMotion ? false : "hidden"}
  animate={prefersReducedMotion ? undefined : "visible"}
  variants={fadeUp}
  className="space-y-3"
>
  <Button
    type="button"
    variant="outline"
    className="w-full bg-card shadow-xs hover:shadow-sm"
    onClick={handleGoogle}
  >
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
    {t("google")}
  </Button>

  {/* Divider */}
  <div className="flex items-center gap-3">
    <div className="h-px flex-1 bg-border" />
    <span className="font-sans text-xs text-muted-foreground">{t("or_divider")}</span>
    <div className="h-px flex-1 bg-border" />
  </div>
</motion.div>
```

### Segmented control tab bar (insert after divider, before the form)
Use the iOS segmented control pattern: white (`bg-card`) active pill with shadow lifts off a subtle tinted container. NO black, NO `bg-foreground`.

```tsx
{/* Segmented control */}
<motion.div
  custom={3}
  initial={prefersReducedMotion ? false : "hidden"}
  animate={prefersReducedMotion ? undefined : "visible"}
  variants={fadeUp}
  className="mb-4 flex rounded-button bg-border/40 p-0.5"
>
  {([LoginMethod.Password, LoginMethod.MagicLink] as LoginMethod[]).map((m) => (
    <button
      key={m}
      type="button"
      onClick={() => setMethod(m)}
      className={cn(
        "flex-1 rounded-[calc(var(--radius-button)-2px)] px-3 py-1.5 font-sans text-sm transition-all",
        method === m
          ? "bg-card text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {m === LoginMethod.Password ? t("tab_password") : t("tab_magic_link")}
    </button>
  ))}
</motion.div>
```

### Password form (wrap existing form — increment custom indices by 2 to account for Google + tabs above)
```tsx
{method === LoginMethod.Password && (
  <AnimatePresence mode="wait">
    <motion.div
      key="password"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, transition: springGentle }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6, transition: { duration: 0.12 } }}
    >
      {/* existing email/password form JSX — no changes inside */}
    </motion.div>
  </AnimatePresence>
)}
```

Update the existing form's `motion.form` custom index to `4` and the footer link block to `5`.

### Magic link panel (insert after password form block)
```tsx
{method === LoginMethod.MagicLink && (
  <AnimatePresence mode="wait">
    {magicStep === MagicStep.Form ? (
      <motion.form
        key="magic-form"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, transition: springGentle }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6, transition: { duration: 0.12 } }}
        onSubmit={handleMagicLink}
        className="space-y-4"
      >
        <div>
          <label htmlFor="magic-email" className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
            {t("magic_link_email_label")}
          </label>
          <Input
            id="magic-email"
            type="email"
            placeholder={t("magic_link_email_placeholder")}
            value={magicEmail}
            onChange={(e) => setMagicEmail(e.target.value)}
            required
          />
          {magicError && <p className="mt-1.5 font-sans text-sm text-destructive">{magicError}</p>}
        </div>
        <div className="pt-2">
          <Button type="submit" disabled={magicLoading} className="w-full">
            {magicLoading ? (
              <span className="inline-block animate-spin"><BrandStar s={14} /></span>
            ) : (
              <>{t("magic_link_submit")} <Arrow s={14} /></>
            )}
          </Button>
        </div>
      </motion.form>
    ) : (
      <motion.div
        key="magic-sent"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, transition: springGentle }}
      >
        <h3 className="mb-2 font-serif text-xl font-normal">{t("magic_link_sent_title")}</h3>
        <p className="font-sans text-sm text-muted-foreground">{t("magic_link_sent_message", { email: magicEmail })}</p>
      </motion.div>
    )}
  </AnimatePresence>
)}
```

---

## 3. `src/app/(public)/auth/signup/_components/signup-form.tsx`

Add Google button + divider above the form. No tabs needed on signup.

### Additional imports
```ts
import { env } from "env";
import { cn } from "@/app/_libs/utils/cn"; // only if not already imported
```

### Google handler (same pattern as login)
```ts
async function handleGoogle() {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.AUTH.CALLBACK}`,
    },
  });
}
```

### Placement
Insert the Google button + divider (same JSX as login, no `motion.div` wrapper needed — signup uses AnimatePresence at the step level already) between the heading/subtitle block and the `<form>` tag.

---

## Verification checklist

- [ ] `pnpm type:check` — no TypeScript errors
- [ ] `pnpm lint` — no ESLint errors
- [ ] No `bg-cream` on any page wrapper div (body handles it)
- [ ] Enums used: `LoginMethod.Password`, `LoginMethod.MagicLink`, `MagicStep.Form`, `MagicStep.Sent`
- [ ] Google button: white (`bg-card`) with subtle border — NOT teal, NOT black
- [ ] Segmented control: active pill is white (`bg-card`) with `shadow-xs` — NOT black
- [ ] Segmented control container: `bg-border/40` tint — subtle, not harsh
- [ ] Login: "Password" tab → email/password form
- [ ] Login: "Magic Link" tab → email only → "Check your inbox" after submit
- [ ] Signup: Google button visible above the email/password form
- [ ] After Google OAuth, user lands on `/chat`
- [ ] After Magic Link submit, "sent" state appears (no redirect — user must click email)
