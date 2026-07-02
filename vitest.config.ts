import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      // types.ts is type-only (interfaces/type aliases erase to nothing at
      // runtime), so it has zero coverable statements -- including it just
      // drags the aggregate down with a meaningless 0%.
      exclude: ['src/**/*.d.ts', 'src/types.ts'],
      thresholds: {
        lines: 95,
        branches: 95,
        functions: 95,
        statements: 95,
      },
      all: true,
    },
  },
});
