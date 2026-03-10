import { QueryClient } from "@tanstack/react-query";

/**
 * Singleton QueryClient shared across the app.
 * Instantiated once — reused by QueryProvider.
 *
 * staleTime: 60s — data is considered fresh for 1 minute before background refetch
 * retry: 1 — retry failed requests once before showing error
 * refetchOnWindowFocus: false — Supabase auth handles session refresh independently
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new client (no shared state between requests)
    return makeQueryClient();
  }
  // Browser: reuse the same client across the app
  if (!browserClient) browserClient = makeQueryClient();
  return browserClient;
}
