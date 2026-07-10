import * as rruleNamespace from 'rrule';
import { RRuleTextError } from './errors';
import type { RRuleFrequency, RRuleLike, RRuleOptionsLike } from './types';

// `rrule` ships as a webpack-bundled CJS file with no `exports` map, so
// Node's native ESM loader can't statically detect its named exports via
// cjs-module-lexer -- `import { RRule } from 'rrule'` throws "Named export
// 'RRule' not found" at runtime under plain Node ESM (it works fine when
// bundled by webpack/esbuild/vite, which resolve CJS packages differently).
// Going through the namespace's `default` (Node's CJS-interop guarantee:
// `default` === `module.exports`) sidesteps that static-analysis limitation.
type RRuleModuleShape = typeof rruleNamespace;

/** Extracted as a standalone, directly-testable function (see tests/normalize.test.ts) rather than an inline expression, since which branch runs depends on how `rrule` happens to be bundled/interop'd in a given environment. */
export const resolveRRuleModule = (ns: unknown): RRuleModuleShape => {
  const withDefault = ns as { default?: RRuleModuleShape };
  return withDefault.default ?? (ns as RRuleModuleShape);
};

const rruleExports: RRuleModuleShape = resolveRRuleModule(rruleNamespace);
const { RRule } = rruleExports;
type RRule = InstanceType<RRuleModuleShape['RRule']>;

/** Extracted for direct testability -- `RRule.fromString` always throws real `Error`s in practice, so the non-Error branch is otherwise unreachable in tests. */
export const describeParseError = (err: unknown): string => {
  return err instanceof Error ? err.message : String(err);
};

/** A single "Nth weekday" entry, e.g. {weekday: 0, n: 1} = "the first Monday". `n === null` means "every occurrence" (plain weekday listing). */
export interface WeekdaySpec {
  weekday: number;
  n: number | null;
}

export interface NormalizedRule {
  freq: RRuleFrequency;
  interval: number;
  count: number | null;
  until: Date | null;
  weekdaySpecs: WeekdaySpec[] | null;
  bymonthday: number[] | null;
  bymonth: number[] | null;
  byyearday: number[] | null;
  byweekno: number[] | null;
}

const VALID_FREQ = new Set([0, 1, 2, 3, 4, 5, 6]);

const toList = (value: number[] | null | undefined): number[] | null => {
  if (!value || !Array.isArray(value) || value.length === 0) return null;
  return value.slice();
};

/** Normalizes a scalar-or-array RRULE option value (as found on `RRule#origOptions`) into an array, or `undefined` when absent. */
const toArray = <T>(value: T | T[] | undefined | null): T[] | undefined => {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value : [value];
};

const isInstanceLike = (rule: unknown): rule is { options: RRuleOptionsLike } => {
  return typeof rule === 'object' && rule !== null && 'options' in rule;
};

interface OrigWeekdayEntry {
  weekday: number;
  n?: number;
}

interface OrigOptionsShape {
  freq: number;
  interval?: number;
  count?: number;
  until?: Date;
  byweekday?: OrigWeekdayEntry | OrigWeekdayEntry[];
  bymonthday?: number | number[];
  bymonth?: number | number[];
  bysetpos?: number | number[];
  byyearday?: number | number[];
  byweekno?: number | number[];
  wkst?: number;
}

/**
 * The result of normalizing any supported `RRuleLike` input. `weekdayEntries`
 * is only populated for the RRULE-string input path, where `rrule`'s
 * `origOptions.byweekday` already gives us precise per-day `n` values
 * (covering shorthand forms like `BYDAY=1MO,-1FR`) -- richer than the public
 * `byweekday: number[]` + `bysetpos: number[]` contract used by the other
 * input shapes.
 */
interface RawExtraction {
  options: RRuleOptionsLike;
  weekdayEntries?: OrigWeekdayEntry[] | undefined;
}

