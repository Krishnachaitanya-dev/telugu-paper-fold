import type { AnalyticsEvent, EventName } from './events';

type PropsForEvent<N extends EventName> = Extract<AnalyticsEvent, { name: N }>['props'];

export interface AnalyticsClient {
  track<N extends EventName>(event: N, props: PropsForEvent<N>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
}

class NoopAnalytics implements AnalyticsClient {
  track<N extends EventName>(_event: N, _props: PropsForEvent<N>) {}
  identify(_userId: string, _traits?: Record<string, unknown>) {}
  reset() {}
}

let _client: AnalyticsClient = new NoopAnalytics();

export function setAnalyticsClient(client: AnalyticsClient) {
  _client = client;
}

export const analytics: AnalyticsClient = {
  track: (name, props) => _client.track(name, props),
  identify: (id, traits) => _client.identify(id, traits),
  reset: () => _client.reset(),
};
