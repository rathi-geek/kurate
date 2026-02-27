# CLAUDE.md — Kurate (wtf-platform)

## Project Overview
Kurate is a chat-based content discovery and curation app. Two tabs: Logging (drop links, auto-extract metadata) and Discovering (AI-powered topic search and recommendations). Built-in article reader.

## Key Commands
```bash
# Development (uses pnpm)
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Type check
pnpm type:check

# Database
pnpm db:generate
pnpm db:migrate
```

## Architecture
- **Next.js 16** (App Router) — pages in `src/app/`, API routes in `src/app/api/`
- **Supabase** — Postgres database + Auth. Client in `src/app/_libs/supabase/`
- **shadcn/ui** — UI component library built on Radix UI
- **Framer Motion** — All animations. Variants defined in component files
- **Tailwind CSS v4** — Custom design tokens

## Code Conventions
- **File naming:** kebab-case (`chat-bubble.tsx`, `user-profile.tsx`)
- **Private folders:** `_components`, `_libs`, `_config`, `_types`
- **Components:** Use CVA pattern for variants
- **Forms:** React Hook Form + Zod validation
- **TypeScript:** Strict mode enabled

## Folder Structure
```
src/
├── app/
│   ├── _components/     # Shared components
│   ├── _config/         # Configuration files
│   ├── _libs/          # Utilities and libraries
│   │   ├── supabase/   # Supabase client
│   │   └── utils/      # Utility functions (cn, etc.)
│   ├── _types/         # Type definitions
│   └── (routes)/       # App pages
└── components/
    └── ui/             # shadcn/ui components
```

## Git Workflow
- **Run all changes locally** — test before pushing
- **Branch from current work** — don't commit directly to `main`
- **PRs required for main** — all changes to `main` must go through a pull request

## Context Saving
When the user says "save context", "save to memory", or asks to clear the conversation:
1. Save all relevant session context into `memory/MEMORY.md`
2. Update `memory/WORK_LOG.md` with a record of changes

## Reference Docs
- AGENTS.md — Detailed project conventions
- SOUL.md — Agent personas and design principles
- README.md — Getting started
