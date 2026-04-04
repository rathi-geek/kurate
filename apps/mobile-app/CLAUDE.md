# Mobile App — Kurate

## Stack

Expo SDK 54, Expo Router (typed routes), React Native 0.81, TypeScript strict, NativeWind + GlueStack UI, lucide-react-native, EAS builds, pnpm workspaces.

## Key Commands

```bash
pnpm dev          # start Expo
pnpm lint         # must pass before done
pnpm format       # must pass before done
```

## Scope

- ✅ `apps/mobile-app/` — your workspace
- ✅ `libs/` — consume only, never modify unless explicitly asked
- ❌ `apps/web/` — never touch
- ❌ New migration files — edit 3 existing files only (`initialSchema`, `functions`, `seeds`), flag user to reset db

## Monorepo Libs — Check Before Creating Anything Locally

| Need            | Package                                                         |
| --------------- | --------------------------------------------------------------- |
| Data fetching   | `@kurate/query` → QueryProvider, client, keys                   |
| Hooks           | `@kurate/hooks` → useSaveItem, useSubmitContent                 |
| Types           | `@kurate/types` → database, thoughts, groups, people, vault     |
| Utils/constants | `@kurate/utils` → routes, errors, events, slugify, extract-tags |
| Translations    | `@kurate/locales` → i18n, en/es/pt                              |

Only create locally if it is 100% mobile-specific (device permissions, native gestures, push notifications).

## Architecture

- Screens under `app/` — Expo Router file-based routing
- Keep screens thin: logic in hooks, UI in components
- `useRouter`, `useLocalSearchParams`, `Link` from `expo-router`
- Never use `@react-navigation/native` directly

## Design System

### Colors — semantic tokens only, never hardcode

| Token                     | Color              | Use                 |
| ------------------------- | ------------------ | ------------------- |
| `bg-background`           | cream #f5f0e8      | Screen backgrounds  |
| `bg-card`                 | white #ffffff      | Card surfaces       |
| `bg-primary`              | teal #1a5c4b       | CTAs, active states |
| `text-foreground`         | deep blue #2b5b7e  | Body text           |
| `text-muted-foreground`   | slate #5b7d99      | Secondary text      |
| `text-primary-foreground` | white              | Text on teal        |
| `bg-secondary`            | off-white #faf7f2  | Section backgrounds |
| `bg-accent`               | light teal #eaf3ef | Icon bg, highlights |
| `border-border`           | light navy #dce3ea | Borders, dividers   |
| `bg-destructive`          | red #b91c1c        | Errors, destructive |

❌ Never `style={{ color: '#2b5b7e' }}` or `className="bg-[#f5f0e8]"`

### Components — always Gluestack, never raw React Native

```tsx
// ✅
import {
  View,
  Text,
  HStack,
  VStack,
  Card,
  SafeAreaView,
  ScrollView,
} from '@/components/ui/...';
// ❌
import { View, Text, ScrollView } from 'react-native';
```

### Typography — always DM Sans

```tsx
<Text className="font-sans text-base font-medium text-foreground" />   // body
<Text className="font-mono text-sm text-muted-foreground" />            // code/meta
```

Never rely on platform default font. Weights: `font-normal` `font-medium` `font-semibold` `font-bold`

### Radius

`rounded-xl` (card) | `rounded-full` (avatar) | `rounded-[10px]` (button/input, set in component) | `rounded-[6px]` (badge)

### Shadows

`shadow-sm` (card lift) | `shadow-md` (elevated) | `shadow-lg` (modal/sheet) — never `style={{ shadowColor }}`

### Styling — NativeWind only

Use `className` prop. Avoid `StyleSheet.create`. For responsive sizing use `useResponsive` hook (`fontSize`, `scale`, `spacing`) — apply via `style` prop when needed.

## State Management

- Server/API state: TanStack Query (`@kurate/query`)
- Global UI state: Zustand — separate domain stores, always use selectors
- Persistent secure state: dedicated store with Expo Secure Storage
- Forms: react-hook-form + zod

## Animation — `react-native-reanimated` only

❌ Never use `@legendapp/motion` — has type compatibility issues with React 19. Only used internally by Gluestack UI components.

