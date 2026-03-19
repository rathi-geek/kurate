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
    HOME: "/home",
    PROFILE: "/profile",
    SHARED: "/shared",
    GROUPS: "/groups",
    PEOPLE: "/people",
    PERSON: (id: string) => `/people/${id}`,
    DASHBOARD: "/dashboard",
    ONBOARDING: "/onboarding",
    GROUP: (id: string) => `/groups/${id}`,
    GROUP_INFO: (id: string) => `/groups/${id}/info`,
    GROUP_JOIN: (inviteCode: string) => `/groups/join/${inviteCode}`,
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
