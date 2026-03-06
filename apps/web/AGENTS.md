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

### Color System

Tokens live in `src/styles/tokens/colors.css`. All raw values are in `:root`; Tailwind classes come from `@theme inline`. **Never use hex values or Tailwind color primitives (`text-gray-600`, `bg-blue-500`) anywhere.**

#### Color Families

**1. Surfaces — warm cream scale**
```
bg-background        #F5F0E8   warm cream page background
bg-surface           #FAF7F2   sections, sidebars, tab containers
bg-card              #FFFFFF   cards, inputs, popovers, modals
```
Layer rule: `background` → `surface` (slightly lighter) → `card` (white). Never put a card on a card; never put a `bg-background` inside a `bg-card`.

**2. Text — deep blue scale (darkest is `#143D60`)**
```
text-foreground      #2B5B7E   default body text (use for all prose)
text-muted-foreground #5B7D99  labels, captions, secondary copy
                                — use for placeholders, helper text
text-ink             #143D60   headings, logo, max-contrast moments
                                — use sparingly, not for body text
```
Rule: never reach for a darker blue than `text-ink` (`#143D60`). If something looks too light, first try `text-ink`; if it still needs weight, use `font-bold`, not a darker color.

**3. Brand — green scale**
```
bg-primary / text-primary          #1A5C4B   CTAs, active states, focus rings
bg-brand-50 / text-brand-50        #EAF3EF   tab default bg, pill tints
bg-brand-100                       #C5DDD4   tab hover, badge backgrounds
bg-brand-200                       #8BBDAE   decorative accents only
text-primary (on bg-primary)       use text-primary-foreground (#FFFFFF)
```

#### Semantic Tokens — use these in all app UI

| Situation | Class(es) |
|-----------|-----------|
| Page background | `bg-background` |
| Section / sidebar background | `bg-surface` |
| Card / input / modal background | `bg-card` |
| Default body text | `text-foreground` |
| Headings, logo text | `text-ink` or `font-serif` + `text-ink` |
| Secondary / helper text | `text-muted-foreground` |
| Primary buttons / active pills | `bg-primary text-primary-foreground` |
| Outline / ghost buttons hover | `hover:bg-surface hover:text-foreground` |
| Tab container background | `bg-surface` |
| Active tab pill | `bg-primary text-primary-foreground` |
| Inactive tab text | `text-muted-foreground hover:text-brand` |
| All borders | `border-border` |
| Subtle borders (dividers) | `border-border/50` |
| Focus rings | `ring-ring` (= brand green) |
| Destructive / error | `bg-destructive text-destructive-foreground` |
| Error text inline | `text-destructive` |
| Success | `bg-success-bg text-success-foreground` |
| Warning | `bg-warning-bg text-warning-foreground` |
| Info | `bg-info-bg text-info-foreground` |

#### Brand-moment colors (landing page / logo areas only)
`bg-cream`, `text-ink`, `bg-teal`, `text-teal`, `bg-slate`, `bg-teal-light`, `bg-slate-subtle`, `bg-amber` — **do not use in app UI components**. For app UI always use semantic tokens above.

#### Color anti-patterns
```
❌ text-gray-600              → text-muted-foreground
❌ bg-white                   → bg-card
❌ bg-gray-50                 → bg-surface
❌ text-[#143d60]             → text-ink
❌ bg-[#1a5c4b]               → bg-primary
❌ border-gray-200            → border-border
❌ hover:bg-accent            → hover:bg-surface (buttons) or hover:bg-brand-50 (pills)
❌ text-black / text-white    → text-ink / text-primary-foreground
```

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
❌ bg-[#1A5C4B]              → bg-primary
❌ text-gray-600             → text-muted-foreground
❌ bg-white                  → bg-card
❌ text-black                → text-ink
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