```tsx
// Entrance fade/slide
const opacity = useSharedValue(0);
const translateY = useSharedValue(20);
useEffect(() => {
  opacity.value = withTiming(1, { duration: 400 });
  translateY.value = withTiming(0, { duration: 400 });
}, []);
const style = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ translateY: translateY.value }],
}));
// <Animated.View style={style}>...</Animated.View>

// Spring animation
opacity.value = withSpring(1, { damping: 20 });

// Delayed entrance
opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
```

## Localization — NEVER hardcode user-facing strings

All user-visible text MUST use `@kurate/locales` via the `useLocalization` hook. This is a hard rule — no exceptions.

```tsx
// ✅
const { t } = useLocalization();
<Text>{t('auth.login.title')}</Text>
<InputField placeholder={t('auth.login.magic_link_email_placeholder')} />

// ❌ NEVER
<Text>Welcome to Kurate</Text>
<InputField placeholder="you@example.com" />
```

- Import: `import { useLocalization } from '@/context'`
- Keys live in `libs/locales/src/en.json` — check existing keys before adding new ones
- Interpolation: `t('auth.login.magic_link_sent_message', { email })`
- If a key doesn't exist yet, add it to `en.json` (and `es.ts` / `pt.ts` if translations available)

## Component Rules

- Max 200 lines per file, max 50 lines per function/component
- Max 3–4 props — group related props into an object if more needed
- No business logic in screens — belongs in hooks
- No `any` types
- Icons: `lucide-react-native` only — `<Home className="text-primary" size={24} />`

## Lists

```tsx
// ✅ FlatList for dynamic data
<FlatList data={items} keyExtractor={i => i.id} renderItem={...} />
// ❌ ScrollView + map (causes full re-render) — ok only for < 10 static items
```

## Standard Patterns

```tsx
// Screen structure
export default function MyScreen() {
  const { data, isLoading, error } = useMyData();
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error.message} />;
  return <MyFeatureList items={data} />;
}

// Loading
<Skeleton className="h-6 w-3/4 rounded-md" />

// Error
<Alert variant="destructive" className="mx-4 my-2"><AlertText>{message}</AlertText></Alert>

// Empty
<VStack className="flex-1 items-center justify-center gap-4 p-8">
  <Text className="font-sans text-base text-muted-foreground text-center">{message}</Text>
</VStack>
```

## Token Efficiency

- Never explore the codebase blindly
- Only read files explicitly listed in the task
- Reviewer has already done the exploration and will give you exact paths
- If you need a file not listed, ask the user — don't go looking

## Design Reference — Web First

Before building any screen:

1. Find the equivalent screen in `apps/web/src/app/`
2. Extract the design decisions — layout, spacing, colors, component structure
3. Adapt for mobile — same visual language, native patterns

Rules for adapting web → mobile:

- Same color tokens (`bg-primary`, `text-foreground` etc — already matched in design system above)
- Same spacing feel — tighter on mobile but proportional
- Replace hover states with press states
- Replace sidebars/dropdowns with bottom sheets/modals
- Replace multi-column grids with single column
- Web uses shadcn/ui → mobile uses Gluestack equivalent primitives
- Web uses Framer Motion → mobile uses `react-native-reanimated`
- Never copy web JSX directly — always rewrite for React Native

## Feature Workflow

When user says `"build [feature]"` or pastes a reviewer report:

1. Check `/libs` for everything shared first
2. Reference `apps/web/src` for the existing flow and logic
3. Adapt for Expo/NativeWind/Gluestack — never copy web code directly
4. Build screen by screen, checklist before each handoff
5. After each screen: "Done — paste these files into Reviewer for review: ..."

## Screen Build Checklist

- [ ] Types from `@kurate/types`, not local
- [ ] No hardcoded strings — `@kurate/locales`
- [ ] No hardcoded routes — `@kurate/utils/constants/routes`
- [ ] Supabase calls in hooks, never in screen components
- [ ] Error + loading + offline states handled (`useNetworkStatus`)
- [ ] No `any` types
- [ ] `pnpm lint` and `pnpm format` passing
