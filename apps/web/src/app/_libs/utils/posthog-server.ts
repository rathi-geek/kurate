import { env } from "env";
import { PostHog } from "posthog-node";

let posthogInstance: PostHog | null = null;

export function getPostHogServer() {
  if (!posthogInstance) {
    posthogInstance = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY ?? "", {
      host: env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0, // Because server-side functions in Next.js can be short-lived we flush regularly
    });
  }
  return posthogInstance;
}

export async function captureServerException(error: unknown, distinctId?: string) {
  const client = getPostHogServer();
  client.captureException(error, distinctId || undefined, {
    environment: env.NEXT_PUBLIC_POSTHOG_ENVIRONMENT,
  });
}
