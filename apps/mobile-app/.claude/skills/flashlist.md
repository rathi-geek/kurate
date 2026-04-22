# FlashList v2 Optimization Skill

> This project uses `@shopify/flash-list` **v2.3.1**. Many v1 concepts (like `estimatedItemSize`) no longer apply.

## Rule: Always FlashList

- **NEVER** use `FlatList` or `SectionList` from `react-native`
- For every dynamic list, use `FlashList` from `@shopify/flash-list`
- `ScrollView` + `.map()` is acceptable only for < 10 static items

```tsx
// CORRECT
import { FlashList } from '@shopify/flash-list';

// FORBIDDEN
import { FlatList } from 'react-native';
import { SectionList } from 'react-native';
```

---

## v2 Key Change: No estimatedItemSize

FlashList v2 handles item sizing automatically. Do NOT add `estimatedItemSize` — it does not exist in the v2 API. If you see it in existing code, remove it.

---

## 1. keyExtractor — Stable Unique IDs

Always derive from `item.id` or a similar stable unique identifier. Never use array index.

```tsx
// CORRECT
keyExtractor={(item) => item.id}

// WRONG — breaks recycling, causes stale renders
keyExtractor={(_, index) => index.toString()}
```

---

## 2. getItemType — Heterogeneous Lists

When a FlashList renders different item shapes (headers, cards, pending posts), provide `getItemType`. This enables correct cell recycling — FlashList reuses cells within the same type pool.

```tsx
// Mixed feed with pending + confirmed items
getItemType={(item) => item.kind}

// Chat with text + media messages
getItemType={(item) => item.type === 'image' ? 'media' : 'text'}
```

This method is called very frequently. Keep it fast — no heavy computations.

---

## 3. overrideItemLayout — Grid Column Span (v2)

In v2, `overrideItemLayout` only controls column `span` for grid layouts (`numColumns > 1`). It no longer controls item size.

```tsx
// Make certain items span full width in a 2-column grid
overrideItemLayout={(layout, item) => {
  if (item.type === 'header') layout.span = 2;
}}
```

---

## 4. Cell Recycling Awareness

FlashList **recycles** cell components — React state persists across recycles. This is critical.

### Avoid useState in Item Components

```tsx
// BAD — imgError persists when cell is recycled for a different item
function MyItem({ item }) {
  const [imgError, setImgError] = useState(false);
  return imgError ? <Fallback /> : <FastImage source={{ uri: item.url }} />;
}

// GOOD — reset state when item changes
function MyItem({ item }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [item.id]);
  return imgError ? <Fallback /> : <FastImage source={{ uri: item.url }} />;
}

// BEST — derive from props, no local state needed
```

### Never Force Remounts via key Prop

Do NOT put a changing `key` prop on the FlashList itself or on sub-components inside `renderItem`. This defeats cell recycling.

```tsx
// BAD — forces full teardown/remount on every count change
<FlashList key={`feed-${pendingCount}`} data={entries} ... />

// GOOD — let FlashList manage recycling
<FlashList data={entries} ... />
```

---

## 5. RenderTarget Awareness

In v2, `renderItem` receives a `target` field: `"Cell"` | `"StickyHeader"` | `"Measurement"`.

Skip analytics, side-effects, or heavy operations when `target === "Measurement"` — these renders are invisible and only used for sizing.

```tsx
renderItem={({ item, target }) => {
  // Skip analytics for measurement renders
  if (target !== 'Measurement') {
    trackImpression(item.id);
  }
  return <MyItem item={item} />;
}}
```

---

## 6. Memoization

### React.memo on All Item Components

Every component rendered by `renderItem` must be wrapped in `React.memo`.

```tsx
export const FeedCard = React.memo(function FeedCard({ item, onPress }) {
  return ( ... );
});
```

### useCallback on renderItem and keyExtractor

```tsx
const renderItem = useCallback(
  ({ item }) => <FeedCard item={item} onPress={handlePress} />,
  [handlePress],
);

const keyExtractor = useCallback(item => item.id, []);
```

### Named Components for ListFooter/Header/Separator

Extract to named components instead of inline arrow functions:

```tsx
// BAD — creates new function every render
ItemSeparatorComponent={() => <View className="h-2" />}

// GOOD
function ItemSeparator() {
  return <View className="h-2" />;
}
// ...
ItemSeparatorComponent={ItemSeparator}
```

---

## 7. drawDistance — Render Ahead

Controls how far ahead (in dp/px) FlashList renders items beyond the visible area. Higher values reduce blank areas during fast scrolling but use more memory.

```tsx
<FlashList drawDistance={250} ... />
```

Default is usually sufficient. Only tune if you see blank areas during fast scrolls.

---

## 8. maintainVisibleContentPosition — Chat UIs

v2 provides rich configuration for chat-like interfaces:

```tsx
<FlashList
  inverted
  maintainVisibleContentPosition={{
    autoscrollToTopThreshold: 10,
    autoscrollToBottomThreshold: 50,
    startRenderingFromBottom: true,
    animateAutoScrollToBottom: true,
  }}
/>
```

- `startRenderingFromBottom` — renders from bottom on initial load (chat with few messages)
- `autoscrollToBottomThreshold` — auto-scroll when new messages arrive and user is near bottom
- `disabled` — set to `true` to opt out entirely

---

## 9. New Arch Features (v2)

These require React Native New Architecture:

- **`masonry`** — masonry grid layout
- **`optimizeItemArrangement`** — reduce column height differences in masonry
- **`onStartReached`** — bi-directional infinite scroll (load older items at top)
- **`maxItemsInRecyclePool`** — limit cached recycled items per type (default: unlimited)

---

## 10. Performance Measurement

```tsx
<FlashList
  onLoad={({ elapsedTimeInMs }) => {
    console.log(`FlashList drew items in ${elapsedTimeInMs}ms`);
  }}
/>
```

Use this during development. Remove or gate behind `__DEV__` before release.

---

## 11. Parent View Must Have flex:1

FlashList requires its parent to have a fixed height or `flex:1`. Without this, it renders at <2px and logs an error.

```tsx
// CORRECT
<View className="flex-1">
  <FlashList ... />
</View>

// WRONG — no height constraint
<View>
  <FlashList ... />
</View>
```

---

## 12. Test in Release Mode

Dev mode adds significant overhead (React DevTools, LogBox). Always profile FlashList performance in release builds:

```bash
npx expo run:ios --configuration Release
```

---

## Quick PR Checklist

```
- [ ] Uses FlashList, not FlatList/SectionList
- [ ] keyExtractor uses stable unique ID (not array index)
- [ ] renderItem wrapped in useCallback
- [ ] Item component wrapped in React.memo
- [ ] getItemType used if list has mixed item shapes
- [ ] No useState in item component (or properly reset on item.id change)
- [ ] No changing `key` prop on FlashList itself
- [ ] No `estimatedItemSize` (v1 prop, removed in v2)
- [ ] Parent View has flex:1 or fixed height
- [ ] No inline arrow functions for Separator/Footer/Header components
- [ ] RenderTarget checked before side-effects in renderItem
```
