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

### Starting a New Feature

When user says `"start [feature] feature"` or `"audit [feature]"`:

1. Find all related files in `apps/web/src` — screens, components, hooks, types, constants, supabase calls, routes
2. Report in this exact format — **no file changes yet**:

```
## Feature Audit: [feature]

### 1. What exists in web today
- Files found: ...
- Flow summary: ...

### 2. Issues to fix in web before mobile replicates
🔴 Must fix: ...
🟡 Nice to fix: ...

### 3. What should move to /libs
- [file/hook/type] → libs/[hooks|types|utils|locales]/
- Reason: mobile will also need this

### 4. What mobile needs to build fresh (mobile-specific only)
- ...

### Suggested order:
1. Fix web issues first
2. Move shared code to /libs
3. Then build mobile
```

### Reviewing Existing Code

When user pastes files for review:

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

### After Audit — Auto-generate Next Steps

After every audit or review, always end with:

```
## Next Commands

**Web agent** (fix issues):
"[exact prompt to paste into web agent]"

**Web agent** (move to /libs):
"[exact prompt to paste into web agent]"

**Mobile agent** (build feature):
"[exact prompt to paste into mobile agent]"
```

## Context Management

When user says "save context": update `memory/MEMORY.md` and `memory/WORK_LOG.md`.

## App-Specific Rules

Each app has its own `CLAUDE.md` — Claude Code loads it automatically when started in that folder.

- `apps/web/CLAUDE.md` — Next.js conventions, design system, animation
- `apps/mobile-app/CLAUDE.md` — Expo conventions, Gluestack, NativeWind
