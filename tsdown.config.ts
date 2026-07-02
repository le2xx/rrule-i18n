import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'locales/en': 'src/locales/en.ts',
    'locales/ru': 'src/locales/ru.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2020',
  deps: {
    neverBundle: ['rrule'],
  },
});
