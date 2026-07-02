// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  // Plain JS config files at the repo root (this file itself, tsdown.config.ts
  // is TS but not part of the app's own tsconfig "include") get non-type-aware
  // linting only -- they're build tooling, not library source.
  {
    files: ['eslint.config.js'],
    ...js.configs.recommended,
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'tsdown.config.ts', 'vitest.config.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['tsdown.config.ts', 'vitest.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Arrow functions everywhere instead of `function` declarations/expressions.
      'func-style': ['error', 'expression'],
      // Type-only imports/exports must say so -- keeps `verbatimModuleSyntax` honest.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Interpolating a number/boolean into a template string is idiomatic
      // and not a bug risk the way interpolating an object/array is.
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true, allowNullish: false },
      ],
    },
  },
  {
    files: ['tests/**/*.ts'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
    },
  },
  {
    // Both files are fixture/data-driven: test titles come from a `Fixture[]`
    // array (not string literals) and the regression test's branching is
    // deliberate per-fixture logic (unsupported-by-rrule / documented
    // difference / exact match), not an accidentally-skipped assertion --
    // exactly one `expect` path always runs per fixture, by construction.
    files: ['tests/fixtures.ts', 'tests/regression.test.ts', 'tests/rrule-to-text.test.ts'],
    rules: {
      'vitest/valid-title': 'off',
      'vitest/no-conditional-expect': 'off',
    },
  },
  eslintConfigPrettier
);
