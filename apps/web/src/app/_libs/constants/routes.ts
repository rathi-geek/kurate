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
    SIGNUP: "/auth/signup",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    CALLBACK: "/auth/callback",
  },

  APP: {
    CHAT: "/chat",
    PROFILE: "/profile",
    SHARED: "/shared",
    GROUPS: "/groups",
    DASHBOARD: "/dashboard",
    GROUP: (slug: string) => `/groups/${slug}`,
  },

  ERROR: {
    UNAUTHORIZED: "/unauthorized",
    FORBIDDEN: "/forbidden",
  },
} as const;

/** Type helper for static routes */
export type AppRoute = string;
