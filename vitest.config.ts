import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    include: ['tests/unit/**/*.test.ts', 'tests/whiteboard/**/*.spec.ts', 'src/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'tests/smoke/**', 'tests/whiteboard/e2e/**', '**/node_modules/**'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      include: ['src/features/whiteboard/**'],
    },
  },
});
