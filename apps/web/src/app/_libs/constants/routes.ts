/**
 * Application route constants. Use these instead of hardcoded path strings.
 */
export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  BLOG: "/blog",
  DEMO: "/demo",

  AUTH: {
    BASE: "/auth",
    LOGIN: "/auth/login",
    CALLBACK: "/auth/callback",
  },

  APP: {
    CHAT: "/chat",
    PROFILE: "/profile",
    SHARED: "/shared",
    GROUPS: "/groups",
    DASHBOARD: "/dashboard",
    ONBOARDING: "/onboarding",
    GROUP: (slug: string) => `/groups/${slug}`,
  },

  ADMIN: {
    BASE: "/admin",
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
  },

  ERROR: {
    UNAUTHORIZED: "/unauthorized",
    FORBIDDEN: "/forbidden",
  },
} as const;

/** Type helper for static routes */
export type AppRoute = string;
