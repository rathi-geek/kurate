# Design Token Reference

Design tokens for the web app. Single source of truth: `:root` in `src/styles/tokens/`. Tailwind utilities are generated from `@theme inline` in the same files.

---

## 1. How to Use Tokens

- **Where they live:** All design tokens are CSS custom properties defined in `src/styles/tokens/` (e.g. `colors.css`, `radius.css`).
- **Tailwind:** Utility classes come from `@theme inline` mappings. Each token file can define its own `@theme inline` block; Tailwind v4 merges them.
- **Usage:** A `--color-*` token in `@theme` becomes a Tailwind color utility:
  - `--color-teal` → `className="bg-teal"` or `className="text-teal"`
  - For opacity: `bg-teal/20` applies 20% opacity to the teal color.
- **Raw CSS:** Use `var(--token-name)` when you need a value outside Tailwind (e.g. in a custom component or `style` prop).

---

## 2. Color Reference

| Category   | Tokens | Tailwind usage |
|-----------|--------|----------------|
| **Brand** | cream, ink, white, teal, lavender, lavender-dark, amber, amber-dark, danger | `bg-cream`, `text-ink`, `border-teal`, `bg-teal/20`, etc. |
| **Semantic** | background, foreground, primary, primary-foreground, secondary, secondary-foreground, muted, muted-foreground, accent, accent-foreground, card, card-foreground, border, input, ring, destructive, destructive-foreground | `bg-background`, `text-foreground`, `bg-primary text-primary-foreground`, `text-muted-foreground`, etc. |
| **State** | success, success-bg, success-foreground, warning, warning-bg, warning-foreground, info, info-bg, info-foreground | `bg-success-bg text-success-foreground`, `bg-warning-bg`, etc. |

---

## 3. Radius Reference

| Token   | Approx. value | Tailwind / usage |
|---------|----------------|-------------------|
| sm      | 2.4px          | `rounded-sm`     |
| md      | 4.4px          | `rounded-md`     |
| lg      | 6.4px          | `rounded-lg`     |
| xl      | 10.4px         | `rounded-xl`     |
| button  | 10px           | `rounded-button` |
| card    | 12px           | `rounded-card`   |
| input   | 10px           | `rounded-input`  |
| badge   | 6px            | `rounded-badge`  |
| pill    | 999px          | `rounded-pill`   |

Size scale is derived from `--radius-base` (0.4rem). Component tokens are fixed values.

---

## 4. Typography Scale

| Utility   | Font size | Line height |
|-----------|-----------|-------------|
| `text-xs` | 0.75rem   | 1rem        |
| `text-sm` | 0.875rem  | 1.25rem     |
| `text-base` | 1rem   | 1.5rem      |
| `text-lg` | 1.125rem  | 1.75rem     |
| `text-xl` | 1.25rem   | 1.75rem     |
| `text-2xl` | 1.5rem  | 2rem        |
| `text-3xl` | 1.875rem | 2.25rem     |
| `text-4xl` | 2.25rem | 2.5rem      |
| `text-5xl` | 3rem    | 1           |
| `text-6xl` | 3.75rem | 1           |
| `text-7xl` | 4.5rem  | 1           |

**Font families:**

| Token       | Value              | Usage        |
|-------------|--------------------|--------------|
| font-sans   | DM Sans (Next.js)  | `font-sans`  |
| font-serif  | Georgia, Times     | `font-serif` |
| font-mono   | DM Mono (Next.js)  | `font-mono`  |

---

## 5. Shadow Scale

| Token        | Usage         |
|--------------|----------------|
| shadow-xs    | `shadow-xs`    |
| shadow-sm    | `shadow-sm`    |
| shadow-md    | `shadow-md`    |
| shadow-lg    | `shadow-lg`    |
| shadow-xl    | `shadow-xl`    |
| shadow-inner | `shadow-inner` |

All use `rgba(26, 26, 26, …)` for consistent ink tint.

---

## 6. Z-Index Reference

| Variable       | Value | Use for |
|----------------|-------|--------|
| `--z-dropdown` | 1000  | Dropdowns, menus |
| `--z-sticky`   | 1020  | Sticky headers/sidebars |
| `--z-overlay`  | 1040  | Overlays (backdrops) |
| `--z-modal`    | 1060  | Modals, dialogs |
| `--z-popover`  | 1080  | Popovers, tooltip containers |
| `--z-toast`    | 1100  | Toasts, notifications |
| `--z-tooltip`  | 1200  | Tooltips (on top of popovers) |

Use in CSS: `z-index: var(--z-modal)`. Tailwind’s built-in `z-*` scale is separate; use these for layout/component stacking.

---

## 7. Adding New Tokens

1. **Add the raw value** in `:root` in the right token file under `src/styles/tokens/` (e.g. `colors.css`, `radius.css`).
2. **Add the Tailwind mapping** in an `@theme inline { }` block in the same file (e.g. `--color-my-token: var(--my-token);`).
3. **Update this document** with the new token name, value (or usage), and where it’s used.

Keep `:root` as the single source of truth; `@theme` should only reference `:root` via `var()`.
