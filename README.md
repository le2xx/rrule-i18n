# rrule-i18n

Turn a parsed [RFC 5545](https://icalendar.org/iCalendar-RFC-5545/3-3-10-recurrence-rule.html) recurrence rule (`FREQ=...;INTERVAL=...`) into grammatically correct, human-readable text in multiple languages.

```ts
import { rruleToText } from 'rrule-i18n';
import { ruLocale } from 'rrule-i18n/locales/ru';

rruleToText('FREQ=DAILY;INTERVAL=1'); // "Every day"
rruleToText('FREQ=DAILY;INTERVAL=1', { locale: ruLocale }); // "Каждый день"
rruleToText('FREQ=MONTHLY;BYDAY=MO;BYSETPOS=1', { locale: ruLocale }); // "Каждый месяц в первый понедельник"
```

## Why not just use `rrule`'s own `toText()`?

[`rrule`](https://www.npmjs.com/package/rrule) is a great engine for parsing, building, and serializing recurrence rules, and it ships a `toText()` method -- but that method only speaks English, and its extension point (`toText(gettext?, language?)`) is a word-for-word substitution ("Monday" -> "понедельник"). That's not enough for languages with real grammar:

- **Numeral agreement**: `1 день` / `2 дня` / `5 дней` / `11 дней` -- Russian isn't `n % 10`, 11-14 are always the "many" form.
- **Gender agreement**: `в первый понедельник` (masculine) vs. `в первую среду` (feminine) -- the ordinal and the weekday noun have to agree, so they have to be produced together, not as two independent tokens.
- **Case changes by construction**: `в январе` (prepositional) but `по понедельникам` (dative plural) -- the same word takes a different case depending on the surrounding phrase.
- **Idioms**: `FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR` collapses to "on weekdays" / "по будням", not "every day on Monday, Tuesday, Wednesday, Thursday and Friday".

`rrule-i18n` doesn't patch `rrule` -- it builds text itself from the rule's parsed fields, with each language implemented as a self-contained plugin that returns whole, already-agreeing phrases (not single words to interpolate). `rrule` remains a (peer) dependency purely as the RFC 5545 parser for `RRule.fromString()`.

## Install

```sh
npm install rrule-i18n rrule
```

`rrule` is a peer dependency -- you need it installed alongside this package (it's what parses RRULE strings). If you only ever pass already-parsed options objects, you still need it installed for the package to load, but you'll never call into it directly.

## Quick start

```ts
import { rruleToText, tryRruleToText } from 'rrule-i18n';

rruleToText('FREQ=WEEKLY;BYDAY=MO,WE,FR');
// "Every week on Monday, Wednesday and Friday"

rruleToText('FREQ=MONTHLY;BYMONTHDAY=-1');
// "Every month on the last day of the month"

rruleToText('FREQ=YEARLY;BYMONTH=3;BYDAY=1SU');
// "In March on the 1st Sunday"

// Never throws -- returns null instead of throwing on bad input.
tryRruleToText('not a valid rrule'); // null
tryRruleToText(null); // null
```

### Using a locale other than English

English ships in the core package for zero-config use. Every other bundled locale lives at its own subpath so it can be tree-shaken away if you don't use it:

```ts
import { rruleToText, registerLocale } from 'rrule-i18n';
import { ruLocale } from 'rrule-i18n/locales/ru';

// Option A: pass the locale object directly -- no registration needed.
rruleToText('FREQ=DAILY', { locale: ruLocale }); // "Каждый день"

// Option B: register it once (e.g. at app startup), then refer to it by code.
registerLocale(ruLocale);
rruleToText('FREQ=DAILY', { locale: 'ru' }); // "Каждый день"
```

## API

### `rruleToText(rule, options?): string`

Converts a rule to text. Throws `RRuleTextError` if `rule` can't be parsed or turned into text (invalid RRULE string, missing/out-of-range `freq`, `null`/`undefined` input, etc.).

### `tryRruleToText(rule, options?): string | null`

Same as `rruleToText`, but never throws -- returns `null` for any invalid input (`null`, `undefined`, an empty string, an unparsable RRULE string, ...).

### `rule: RRuleLike`

Any of:

- a raw RRULE string, with or without a leading `RRULE:` prefix: `"FREQ=DAILY;INTERVAL=2"`
- an already-parsed options object: `{ freq: 3, interval: 2 }` (using `rrule`'s `Frequency` codes: `YEARLY=0, MONTHLY=1, WEEKLY=2, DAILY=3, HOURLY=4, MINUTELY=5, SECONDLY=6`)
- an object structurally compatible with an `RRule` instance from the `rrule` package (i.e. anything with an `.options` property) -- so you can pass an `RRule` instance straight through: `rruleToText(myRRuleInstance)`

### `options: RRuleTextOptions`

| Option           | Type                                     | Default                                              | Description                                                                  |
| ---------------- | ---------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `locale`         | `string \| RRuleLocale`                  | `'en'`                                               | A registered locale code, or a locale object (see above).                    |
| `fallbackLocale` | `string`                                 | `'en'`                                               | Locale code to fall back to when `locale` is a string that isn't registered. |
| `dateFormatter`  | `(date: Date, locale: string) => string` | `Intl.DateTimeFormat(locale, { dateStyle: 'long' })` | Used to format the date in `UNTIL` clauses.                                  |
| `capitalize`     | `boolean`                                | `true`                                               | Capitalize the first letter of the resulting sentence.                       |

### `registerLocale(locale: RRuleLocale): void`

Registers a locale so it can be referenced later by its `code` string. Not required if you always pass the locale object directly.

### `getLocale(code: string): RRuleLocale | undefined`

Looks up a previously-registered locale.

### `RRuleTextError`

The error class thrown by `rruleToText` (and caught internally by `tryRruleToText`).

## Supported RRULE fields

All seven `FREQ` values (`YEARLY`, `MONTHLY`, `WEEKLY`, `DAILY`, `HOURLY`, `MINUTELY`, `SECONDLY`), plus:

- `INTERVAL`
- `COUNT`
- `UNTIL`
- `BYDAY`, including numeric-prefixed shorthand (`1MO`, `-1FR`) and the general `BYDAY` + `BYSETPOS` form ("the Nth weekday")
- `BYMONTHDAY`, including negative values ("the Nth-to-last day of the month")
- `BYMONTH`
- `WKST` (accepted, currently has no effect on the generated text)
- `BYYEARDAY` / `BYWEEKNO`: not translated in detail -- the generated text is appended with an approximate-match note (e.g. `"(~ approximately)"`) rather than silently dropping the constraint.

## The Angular pipe adapter

There isn't one. `tryRruleToText` is already a plain, side-effect-free function, so wrapping it in a one-line pure pipe (`transform(rule, locale) { return tryRruleToText(rule, { locale }) ?? ''; }`) in your own app is simpler and more transparent than depending on this package to ship Angular-specific code (and to keep pace with your Angular version).

## Adding a new locale

The core engine (`rrule-i18n`'s main entry) has no language-specific text anywhere in it -- it only knows how to normalize a rule's fields and call methods on whatever `RRuleLocale` object it's given. Adding a language is purely additive: write a new file, don't touch the core.

1. **Create `src/locales/<code>.ts`** implementing the `RRuleLocale` interface:

   ```ts
   import type { RRuleLocale } from 'rrule-i18n';

   export const myLocale: RRuleLocale = {
     code: 'xx',
     frequencyPhrase(freq, interval) {
       /* "every day" / "every 2 days" */
     },
     weekdaysPhrase(days) {
       /* "on Monday, Wednesday and Friday"; special-case the full Mon-Fri set */
     },
     nthWeekdayPhrase(pos, weekday) {
       /* "on the first Monday", agreement is this method's job */
     },
     monthsPhrase(months) {
       /* "in January and June" */
     },
     monthdaysPhrase(days) {
       /* "on the 1st and 15th" / "on the last day of the month" */
     },
     until(date, dateFormatter) {
       /* "until " + dateFormatter(date, 'xx') */
     },
     count(n) {
       /* "for 10 times" */
     },
     join(parts) {
       /* combine the non-null clause fragments into one sentence */
     },
   };
   ```

   Each method must return a **complete, already-agreeing phrase fragment** (including whatever preposition or case ending your language needs) -- never a bare word meant to be substituted into a fixed template. That's the whole point: the core engine calls these methods and concatenates their results via `join()`, it never touches individual words.

2. **Register it**, either by consumers calling `registerLocale(myLocale)` themselves, or by publishing it at its own subpath the same way `ru` is (`rrule-i18n/locales/xx`) if you're contributing it back to this package -- add one entry to the `exports` map in `package.json` and one entry to `tsdown.config.ts`'s `entry` map. The core package (`src/index.ts`) is never modified.

3. **Test it** against the same fixture matrix used for `en`/`ru` in `tests/fixtures.ts` -- every `FREQ`, `INTERVAL` edge case your language cares about (numeral agreement, if any), `BYDAY` (plain, "the Nth weekday", and the full-business-week idiom), `BYMONTHDAY`, `BYMONTH`, `COUNT`, and `UNTIL`.

`tests/registry.test.ts` has a minimal example (a fake `xx` locale registered entirely inside a test) proving a third locale really does work end-to-end through `registerLocale()` without any core changes.

## Notable differences from `rrule`'s own `toText()`

`rrule-i18n`'s English output intentionally differs from `rrule.toText()` in a few places -- documented (and regression-tested against `rrule` itself) in `tests/regression.test.ts`:

- `BYDAY` + `BYSETPOS` (e.g. "the first Monday of the month") always includes the ordinal. `rrule`'s own `toText()` drops it entirely (`"every month on Monday"`) -- this is the single biggest gap this package exists to fix.
- Lists use a natural "a, b and c" join instead of `rrule`'s comma-only "a, b, c".
- `YEARLY` + `BYMONTH` renders as `"in January and June"` rather than `"every January and June"`.
- `SECONDLY` is fully supported; `rrule.toText()` doesn't support it at all.

## Development

```sh
npm install
npm run typecheck   # tsc --noEmit
npm run lint        # eslint . (type-aware, flat config)
npm run format      # prettier --write .
npm run build       # tsdown -> ESM (.mjs) + CJS (.cjs) + .d.mts/.d.cts in dist/
npm test            # vitest run --coverage (threshold: 95%)
```

Building requires Node.js `^22.18.0 || >=24.11.0` (tsdown's own requirement); the published package itself only requires Node `>=18` at runtime (see `engines` in `package.json`).

Coding style, enforced by ESLint: arrow function expressions instead of `function` declarations, explicit `import type`/inline `type` modifiers for type-only imports (`verbatimModuleSyntax` in `tsconfig.json`), and `typescript-eslint`'s type-aware `recommended` + `stylistic` rule sets. `tsconfig.json` also enables `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, and `noUnusedParameters`.

## License

MIT
