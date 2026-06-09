export const TEST_USER = {
  email:    `e2e-test-${Date.now()}@test.instanewstelugu.com`,
  password: 'E2eTest!234',
  displayName: 'E2E Tester',
  username:    'e2etester',
};

export const ROUTES = [
  '/',
  '/search',
] as const;

export const TAB_ROUTES = [
  { testId: 'tab-news',    path: '/' },
  { testId: 'tab-reels',   path: '/' },
  { testId: 'tab-live',    path: '/' },
  { testId: 'tab-chat',    path: '/' },
  { testId: 'tab-profile', path: '/' },
] as const;
