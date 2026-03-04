# Project Instructions

## Project Conventions (CRITICAL)

### File and Folder Naming
**CRITICAL:** All files and folders MUST use kebab-case naming.

- Use descriptive, hyphenated names
- Include the file type in the name when helpful: `.test.ts`, `.spec.ts`, `.config.ts`
- For components, match the folder name: `user-profile/user-profile.tsx`

**Correct:**
```
components/user-profile.tsx
pages/order-history/
utils/string-helpers.ts
hooks/use-local-storage.ts
```

**Incorrect:**
```
❌ UserProfile.tsx
❌ dataTable.tsx
❌ order_history/
❌ stringHelpers.ts
```

### Path Aliases
Always use configured path aliases for cleaner imports:

- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/app/*` → `./src/app/*`

```tsx
// ✅ Use path aliases
import { Button } from "@/components/ui/button";
import { cn } from "@/app/_libs/utils/cn";
import { UserService } from "@/app/_libs/services/user.service";

// ❌ Don't use relative imports for distant files
import { Button } from "../../../components/ui/button";
```

### Colocation Patterns
- Keep related components close to where they're used
- Use `_components` for app-wide shared components
- Place page-specific components in the same directory as the page

### Private Folders
- `_components/` - Shared components
- `_libs/` - Utilities and libraries
- `_config/` - Configuration files
- `_types/` - Type definitions

### Documentation
- Use JSDoc for function and class documentation
- Explain why, not what
- Include examples for complex functions
- Use clear section headings with emojis
- Include code examples with proper syntax highlighting
- Provide both quick start and detailed instructions

### Environment Management
- Use `.env` for local development
- Use `.env.example` for environment template
- Never commit actual environment values

## TypeScript Strict Rules

### Type Safety Principles
- Use strict TypeScript configuration as defined in tsconfig.json
- No implicit any types allowed
- Prefer explicit type definitions over type inference when clarity is needed
- Use proper type guards and assertions

### Interface Patterns
- Use PascalCase for interface names
- Prefer interfaces for object shapes that might be extended
- Use descriptive names that indicate purpose

```tsx
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
```

### Type Patterns
- Use type aliases for union types, primitive aliases, and complex computations
- Use utility types when appropriate (Omit, Pick, Partial, etc.)

```tsx
type Status = "pending" | "completed" | "failed";
type CreateUserData = Omit<User, "id" | "createdAt">;
```

### Component Props
- Always type component props explicitly
- Use proper TypeScript patterns for children, events, and refs
- Leverage React built-in types

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline";
  children: React.ReactNode;
}
```

### API Response Types
- Define clear types for API responses
- Use discriminated unions for success/error states
- Type query parameters and request bodies

### Zod Integration
- Use Zod for runtime type validation
- Infer TypeScript types from Zod schemas
- Validate environment variables and API inputs

```tsx
const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
});
type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

### Environment Variables
- Use @t3-oss/env-nextjs for type-safe environment variables
- Define client and server environment variables separately
- Use Zod for validation

## UI Component Architecture

### CVA Pattern (Critical)
Use Class Variance Authority (CVA) for component variants:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
```

### Polymorphic Components (asChild Pattern)
Use the `asChild` prop for polymorphic behavior:

```tsx
import { Slot } from "@radix-ui/react-slot";

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
```

### Radix UI Integration
- Always use Radix UI primitives for complex interactive components
- Preserve Radix's accessibility features
- Add proper ARIA labels and descriptions
- Test with keyboard navigation

```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Content
    ref={ref}
    className={cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200", className)}
    {...props}
  >
    {children}
  </DialogPrimitive.Content>
));
```

## Next.js 15 App Router

### Directory Structure
- Use the `src/app/` directory for all routing and layout files
- Follow Next.js 15 App Router conventions with page.tsx, layout.tsx, loading.tsx, error.tsx
- Use route groups with parentheses for organization: `(public)`, `(private)`
- Place shared components in `src/app/_components/`
- Place configuration in `src/app/_config/`
- Place utilities and services in `src/app/_libs/`

### File Conventions
- Always export default function for pages and layouts
- Use descriptive function names that match the file purpose
- Include TypeScript types for all props
- Use proper metadata exports

### Dynamic Routes
- Use bracket notation for dynamic segments: `[id]`, `[slug]`
- Use spread syntax for catch-all routes: `[...slug]`
- Access params through the `params` prop in server components

### Route Groups
- Use parentheses for route groups that don't affect URL structure
- Group related routes logically: `(auth)`, `(dashboard)`, `(public)`
- Each group can have its own layout.tsx

### Server vs Client Components
- Keep components as server components by default
- Use for data fetching, database queries, static content
- No useState, useEffect, or browser APIs
- Add `"use client"` directive at the top when needed
- Use for interactivity, hooks, browser APIs, event handlers
- Minimize client components to improve performance

### Data Fetching
- Use async/await directly in server components
- Fetch data as close to where it's used as possible
- Use proper error handling with try/catch
- Use loading.tsx for loading states
- Use error.tsx for error boundaries
- Use not-found.tsx for 404 pages

### Image and Font Optimization
- Always use `next/image` instead of `<img>`
- Provide width and height or use fill
- Use appropriate loading strategies
- Use `next/font` for Google Fonts and local fonts
- Define fonts in configuration files
- Use CSS variables for font application

### Performance Features
- Development server runs with Turbopack by default
- Faster builds and hot reloading
- Better error messages and debugging
- Enhanced with React 19 features
- Improved Server Components
- Better hydration and rendering

### Type Safety
- Use generated route types for type safety
- Import from `next/navigation` with proper typing
- Run `next typegen` to generate route types

## Tailwind CSS Styling

### CN Utility (Critical)
Always use the `cn()` utility for combining classes:

```tsx
import { cn } from "@/app/_libs/utils/cn";

// ✅ Use cn() for class merging
<div className={cn(
  "base-classes",
  variant === "primary" && "bg-blue-500",
  size === "large" && "p-4",
  className // Allow override
)} />
```

### Dark Mode Implementation
Use semantic color classes that adapt to dark mode:

```tsx
// ✅ Semantic colors that adapt
<div className="bg-background text-foreground border-border">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>
```

### Mobile-First Responsive Design
Always design for mobile first, then scale up:

```tsx
<div className={cn(
  "flex flex-col gap-4 p-4", // Mobile first
  "md:flex-row md:gap-6 md:p-6", // Tablet
  "lg:gap-8 lg:p-8", // Desktop
  "xl:max-w-6xl xl:mx-auto" // Large screens
)}>
```

## Design System (CRITICAL — Read Before Touching Any className)

This project uses Tailwind CSS v4 with a custom design token system defined in `src/styles/`.
All tokens are CSS custom properties mapped into Tailwind via `@theme inline`.
**Never use hardcoded hex values, Tailwind default color names (blue-500, green-600, etc.), or raw pixel values for anything visual.**

### Token Files Reference

| File | What it controls |
|------|-----------------|
| `src/styles/tokens/colors.css` | All colors — brand, semantic, state |
| `src/styles/tokens/typography.css` | Font sizes, line heights, font families |
| `src/styles/tokens/radius.css` | All border-radius values |
| `src/styles/tokens/shadows.css` | Box shadows |
| `src/styles/tokens/spacing.css` | Container widths |
| `src/styles/tokens/z-index.css` | Z-index stacking |
| `src/styles/TOKENS.md` | Human-readable token reference |

### Color Usage Rules

**Brand palette — use only for brand moments (logo, landing page accents):**
- `bg-cream` / `text-cream` — warm off-white background
- `bg-ink` / `text-ink` — near-black text
- `bg-teal` / `text-teal` — primary brand green
- `bg-lavender` / `text-lavender` — secondary brand purple-tint
- `bg-lavender-dark` / `text-lavender-dark`
- `bg-amber` / `text-amber` — warm accent
- `bg-amber-dark` / `text-amber-dark`

**Semantic palette — use for ALL UI components:**
- `bg-background` / `text-foreground` — page background and body text
- `bg-primary` / `text-primary-foreground` — primary actions (buttons, links)
- `bg-secondary` / `text-secondary-foreground` — secondary surfaces
- `bg-muted` / `text-muted-foreground` — disabled, placeholder, subtle text
- `bg-card` / `text-card-foreground` — card surfaces (white)
- `bg-popover` / `text-popover-foreground` — dropdowns, tooltips
- `border-border` — all borders
- `ring-ring` — focus rings
- `bg-destructive` / `text-destructive-foreground` — errors, deletes

**State palette — use for status indicators:**
- `bg-success-bg text-success-foreground` — success states
- `bg-warning-bg text-warning-foreground` — warnings
- `bg-info-bg text-info-foreground` — info messages
- `text-destructive` / `bg-destructive/15` — inline error text

**Opacity modifier syntax:**
```tsx
// ✅ Correct — Tailwind v4 opacity modifier
<p className="text-ink/60" />        // 60% opacity ink
<div className="bg-teal/10" />       // 10% opacity teal
<div className="border-ink/[0.06]" /> // arbitrary opacity

// ❌ Wrong — never do this
<p style={{ color: "rgba(26,26,26,0.6)" }} />
<div className="bg-[#1A5C4B]" />
```

### Typography Rules

**Font families:**
- font-sans — DM Sans — all body text, UI labels, buttons (DEFAULT)
- font-serif — Georgia — article headlines, editorial moments only
- font-mono — DM Mono — metadata, timestamps, code snippets

**Font sizes — use text-{size} utilities only:**
```tsx
// ✅ Use scale tokens
<p className="text-sm" />      // 0.875rem / 1.25rem line-height
<h2 className="text-2xl" />    // 1.5rem / 2rem line-height
<h1 className="text-5xl" />    // 3rem / 1 line-height

// ❌ Never do this
<p className="text-[14px]" />
<h1 style={{ fontSize: "48px" }} />
```

### Border Radius Rules

Always use named radius tokens, never Tailwind's default scale:

| Token | Class | Use |
|-------|-------|-----|
| --radius-button (10px) | rounded-button | All buttons |
| --radius-card (12px) | rounded-card | All card surfaces |
| --radius-input (10px) | rounded-input | All inputs, textareas |
| --radius-badge (6px) | rounded-badge | All badges, chips, tags |
| --radius-pill (999px) | rounded-pill | Pills, avatars, toggles |
| --radius-sm | rounded-sm | Subtle rounding |
| --radius-md | rounded-md | Medium rounding |
| --radius-lg | rounded-lg | Large rounding |

```tsx
// ✅ Correct
<button className="rounded-button" />
<div className="rounded-card" />
<input className="rounded-input" />

// ❌ Never do this
<button className="rounded-2xl" />
<div className="rounded-[12px]" />
```

### Shadow Rules

```tsx
// ✅ Use shadow scale
<div className="shadow-xs" />   // subtle depth
<div className="shadow-sm" />   // card resting state
<div className="shadow-md" />   // card hover / popover
<div className="shadow-lg" />   // modals, sheets
<div className="shadow-xl" />   // max elevation

// ❌ Never do this
<div style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
```

### Container/Layout Rules

```tsx
// ✅ Use layout utilities
<main className="container-page" />    // max-w 1280px (--container-xl), centered, px-6
<article className="container-content" /> // max-w 800px (--container-content), reading width

// ❌ Never do this
<main className="max-w-[1280px] mx-auto px-6" />
<article className="max-w-[800px]" />
```

### Component Variants

All variant logic MUST use CVA from `src/lib/variants.ts`.
Never write one-off variant ternaries inline.

```tsx
// ✅ Import shared variants
import { buttonVariants, badgeVariants } from "@/lib/variants";

// ✅ Or define local variants using cva()
const cardVariants = cva("rounded-card border border-border bg-card", {
  variants: {
    size: { sm: "p-3", md: "p-6", lg: "p-8" },
    shadow: { none: "", sm: "shadow-sm", md: "shadow-md" },
  },
  defaultVariants: { size: "md", shadow: "sm" },
});

// ❌ Never do this
<div className={isLarge ? "p-8 rounded-[12px] shadow-[0_4px_6px...]" : "p-4 rounded-[12px]"} />
```

## Form Patterns

### React Hook Form + Zod
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

type UserFormData = z.infer<typeof userFormSchema>;

export function UserForm() {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: '', email: '' }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

## Custom Hooks (Essential Patterns)

### Mobile Detection Hook
```tsx
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

### Local Storage Hook
```tsx
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
```

## Error Handling

### Error Boundary Pattern
```tsx
// error.tsx
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => console.error("Page error:", error), [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <h2 className="text-2xl font-semibold">Something went wrong!</h2>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
```

## Testing Essentials

### Component Testing
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("should handle click events", async () => {
  const user = userEvent.setup();
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  await user.click(screen.getByRole("button"));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## Accessibility Essentials
- Use semantic HTML elements first: `<button>`, `<nav>`, `<main>`
- Provide `aria-label` for icon buttons: `<button aria-label="Delete user">`
- Include focus indicators: `focus:ring-2 focus:ring-ring focus:ring-offset-2`

## Accessibility & HTML
- Never nest `<Link><Button>` — use `<Button asChild><Link href="...">` instead.
- Every page must have a `<main id="main-content">` wrapping primary content.
- All `<nav>` elements must have `aria-label="Main navigation"` (or a descriptive label).
- Decorative SVGs and icons must have `aria-hidden="true"`; scrolling/marquee containers must have `aria-hidden="true"`.
- Interactive elements must be `<a>` or `<button>` — never `<div onClick>` or `<span onClick>`.
- Every component using Framer Motion must import `useReducedMotion` and, when `prefersReducedMotion` is true, disable `initial`, `animate`, `whileHover`, and `whileInView`. CSS animations must have `@media (prefers-reduced-motion: reduce)` overrides in animations.css.

## Routing
All route paths come from `ROUTES` in `@/app/_libs/constants/routes`. Never use string literals for paths. When adding a new route, add it to ROUTES first, then use the constant everywhere.

## SEO
- **Public marketing pages** (landing, about, blog, demo): export full metadata including title, description, openGraph, and twitter with og:image.
- **Auth pages and (app)/\*** pages: export metadata with `robots: { index: false, follow: false }`. Do not add indexable SEO metadata to authenticated or private pages.

## Localization
All user-visible text goes through next-intl. Never hardcode English strings in JSX.

- **Server Components**: `const t = await getTranslations("namespace")` — import from `"next-intl/server"`
- **Client Components**: `const t = useTranslations("namespace")` — import from `"next-intl"`
- **Link**: always import from `"@/i18n"`, never from `"next/link"` directly
- **Dates/numbers**: `useFormatters()` in client components, `getServerFormatters(locale)` in server components
- All new translation keys must be added to `messages/en-US.json` before use
- ❌ Never use `useTranslations()` in a Server Component — use `getTranslations()`
- ❌ Never use `getTranslations()` in a Client Component — use `useTranslations()`

## Code Splitting
- `page.tsx` is always a Server Component — **never add `"use client"` to a page file**
- If a page needs Framer Motion or React hooks, extract those parts to a separate file:
  ```
  app/about/page.tsx          ← Server Component, async, fetches data
  app/about/hero-section.tsx  ← "use client", Framer Motion animations
  ```
- `"use client"` is required for: Framer Motion, `useTranslations`, `useState`, `useEffect`, event handlers
- `"use client"` is NOT required for: `getTranslations`, `getMessages`, `getLocale`, data fetching with `async/await`

## Key Utilities
```tsx
// Class name utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Type guards
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
```

---

## Anti-Patterns to Avoid

- Don't use PascalCase, camelCase, or snake_case for files/folders
- Don't use `any` type
- Don't use `unknown` without type guards
- Don't ignore TypeScript errors with @ts-ignore
- Don't use assertion (`as`) unless absolutely necessary
- Don't define types inline in multiple places (extract to interfaces)
- Don't use relative imports for distant files
- Don't place business logic in components
- Don't ignore the colocation patterns
- Don't create deeply nested folder structures
- Don't mix naming conventions within the project
- Don't commit environment files with secrets
- Don't skip forwardRef for reusable components
- Don't use hardcoded colors instead of semantic classes
- Don't use Tailwind default color names (blue-500, green-600, slate-200, etc.)
- Don't use hardcoded hex values in className or style props
- Don't use rounded-2xl, rounded-xl, rounded-lg — use rounded-card, rounded-button, etc.
- Don't use max-w-[XXXpx] for containers — use container-content or container-page
- Don't use inline style={{ boxShadow: ... }} — use shadow scale utilities
- Don't use style={{ fontSize: ... }} — use text-{size} utilities
- Don't define CVA variants locally if a shared variant in src/lib/variants.ts already covers it
- Don't ignore mobile-first responsive design
- Don't use `<img>` instead of `next/image`
- Don't forget "use client" for interactive components
- Don't test implementation details
- Don't write tests that don't test anything meaningful
- Don't forget to clean up after tests
- Don't use generic test descriptions

## Best Practices

- Use kebab-case for all files and folders
- Use strict TypeScript configuration
- Define types close to where they're used
- Use utility types for type transformations
- Leverage type inference where it improves readability
- Use branded types for domain-specific values
- Validate external data with Zod
- Use discriminated unions for state management
- Use strict TypeScript with proper interfaces
- Use CVA for all component variants
- Implement polymorphic behavior with asChild
- Leverage Radix UI primitives for complex components
- Use cn() utility for className merging
- Follow mobile-first responsive design
- Use semantic color variables for dark mode
- Follow AAA pattern (Arrange, Act, Assert)
- Use descriptive test names
- Test behavior, not implementation
- Mock external dependencies
- Use proper test data factories
- Test both happy path and error cases
- Keep tests isolated and independent
- Use semantic queries (getByRole, getByLabelText)
- Test component behavior and accessibility
