import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  define: {
    __DEV__: 'true',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.*', 'src/**/*.spec.*'],
      thresholds: {
        lines:     60,
        functions: 60,
        branches:  55,
      },
    },
  },
  resolve: {
    alias: {
      '@/core':     path.resolve(__dirname, 'src/core'),
      '@/features': path.resolve(__dirname, 'src/features'),
      '@/design':   path.resolve(__dirname, 'src/design'),
      '@/shared':   path.resolve(__dirname, 'src/shared'),
      '@':          path.resolve(__dirname, '.'),
    },
  },
});
