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
| Need | Package |
|------|---------|
| Data fetching | `@kurate/query` → QueryProvider, client, keys |
| Hooks | `@kurate/hooks` → useSaveItem, useSubmitContent |
| Types | `@kurate/types` → database, thoughts, groups, people, vault |
| Utils/constants | `@kurate/utils` → routes, errors, events, slugify, extract-tags |
| Translations | `@kurate/locales` → i18n, en/es/pt |

Only create locally if it is 100% mobile-specific (device permissions, native gestures, push notifications).

## Architecture
- Screens under `app/` — Expo Router file-based routing
- Keep screens thin: logic in hooks, UI in components
- `useRouter`, `useLocalSearchParams`, `Link` from `expo-router`
- Never use `@react-navigation/native` directly

## Design System

### Colors — semantic tokens only, never hardcode
| Token | Color | Use |
|-------|-------|-----|
| `bg-background` | cream #f5f0e8 | Screen backgrounds |
| `bg-card` | white #ffffff | Card surfaces |
| `bg-primary` | teal #1a5c4b | CTAs, active states |
| `text-foreground` | deep blue #2b5b7e | Body text |
| `text-muted-foreground` | slate #5b7d99 | Secondary text |
| `text-primary-foreground` | white | Text on teal |
| `bg-secondary` | off-white #faf7f2 | Section backgrounds |
| `bg-accent` | light teal #eaf3ef | Icon bg, highlights |
| `border-border` | light navy #dce3ea | Borders, dividers |
| `bg-destructive` | red #b91c1c | Errors, destructive |

❌ Never `style={{ color: '#2b5b7e' }}` or `className="bg-[#f5f0e8]"`

### Components — always Gluestack, never raw React Native
```tsx
// ✅
import { View, Text, HStack, VStack, Card, SafeAreaView, ScrollView } from '@/components/ui/...'
// ❌
import { View, Text, ScrollView } from 'react-native'
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

## Animation
| Use case | Library |
|----------|---------|
| Gesture-driven (swipe, drag) | `react-native-reanimated` |
| Screen/tab transitions | `react-native-reanimated` |
| Entrance/exit fade/slide | `@legendapp/motion` `<Motion.View>` |
| Simple opacity toggle | `@legendapp/motion` |

```tsx
// Entrance — @legendapp/motion
<Motion.View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
  transition={{ type: 'spring', damping: 20 }}>

// Programmatic — Reanimated
const opacity = useSharedValue(0);
opacity.value = withTiming(1, { duration: 400 });
```

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

## Screen Build Checklist
- [ ] Types from `@kurate/types`, not local
- [ ] No hardcoded strings — `@kurate/locales`
- [ ] No hardcoded routes — `@kurate/utils/constants/routes`
- [ ] Supabase calls in hooks, never in screen components
- [ ] Error + loading + offline states handled (`useNetworkStatus`)
- [ ] No `any` types
- [ ] `pnpm lint` and `pnpm format` passing
