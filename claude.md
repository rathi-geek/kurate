# Monorepo Root — Kurate

## Structure
```
apps/
  web/          # Next.js 16, 90% done
  mobile-app/   # Expo SDK 54, in progress
  documentation/# Docusaurus
libs/
  hooks/        # @kurate/hooks — useSaveItem, useSubmitContent
  query/        # @kurate/query — QueryProvider, client, keys
  types/        # @kurate/types — database, thoughts, groups, people, vault
  utils/        # @kurate/utils — slugify, extract-tags, constants (routes, errors, events)
  locales/      # @kurate/locales — i18n, en/es/pt
supabase/
  migrations/   # 3 files only: initialSchema, functions, seeds
```

## Rules That Apply Everywhere
- **Package manager:** `pnpm` only — never npm or yarn
- **TypeScript:** strict mode, no `any`
- **Formatting:** `.prettierrc` + `eslint.config.js` at root — run `pnpm lint` before done
- **Ports:** web :3001, mobile :19000–19002, docs :3002

## Database — Reset-Based (early stage project)
⚠️ Never create new migration files. Edit these 3 directly:
- `supabase/migrations/*_initialSchema.sql`
- `supabase/migrations/*_functions.sql`
- `supabase/migrations/*_seeds.sql`

Workflow: edit file → tell user → they reset db + run `pnpm db:push` → `pnpm db:types` → implement code.

## Libs — Add Before Creating App-Local Code
Before adding anything to `apps/web/` or `apps/mobile-app/`, check if it belongs in `/libs`:
- Supabase/data hooks → `libs/hooks/`
- DB-mirrored types → `libs/types/`
- Shared constants (routes, errors, events) → `libs/utils/constants/`
- i18n strings → `libs/locales/`

## When Acting as Reviewer
When asked to review code, use this format:

```
## Review: [filename]
### 🔴 Issues (must fix)
### 🟠 Duplication (already exists in /libs)
### 🟡 Libs Gap (should move to /libs)
### 🔵 Simplifications (nice to have)
### ✅ Looks good
```

Flag specifically:
- Code in `mobile-app/hooks|utils|localization|types` that duplicates `/libs`
- Direct Supabase calls in components (should be in hooks)
- Hardcoded strings/routes instead of `@kurate/locales` / `@kurate/utils/constants`
- Missing error/loading states
- `any` types

## Context Management
When user says "save context": update `memory/MEMORY.md` and `memory/WORK_LOG.md`.

## App-Specific Rules
Each app has its own `CLAUDE.md` — Claude Code loads it automatically when started in that folder.
- `apps/web/CLAUDE.md` — Next.js conventions, design system, animation
- `apps/mobile-app/CLAUDE.md` — Expo conventions, Gluestack, NativeWind
