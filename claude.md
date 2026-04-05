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

---

## When Acting as Reviewer

### Keeping the Map Updated

After every feature audit or libs change, update `memory/CODEBASE_MAP.md`:

- Add new files created in web, mobile, or libs
- Mark mobile screens as empty/partial/done
- Add new hooks, types, constants to their sections

### Starting a New Feature

When user says `"start [feature] feature"` or `"audit [feature]"`:

1. Read `memory/CODEBASE_MAP.md` first — use it to locate relevant files fast
2. Read only the relevant files for that feature — no blind scanning
3. Report in this exact format — **no file changes yet**:

```
## Feature Audit: [feature]

### 1. What exists in web today
- Files found: ...
- Flow summary: ...

### 2. Bugs & issues to fix before mobile replicates
🔴 Must fix: ...
🟡 Nice to fix: ...

### 3. Code quality issues
🟣 Should fix:
- God components doing too much — split into smaller components/hooks
- Business logic inside components — move to hooks
- Overly complex logic that can be simplified
- Inconsistent patterns vs rest of codebase
- Missing TypeScript types or use of `any`
- Dead code, unused imports, unnecessary state

### 4. What should move to /libs
- [file/hook/type] → libs/[hooks|types|utils|locales]/
- Reason: mobile will also need this

### 5. What mobile needs to build fresh (mobile-specific only)
- ...

### Suggested order:
1. Fix bugs first
2. Fix code quality issues
3. Move shared code to /libs
4. Then build mobile
```

### Reviewing Existing Code

When user pastes files for review:

```
## Review: [filename]

### 🔴 Bugs & Issues (must fix)
- Runtime errors, silent failures, unhandled promises, race conditions

### 🟠 Duplication (already exists in /libs)
- Code that duplicates @kurate/* packages

### 🟡 Libs Gap (should move to /libs)
- Code mobile will also need

### 🟣 Code Quality (should fix)
- God components doing too much — split into smaller components/hooks
- Business logic inside components — move to hooks
- Overly complex logic that can be simplified
- Inconsistent patterns vs rest of codebase
- Missing TypeScript types or use of `any`
- Dead code, unused imports, unnecessary state

### 🔵 Refactor (nice to have)
- Performance improvements (unnecessary re-renders, missing memo/callback)
- Better naming for clarity
- Structural improvements that aren't urgent

### ✅ Looks good
```

Flag specifically:

- Code in `mobile-app/hooks|utils|localization|types` that duplicates `/libs`
- Direct Supabase calls in components (should be in hooks)
- Hardcoded strings/routes instead of `@kurate/locales` / `@kurate/utils/constants`
- Missing error/loading/empty states
- `any` types
- Components over 200 lines — should be split
- Functions over 50 lines — should be extracted
- More than 3-4 props without grouping

### After Audit — Auto-generate Next Steps

After every audit or review, always end with:

```
## Next Commands

**Web agent** (fix issues):
"Read ONLY these files — do not explore anything else:

Files to fix:
- [exact path of each file with the bug]

Context files (read for understanding only):
- [exact paths of files these depend on]

Fix these specific issues:
- [issue 1 — exact file + line description]
- [issue 2 — exact file + line description]

Do NOT explore. Do NOT launch sub-agents. If you need a file not listed, ask."

**Web agent** (move to /libs):
"Read ONLY these files — do not explore anything else:

Files to move:
- [exact source path] → [exact destination in libs/]

Files that import them (update these imports):
- [exact paths of all files that need import updates]

Do NOT explore. Do NOT launch sub-agents. If you need a file not listed, ask."

**Mobile agent** (build feature):
"Read memory/CODEBASE_MAP.md first, then read ONLY these files:

Shared libs:
- [exact paths from libs/]

Web reference (design + logic):
- [exact web screen/component/hook files]

Existing mobile files:
- [exact mobile files relevant to this feature]

Build [feature] using only what you find in these files.
Do NOT explore. Do NOT launch sub-agents. If you need a file not listed, ask."
```

**Critical:** Always provide exact file paths for every agent. You have already read everything — pass it on. Never leave any agent to explore on their own.

---

## Context Management

When user says "save context": update `memory/MEMORY.md` and `memory/WORK_LOG.md`.

## App-Specific Rules

Each app has its own `CLAUDE.md` — Claude Code loads it automatically when started in that folder.

- `apps/web/CLAUDE.md` — Next.js conventions, design system, animation
- `apps/mobile-app/CLAUDE.md` — Expo conventions, Gluestack, NativeWind
