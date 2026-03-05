# Project Instructions

## Project Conventions

### File and Folder Naming
All files and folders **must** use kebab-case.

```
✅ user-profile.tsx  chat-bubble.tsx  use-local-storage.ts
❌ UserProfile.tsx   dataTable.tsx    stringHelpers.ts
```

### Path Aliases
```ts
@/*            → ./src/*
@/components/* → ./src/components/*
@/app/*        → ./src/app/*
```
Always use aliases. Never use `../../../` relative imports for distant files.

### Private Folders
```
src/app/
├── _components/   shared components
├── _libs/         utilities, services, constants
│   └── constants/ routes.ts, errors.ts, events.ts
├── _config/       fonts, metadata
└── _types/        type definitions
```

---

## Design System (CRITICAL)

This project uses **Tailwind CSS v4** with custom tokens in `src/styles/tokens/`.
Tokens are CSS custom properties in `:root`, mapped to Tailwind via `@theme inline`.

### Colors

| Situation | Use |
|-----------|-----|
| Page background / body text | `bg-background` / `text-foreground` |
| Primary actions | `bg-primary text-primary-foreground` |
| Subtle / muted text | `text-muted-foreground` |
| Cards | `bg-card text-card-foreground` |
| All borders | `border-border` |
| Focus rings | `ring-ring` |
| Errors | `bg-destructive text-destructive-foreground` |
| Success | `bg-success-bg text-success-foreground` |
| Warning | `bg-warning-bg text-warning-foreground` |
| Info | `bg-info-bg text-info-foreground` |

Brand colors (`bg-cream`, `bg-ink`, `bg-teal`, `bg-lavender`, `bg-amber`) are for **brand moments only** — landing page, logo areas, hero sections. Use semantic tokens for all app UI.

### Border Radius — named tokens only

| Element | Class |
|---------|-------|
| Button | `rounded-button` |
| Card | `rounded-card` |
| Input | `rounded-input` |
| Badge / chip / tag | `rounded-badge` |
| Pill / avatar | `rounded-pill` |

Never use `rounded-2xl`, `rounded-xl`, `rounded-[12px]`.

### Shadows

`shadow-xs` → `shadow-sm` → `shadow-md` → `shadow-lg` → `shadow-xl`

Cards: `shadow-sm` at rest, `shadow-md` on hover.

### Typography

- `font-sans` — DM Sans — all body text, UI, buttons (default)
- `font-serif` — Georgia — headlines, editorial moments only
- `font-mono` — DM Mono — metadata, timestamps, code

Sizes: `text-xs` through `text-7xl`. Never `text-[14px]` or `style={{ fontSize }}`.

### Layout

- `container-page` — 1280px max, centered, px-6
- `container-content` — 800px max, for readable prose

Never `max-w-[800px]` or `max-w-[1280px]`.

### Component Variants

All variant logic uses CVA. Shared variants are in `src/lib/variants.ts`:
- `buttonVariants` — 5 variants × 4 sizes
- `badgeVariants` — 5 variants
- `inputVariants` — base input style

```ts
import { buttonVariants, badgeVariants } from "@/lib/variants";
import { cn } from "@/app/_libs/utils/cn";
```

Never write one-off inline ternary variants. Never define a variant that already exists in `variants.ts`.

---

## Routing

All route paths come from `ROUTES` in `@/app/_libs/constants/routes`.
**Never use string literals for paths.**

```ts
import { ROUTES } from "@/app/_libs/constants/routes";
<Link href={ROUTES.AUTH.LOGIN}>Log in</Link>
```

When adding a new route, add it to `ROUTES` first.

---

## Localization

All user-visible text goes through **next-intl**. Never hardcode English strings in JSX.

```ts
// Server Component (no "use client")
const t = await getTranslations("namespace"); // from "next-intl/server"

// Client Component ("use client")
const t = useTranslations("namespace");       // from "next-intl"
```

- Import `Link` from `"@/i18n"` — never from `"next/link"` directly
- Dates/numbers: `useFormatters()` in client, `getServerFormatters(locale)` in server
- Add new keys to `messages/en-US.json` before using them
- ❌ `useTranslations()` in a Server Component → use `getTranslations()`
- ❌ `getTranslations()` in a Client Component → use `useTranslations()`

---

## Code Splitting

`page.tsx` is always a **Server Component** — never add `"use client"` to a page file.

If a page needs Framer Motion or hooks, extract to a sub-component:
```
app/about/page.tsx          ← Server Component, no "use client"
app/about/hero-section.tsx  ← "use client", Framer Motion
```

Requires `"use client"`: Framer Motion, `useTranslations`, `useState`, `useEffect`, event handlers.
Does NOT require `"use client"`: `getTranslations`, `getMessages`, `getLocale`, `async/await` fetching.

---

## Accessibility & HTML

- ❌ Never nest `<Link><Button>` — use `<Button asChild><Link href={ROUTES.x}>`
- Every full page must have `<main id="main-content">` wrapping primary content
- All `<nav>` elements must have `aria-label`
- Decorative SVGs and marquee/auto-play containers: `aria-hidden="true"`
- Interactive elements must be `<a>` or `<button>` — never `<div onClick>`
- Framer Motion: import `useReducedMotion`, disable `initial`/`whileHover`/`whileInView` when true
- CSS animations: add `@media (prefers-reduced-motion: reduce)` overrides in `animations.css`

---

## SEO

- **Public pages** (landing, about, blog, demo): export full `metadata` with `og:image`
- **Auth + app pages**: export `metadata` with `robots: { index: false, follow: false }`

---

## Anti-Patterns

```
❌ bg-[#1A5C4B]              → bg-teal
❌ text-gray-600             → text-muted-foreground
❌ rounded-2xl               → rounded-card
❌ max-w-[800px]             → container-content
❌ style={{ boxShadow }}     → shadow-sm / shadow-md
❌ style={{ fontSize }}      → text-sm / text-base
❌ text-[14px]               → text-sm
❌ href="/auth/login"        → ROUTES.AUTH.LOGIN
❌ import Link from "next/link" → from "@/i18n"
❌ <Link><Button>            → <Button asChild><Link>
❌ "use client" on page.tsx  → extract to sub-component
❌ Hardcoded English in JSX  → t("key")
❌ <div onClick>             → <button> or <a>
❌ <img>                     → next/image
❌ ../../../ imports          → @/ path aliases
❌ PascalCase files          → kebab-case
```
