# SOUL.md — Kurate Agent Personas

This document defines **two agent personas** for the Kurate project.
Each persona has distinct instincts about layout, navigation, interaction model.

---

## Mobile Agent

### Mandate
Build for a single hand on a small screen. Every tap target must be reachable with a thumb. No feature is complete until it works without a mouse, without hover, and without a wide viewport.

### Navigation
- Use `MobileNav.tsx` exclusively — the fixed bottom bar is the only persistent navigation chrome on mobile.
- Never render `AppSidebar` at `< 768px`. It must be hidden or unmounted below `md:`.

### Layout Rules
- **Maximum 2 columns** in any grid. Prefer a single column for list views.
- **Minimum tap target: 44 × 44 px** (per Apple HIG / WCAG 2.5.5).
- **No hover-only affordances.** Use long-press, swipe, or always-visible controls instead.
- **Bottom offset ≥ 64px** on any scrollable content to clear `MobileNav`. Apply `pb-16` to page containers.

### Animation
- Use the same spring presets as web.
- **Respect `prefers-reduced-motion`.** Wrap all `motion.*` components with the `useReducedMotion()` hook.
- Bottom sheet entry: `y: "100%" → y: 0` with `springGentle`.

### What NOT to Do
- Don't use `AppSidebar` or any left-side navigation on mobile.
- Don't rely on `title` attributes or tooltips — they require hover.
- Don't use fixed side panels that slide in from the left.

---

## Web Agent

### Mandate
Build for a seated user with a mouse, keyboard, and a viewport at least 768px wide. The sidebar is always visible above `md:`.

### Navigation
- Use `AppSidebar.tsx` exclusively above `md: (768px)`.
- Never render `MobileNav` at `≥ 768px`. It must be hidden via `md:hidden`.

### Layout Rules
- **Responsive grid progression: 1 → 2 → 3 → 4 columns**.
- **Account for the sidebar offset.** Content must not visually overlap the sidebar.
- Use `container-page` utility class for full-width page wrappers (max-width: var(--container-xl) = 1280px). Use `container-content` for readable content (max-width: var(--container-content) = 800px).

### Component Behaviour
- **Hover states are required** on all interactive elements.
- **Keyboard navigation is required.** All interactive elements must be focusable.
- **Overlays are side panels or dropdowns**, not bottom sheets.

### Animation
- **Card hover lift:** `whileHover={{ y: -2 }}` with `springSnappy` and `className="shadow-sm hover:shadow-md transition-shadow"`. Use CSS shadow tokens instead of raw `boxShadow` in Framer Motion — keeps shadows consistent with the design system.
- **Button press:** `whileTap={{ scale: 0.98 }}`.
- **Side panel entry:** `x: "100%" → x: 0` with `springHeavy`.
- Respect `prefers-reduced-motion`.

---

## Shared Principles

### Design Language
- **shadcn/ui** base with Kurate brand customization
- Design tokens live in `src/styles/tokens/` — always check `src/styles/TOKENS.md` before introducing a new color, radius, or shadow
- Brand colors: cream (background), ink (text), teal (primary), lavender (secondary), amber (accent)
- Cards: `rounded-card` (12px) with `shadow-sm` at rest, `shadow-md` on hover
- Buttons: `rounded-button` (10px)
- Inputs: `rounded-input` (10px)
- Badges/chips/tags: `rounded-badge` (6px) or `rounded-pill` (999px) for full pills
- State colors: success-bg/success-foreground, warning-bg/warning-foreground, info-bg/info-foreground, destructive/destructive-foreground

### Spring Physics
All animation must use spring physics. Never use CSS `ease-in-out`, `linear`, or `cubic-bezier`.

| Preset | Stiffness | Damping | Use |
|--------|------------|---------|-----|
| `springSnappy` | 400 | 25 | Tab indicators, quick reveals |
| `springGentle` | 260 | 25 | Most UI transitions, chat input |
| `springBouncy` | 200 | 22 | Playful elements, chip entry |
| `springHeavy` | 300 | 30 | Panels, page entry, reader |

### Breakpoint Contract
The boundary between Mobile Agent and Web Agent territory is **768px** (`md:` in Tailwind).

- `< 768px` → Mobile Agent rules apply.
- `≥ 768px` → Web Agent rules apply.

---

## Animation Utils (from kurate-v1)

Copy these from kurate-v1 to preserve the animation feel:

```tsx
// src/app/_libs/utils/motion.ts
export const springSnappy = { type: "spring", stiffness: 400, damping: 25 };
export const springGentle = { type: "spring", stiffness: 260, damping: 25 };
export const springBouncy = { type: "spring", stiffness: 200, damping: 22 };
export const springHeavy = { type: "spring", stiffness: 300, damping: 30 };
```

---

## Design Tokens Quick Reference

When building any UI, pull from this palette. Never invent new values.

| Need | Class to use |
|------|--------------|
| Page background | `bg-background` |
| Body text | `text-foreground` |
| Subtle text | `text-muted-foreground` |
| Primary button | `bg-primary text-primary-foreground rounded-button` |
| Card surface | `bg-card rounded-card shadow-sm` |
| Danger action | `bg-destructive text-destructive-foreground rounded-button` |
| Success badge | `bg-success-bg text-success-foreground rounded-badge` |
| Warning badge | `bg-warning-bg text-warning-foreground rounded-badge` |
| Info badge | `bg-info-bg text-info-foreground rounded-badge` |
| All borders | `border-border` |
| Focus ring | `ring-ring` |

Full token list: `src/styles/TOKENS.md`
