import { vi } from 'vitest';

vi.mock('@sentry/react-native', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  wrap: (c: unknown) => c,
}));

vi.mock('posthog-react-native', () => ({
  default: class {
    capture = vi.fn();
    identify = vi.fn();
    reset = vi.fn();
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem:    vi.fn(() => Promise.resolve(null)),
    setItem:    vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
    clear:      vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('react-native', async () => {
  const rn = await vi.importActual<typeof import('react-native')>('react-native');
  return { ...rn, useColorScheme: () => 'light' };
});
