## Expo React Native App — Cursor Rules

### Project Overview
- Expo (SDK 54), Expo Router (typed routes enabled), React Native 0.81, TypeScript
- EAS for builds/updates, Jest + Testing Library for tests
- ESLint + Prettier for linting/formatting
- UI: NativeWind (Tailwind) and GlueStack UI, lucide-react-native icons
- Network utilities via `expo-network`

### High-Level Architecture
- `app/`: File-based routing with Expo Router (`_layout.tsx`, route segments, modals)
- `components/`: Reusable presentational components
- `hooks/`: Reusable hooks (e.g., `useNetworkStatus`)
- `assets/`: Images and icons referenced by `app.config.ts`
- `app.config.ts`: Central config driven by environment; sets `extra` and runtime config

### Source of Truth for Configuration
- Build-time env is set via `app.config.ts` using `APP_ENV`, `NODE_ENV` and `EXPO_PUBLIC_*` vars
- In app code, prefer reading:
  - `process.env.EXPO_PUBLIC_*` (inlined by Expo)
  - Fallbacks: `Constants.expoConfig?.extra` for values exported by `app.config.ts`
- Do not access non-`EXPO_PUBLIC_*` secrets in the app bundle

### Routing & Navigation (Expo Router)
- Create screens under `app/` using file-based routing; avoid manual stack setup via `react-navigation` unless required by Expo Router patterns
- Use `useRouter`, `useLocalSearchParams`, and `Link` from `expo-router`
- Keep screens thin; move business/UI logic into hooks/components

### State, Data & Side Effects
- Co-locate screen-specific state in screens; factor reusable logic into hooks
- For network awareness, reuse `hooks/useNetworkStatus` and `components/NetworkBanner`
- Fetch base URL from `process.env.EXPO_PUBLIC_API_URL` (or `Constants.expoConfig?.extra?.apiUrl` fallback)

### Styling & UI Conventions
- Prefer NativeWind (Tailwind) via `className` for layout/spacing/typography
- Use GlueStack UI for primitives and accessibility
- Keep platform-specific styles minimal; prefer responsive/adaptive styles

### Code Organization & Naming
- Files: kebab-case (`network-banner.tsx`), React components in `.tsx`
- Components: PascalCase (`NetworkBanner`), functions/variables in camelCase
- Group imports: external → alias/internal → relative; prefer named imports

### TypeScript Rules
- Enable strict typing; avoid `any`
- Export explicit types for public utilities/hooks
- Prefer discriminated unions and enums/constants over magic strings

### Error Handling & UX
- Fail fast in hooks/services; surface user-friendly messages in UI
- Handle offline scenarios using `useNetworkStatus`; avoid blocking UI where possible

### Testing
- Use `jest-expo` preset; write RTL tests for components and hooks
- Test error and loading states; keep tests deterministic and platform-agnostic

### Performance
- Use `React.memo`, `useMemo`, `useCallback` thoughtfully to prevent unnecessary re-renders
- Avoid heavy synchronous work on the JS thread; prefer interaction-safe patterns

### Security
- Never commit secrets; only `EXPO_PUBLIC_*` may be read by the app
- Avoid dynamic code execution and unsafe eval-like patterns

### Linting & Formatting
- Run `pnpm lint` and `pnpm format` before commits; keep CI green
- Follow ESLint and Prettier configs in repo; do not disable rules project-wide without discussion

### EAS Build/Updates
- Use `eas.json` profiles: `development`, `preview`, `production`
- Channels are defined per profile; use matching `update` channels

### Cursor Operational Rules
- Prefer adding new screens under `app/` and wiring via Expo Router
- Reuse existing hooks/components; do not duplicate utilities
- Read config from `process.env.EXPO_PUBLIC_*` first; fallback to `Constants.expoConfig?.extra`
- Keep edits scoped and typed; update or create tests when logic changes
- When introducing libraries, use `expo install` compatible packages where possible

### Common Patterns
- Hook pattern: co-locate input validation, return typed result, expose loading/error
- Component pattern: presentational components receive data via props; screens orchestrate

### Anti-Patterns to Avoid
- Business logic in screens/components that belongs in hooks/services
- Direct usage of non-public env vars in app code
- Ad-hoc navigation bypassing Expo Router conventions
- Global mutable state without clear ownership

### Development Workflow
1. Create feature branch
2. Implement changes following these rules
3. Update/add tests where applicable
4. Run linting and formatting
5. Run tests
6. Open PR for review
7. Merge to main after approval

Remember: prioritize maintainability, reliability, and a smooth mobile UX.


