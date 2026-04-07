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

## Database

- Base schema lives in `supabase/migrations/01_initial_schema.sql`, `02_functions.sql`, `03_seed.sql` — do NOT edit these directly
- For schema changes, create new migration files with date prefix: `YYYYMMDD_description.sql`
- Workflow: create migration file → tell user → they run `pnpm db:push` → `pnpm db:types` → implement code

## Libs — Add Before Creating App-Local Code

Before adding anything to `apps/web/` or `apps/mobile-app/`, check if it belongs in `/libs`:

- Supabase/data hooks → `libs/hooks/`
- DB-mirrored types → `libs/types/`
- Shared constants (routes, errors, events) → `libs/utils/constants/`
- i18n strings → `libs/locales/`

---

## When Acting as Reviewer

### Two Memory Files You Maintain

**1. `memory/CODEBASE_MAP.md`** — static path index, updated when files are added/removed

- All libs exports with exact paths
- All web screens, hooks, components with exact paths
- All mobile screens, hooks, components with exact paths + status (empty/partial/done)
- Built once using `find` shell commands — never by reading file contents
- Updated after each feature when new files are created

**2. `memory/FEATURE_PLAN.md`** — always overwritten with current feature

- Simply overwrite it every time a new feature starts
- No archiving needed — WORK_LOG.md captures what was built

---

### Keeping CODEBASE_MAP.md Updated

⚠️ Always use shell `find` commands — never launch explore sub-agents:

```bash
find apps/web/src -name "*.tsx" -o -name "*.ts" | grep -v node_modules | sort
find apps/mobile-app/app apps/mobile-app/components apps/mobile-app/hooks -name "*.tsx" -o -name "*.ts" | grep -v node_modules | sort
find libs -name "*.ts" | grep -v node_modules | sort
```

---

### Starting a New Feature

When user says `"start [feature] feature"` or `"audit [feature]"`:

1. Read `memory/CODEBASE_MAP.md` — locate relevant files from the index
2. Read ONLY those relevant files — no blind scanning
3. If something missing from map → use `find` on that specific folder, update map
4. Write audit report (no file changes yet)
5. Write `memory/FEATURE_PLAN.md` with full feature plan

Audit format:

```
## Feature Audit: [feature]

### 1. What exists in web today
- Files found: [exact paths]
- Flow summary: ...

### 2. Bugs & issues to fix before mobile replicates
🔴 Must fix: ...
🟡 Nice to fix: ...

### 3. Code quality issues
🟣 Should fix:
- God components, business logic in components, missing types, dead code

### 4. What should move to /libs
- [exact file path] → [exact libs destination]
- Reason: ...

### 5. What mobile needs to build fresh
- [list with exact new file paths to create]
```

FEATURE_PLAN.md format:

```
# Feature Plan: [feature]
Last updated: [date]

## Order of execution (always follow this sequence)
1. Web — fix bugs
2. Web — code quality
3. Web — move to /libs
4. Mobile — build feature

## Web — Step by Step

### Step 1: Fix bugs
File: [exact path]
- Issue: [exact problem]
- Fix: [exactly what to change]

### Step 2: Code quality
File: [exact path]
- Issue: [exact problem]
- Fix: [exactly what to change]

### Step 3: Move to /libs
- Move: [exact source path] → [exact destination path]
- Why: [reason]
- Update imports in: [exact list of files that import it]

## Mobile — Step by Step

### Step 1: [first thing to build]
New file: [exact path to create]
Read for reference:
- [exact web file] — [what to extract from it e.g. "card layout, spacing, color usage"]
- [exact lib file] — [what to use from it]
Read existing mobile:
- [exact mobile file] — [why]
Key design decisions from web:
- [specific layout note e.g. "card has 12px padding, image is 16:9 ratio"]
- [specific interaction note e.g. "long press shows action sheet with 3 options"]
- [specific token note e.g. "uses bg-card with shadow-sm, rounded-card"]
Build instructions:
- [exact step 1]
- [exact step 2]

### Step 2: [next thing to build]
...

## Next Commands

**Web agent:**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.
Follow Web Steps 1-3 exactly as written in the plan.
If missing from map → explore that folder only, update map, proceed."

**Mobile agent:**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.
Follow Mobile Steps in order as written in the plan.
If missing from map → explore that folder only, update map, proceed."
```

**Critical rules:**

- Always write FEATURE_PLAN.md to disk — never just print in chat
- Never ask the user to decide the order — decide it yourself
- Always include extracted design decisions for mobile — specific tokens, spacing, interactions
- Always include exact new file paths mobile needs to create

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
"Read memory/CODEBASE_MAP.md first, then read ONLY these files:

Files to fix:
- [exact path of each file with the bug]

Context files (read for understanding only):
- [exact paths of files these depend on]

Fix these specific issues:
- [issue 1 — exact file + line description]
- [issue 2 — exact file + line description]

If something is missing from the map → explore that specific folder only, update the map, then proceed."

**Web agent** (move to /libs):
"Read memory/CODEBASE_MAP.md first, then read ONLY these files:

Files to move:
- [exact source path] → [exact destination in libs/]

Files that import them (update these imports):
- [exact paths of all files that need import updates]

If something is missing from the map → explore that specific folder only, update the map, then proceed."

**Mobile agent** (build feature):
"Read memory/CODEBASE_MAP.md first, then read ONLY these files:

Shared libs:
- [exact paths from libs/]

Web reference (design + logic):
- [exact web screen/component/hook files]

Existing mobile files:
- [exact mobile files relevant to this feature]

Build [feature] using only what you find in these files.
If something is missing from the map → explore that specific folder only, update the map, then proceed."
```

**Critical:** Always provide exact file paths for every agent. You have already read everything — pass it on. Never leave any agent to explore on their own.

---

## Context Management

When user says "save context": update `memory/MEMORY.md` and `memory/WORK_LOG.md`.
When a feature is complete: append summary to `memory/WORK_LOG.md`, archive plan to `memory/plans/`.

## App-Specific Rules

Each app has its own `CLAUDE.md` — Claude Code loads it automatically when started in that folder.

- `apps/web/CLAUDE.md` — Next.js conventions, design system, animation
- `apps/mobile-app/CLAUDE.md` — Expo conventions, Gluestack, NativeWind