/** Extracts raw options (plus an optional richer weekday-entry hint) from any supported input. */
const extractRaw = (rule: RRuleLike): RawExtraction => {
  if (typeof rule === 'string') {
    const trimmed = rule.trim();
    if (trimmed === '') {
      throw new RRuleTextError('Rule string is empty.');
    }
    let parsed: RRule;
    try {
      parsed = RRule.fromString(trimmed);
    } catch (err) {
      throw new RRuleTextError(
        `Could not parse RRULE string "${rule}": ${describeParseError(err)}`,
        {
          cause: err,
        }
      );
    }
    // `origOptions` reflects exactly what was written in the RRULE string.
    // `options` is rrule's internal, fully-expanded representation used for
    // date iteration -- it back-fills unset fields (e.g. BYMONTHDAY) from
    // DTSTART purely so iteration works, which would otherwise leak bogus
    // "the user specified this" clauses into the generated text.
    const orig = parsed.origOptions as unknown as OrigOptionsShape;

    const weekdayEntries = toArray(orig.byweekday);

    return {
      options: {
        freq: orig.freq as RRuleOptionsLike['freq'],
        interval: orig.interval ?? null,
        count: orig.count ?? null,
        until: orig.until ?? null,
        byweekday: null,
        bymonthday: toArray(orig.bymonthday) ?? null,
        bymonth: toArray(orig.bymonth) ?? null,
        bysetpos: toArray(orig.bysetpos) ?? null,
        byyearday: toArray(orig.byyearday) ?? null,
        byweekno: toArray(orig.byweekno) ?? null,
        // `rrule` always parses WKST into a `Weekday` object when given as a
        // string (never a raw number), and the field isn't surfaced in
        // `NormalizedRule` anyway (WKST doesn't affect generated text -- see
        // the README) -- so there's nothing meaningful to extract here.
        wkst: null,
      },
      weekdayEntries,
    };
  }

  if (isInstanceLike(rule)) {
    if (!rule.options || typeof rule.options !== 'object') {
      throw new RRuleTextError('Invalid rule input: `.options` is missing or not an object.');
    }
    return { options: rule.options };
  }

  if (rule && typeof rule === 'object') {
    return { options: rule };
  }

  throw new RRuleTextError(
    'Invalid rule input: expected an RRULE string, an options object, or an { options } wrapper.'
  );
};

/** Combines plain `byweekday` (number[]) with `bysetpos` (number[]) -- the public, general-purpose way of expressing "the Nth Monday". */
export const buildWeekdaySpecsFromOptions = (
  byweekday: number[] | null,
  bysetpos: number[] | null
): WeekdaySpec[] | null => {
  if (!byweekday || byweekday.length === 0) return null;
  if (bysetpos && bysetpos.length > 0) {
    const specs: WeekdaySpec[] = [];
    for (const n of bysetpos) {
      for (const weekday of byweekday) {
        specs.push({ weekday, n });
      }
    }
    return specs;
  }
  return byweekday.map((weekday) => ({ weekday, n: null }));
};

/** Combines rrule's precise per-day `{weekday, n}` entries with a fallback top-level `bysetpos` for entries that didn't carry their own `n` (e.g. `BYDAY=MO;BYSETPOS=1`). */
export const buildWeekdaySpecsFromEntries = (
  entries: OrigWeekdayEntry[] | undefined,
  bysetpos: number[] | null
): WeekdaySpec[] | null => {
  if (!entries || entries.length === 0) return null;
  const specs: WeekdaySpec[] = [];
  const withoutN: OrigWeekdayEntry[] = [];

  for (const entry of entries) {
    if (typeof entry.n === 'number') {
      specs.push({ weekday: entry.weekday, n: entry.n });
    } else {
      withoutN.push(entry);
    }
  }

  if (withoutN.length > 0) {
    if (bysetpos && bysetpos.length > 0) {
      for (const n of bysetpos) {
        for (const entry of withoutN) specs.push({ weekday: entry.weekday, n });
      }
    } else {
      for (const entry of withoutN) specs.push({ weekday: entry.weekday, n: null });
    }
  }

  return specs;
};

export const normalize = (rule: RRuleLike): NormalizedRule => {
  if (rule === null || rule === undefined) {
    throw new RRuleTextError('Rule is null or undefined.');
  }

  const { options: raw, weekdayEntries } = extractRaw(rule);

  if (typeof raw.freq !== 'number' || !VALID_FREQ.has(raw.freq)) {
    throw new RRuleTextError(`Invalid or missing "freq" value: ${JSON.stringify(raw.freq)}`);
  }

  const interval =
    typeof raw.interval === 'number' && raw.interval > 0 ? Math.floor(raw.interval) : 1;
  const count = typeof raw.count === 'number' && raw.count > 0 ? Math.floor(raw.count) : null;
  const until = raw.until instanceof Date && !Number.isNaN(raw.until.getTime()) ? raw.until : null;

  const bysetpos = toList(raw.bysetpos ?? null);
  const weekdaySpecs = weekdayEntries
    ? buildWeekdaySpecsFromEntries(weekdayEntries, bysetpos)
    : buildWeekdaySpecsFromOptions(toList(raw.byweekday ?? null), bysetpos);

  return {
    freq: raw.freq,
    interval,
    count,
    until,
    weekdaySpecs,
    bymonthday: toList(raw.bymonthday ?? null),
    bymonth: toList(raw.bymonth ?? null),
    byyearday: toList(raw.byyearday ?? null),
    byweekno: toList(raw.byweekno ?? null),
  };
};
