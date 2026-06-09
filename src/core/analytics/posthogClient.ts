import PostHog from 'posthog-react-native';
import type { AnalyticsClient } from './analytics';

export function createPostHogClient(apiKey: string): AnalyticsClient {
  const client = new PostHog(apiKey, {
    host: 'https://app.posthog.com',
    flushAt: 10,
    flushInterval: 10_000,
  });

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    track(name: string, props: any) {
      client.capture(name, props);
    },
    identify(userId: string, traits?: Record<string, unknown>) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client.identify(userId, traits as any);
    },
    reset() {
      client.reset();
    },
  } as AnalyticsClient;
}
