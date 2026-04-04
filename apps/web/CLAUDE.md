# Web App — Kurate

## What This Is

Chat-based content discovery and curation. Two tabs: Logging (drop links, auto-extract metadata) and Discovering (AI-powered topic search). Built-in article reader. Next.js 16 App Router + Supabase + shadcn/ui + Framer Motion + Tailwind CSS v4.

## Scope

- ✅ `apps/web/` — your workspace
- ✅ `libs/` — consume or extend if mobile also needs it
- ✅ `supabase/migrations/` — edit existing 3 files only, never create new ones
- ❌ `apps/mobile-app/` — never touch

## Key Commands

```bash
pnpm dev          # start dev server
pnpm build        # build
pnpm lint         # must pass before done
pnpm type:check   # must pass before done
pnpm db:types     # regenerate types after schema change
```

## Monorepo Libs — Use Before Creating Locally

| Need            | Package                                                         |
| --------------- | --------------------------------------------------------------- |
| Data fetching   | `@kurate/query` → QueryProvider, client, keys                   |
| Hooks           | `@kurate/hooks` → useSaveItem, useSubmitContent                 |
| Types           | `@kurate/types` → database, thoughts, groups, people, vault     |
| Utils/constants | `@kurate/utils` → routes, errors, events, slugify, extract-tags |
| Translations    | `@kurate/locales` → i18n, en/es/pt                              |

Only create locally in `apps/web/` if it is 100% web-specific.

## Database

⚠️ Reset-based approach — edit these 3 files directly, never create new migration files:

- `supabase/migrations/*_initialSchema.sql`
- `supabase/migrations/*_functions.sql`
- `supabase/migrations/*_seeds.sql`

After editing: notify user → they reset db → `pnpm db:types` → implement code.

## Architecture

- Pages in `src/app/` — **page.tsx is always a Server Component, never add `"use client"`**
- If a page needs Framer Motion or hooks → extract to a sub-component
- API routes in `src/app/api/`
- Supabase client in `src/app/_libs/supabase/`

## Folder Structure

```
src/
├── app/
│   ├── _components/    # shared components
│   ├── _config/        # fonts, metadata
│   ├── _libs/
│   │   ├── supabase/   # supabase client
│   │   ├── utils/      # cn, motion variants, auth utils
│   │   └── constants/  # routes.ts, errors.ts, events.ts
│   ├── _types/         # type definitions
│   └── (routes)/       # pages
├── components/
│   ├── ui/             # shadcn/ui components
│   └── icons/          # ALL SVGs live here, export from index.ts
├── lib/
│   └── variants.ts     # shared CVA: buttonVariants, badgeVariants, inputVariants
└── styles/
    └── tokens/         # colors.css, radius.css, typography.css, shadows.css
```

## Code Conventions

- Files: kebab-case. Components: PascalCase. Never `../../../` — use `@/` aliases.
- TypeScript strict — no `any`
- Forms: React Hook Form + Zod
- Package manager: `pnpm` only

## Design System — CRITICAL

### Colors — semantic tokens only, never hex or Tailwind primitives

| Use                   | Token                                 |
| --------------------- | ------------------------------------- |
| Page bg               | `bg-background`                       |
| Section/sidebar bg    | `bg-surface`                          |
| Card/input/modal bg   | `bg-card`                             |
| Body text             | `text-foreground`                     |
| Headings              | `text-ink`                            |
| Secondary text        | `text-muted-foreground`               |
| Primary button/active | `bg-primary text-primary-foreground`  |
| Borders               | `border-border`                       |
| Focus ring            | `ring-ring`                           |
| Error                 | `text-destructive` / `bg-destructive` |

❌ `text-gray-600` → `text-muted-foreground` | ❌ `bg-white` → `bg-card` | ❌ `bg-[#1A5C4B]` → `bg-primary` | ❌ `rounded-2xl` → `rounded-card`

### Radius tokens

`rounded-button` | `rounded-card` | `rounded-input` | `rounded-badge` | `rounded-pill`

### Typography

`font-sans` (DM Sans, default) | `font-serif` (Georgia, headlines) | `font-mono` (DM Mono, code/meta)

### Layout

`container-page` (1280px) | `container-content` (800px) — never `max-w-[800px]`

### Shadows

`shadow-xs` → `shadow-xl`. Cards: `shadow-sm` rest, `shadow-md` hover. Never inline `style={{ boxShadow }}`.

### Animation — spring physics only, never CSS easing

```ts
// src/app/_libs/utils/motion.ts
springSnappy = { type: "spring", stiffness: 400, damping: 25 }; // tab indicators
springGentle = { type: "spring", stiffness: 260, damping: 25 }; // most UI
springBouncy = { type: "spring", stiffness: 200, damping: 22 }; // playful
springHeavy = { type: "spring", stiffness: 300, damping: 30 }; // panels, page entry
```

Always `const prefersReducedMotion = useReducedMotion()` — disable motion when true.

## Navigation & Routing

- Routes come from `ROUTES` in `@/app/_libs/constants/routes` — never hardcode strings
- `Link` from `"@/i18n"` — never `"next/link"` directly
- `<Button asChild><Link href={ROUTES.x}>` — never `<Link><Button>`

## Localization

- All user-visible text through next-intl — never hardcode English in JSX
- Server component: `const t = await getTranslations("ns")` from `"next-intl/server"`
- Client component: `const t = useTranslations("ns")` from `"next-intl"`

## Breakpoint Contract

- `< 768px` → MobileNav only, no AppSidebar, max 2 columns, min 44×44px tap targets, `pb-16`
- `≥ 768px` → AppSidebar only, no MobileNav, hover states required, keyboard nav required

## Accessibility

- Every page: `<main id="main-content">`
- Every `<nav>`: `aria-label`
- Decorative SVGs: `aria-hidden="true"`
- Interactive elements: `<a>` or `<button>` — never `<div onClick>`

## Icons

All SVGs in `src/components/icons/`. Import from `@/components/icons`. Reference by `IconName` enum. Never define SVGs inline.

## Groups Feature — Pending Work

Before touching any groups code, check `memory/INDEX.md` or ask the user for the current groups status. Known blocked items: slug column missing, RLS bug on group_members, comments.parent_id FK, reactions unique constraint.

## Token Efficiency

- Never explore the codebase blindly
- Only read files explicitly listed in the task
- If you need a file not listed, ask the user — don't go looking

## Feature Workflow

When user says `"fix [feature] issues"` or pastes a reviewer report:

1. Fix all 🔴 issues first
2. Move flagged code to `/libs` as instructed
3. Run `pnpm lint` and `pnpm type:check`
4. Report: "Done — here's what changed: ..."

## Context Management

When user says "save context": update `memory/MEMORY.md` and `memory/WORK_LOG.md`.
