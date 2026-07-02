import { describe, expect, it } from 'vitest';
import {
  buildWeekdaySpecsFromEntries,
  buildWeekdaySpecsFromOptions,
  describeParseError,
  normalize,
  resolveRRuleModule,
} from '../src/normalize';

describe('resolveRRuleModule', () => {
  it('prefers `.default` when present (CJS-interop shape, as seen under Node ESM)', () => {
    const fakeModule = { RRule: class {} } as unknown;
    const ns = { default: fakeModule };
    expect(resolveRRuleModule(ns)).toBe(fakeModule);
  });

  it('falls back to the namespace itself when there is no `.default` (hypothetical true-ESM shape)', () => {
    const fakeModule = { RRule: class {} };
    expect(resolveRRuleModule(fakeModule)).toBe(fakeModule);
  });
});

describe('describeParseError', () => {
  it('returns the message for a real Error', () => {
    expect(describeParseError(new Error('boom'))).toBe('boom');
  });

  it('stringifies non-Error throwables', () => {
    expect(describeParseError('just a string')).toBe('just a string');
    expect(describeParseError(42)).toBe('42');
  });
});

describe('buildWeekdaySpecsFromOptions', () => {
  it('returns null when byweekday is null', () => {
    expect(buildWeekdaySpecsFromOptions(null, null)).toBeNull();
  });

  it('returns null when byweekday is an empty array', () => {
    expect(buildWeekdaySpecsFromOptions([], null)).toBeNull();
  });

  it('returns plain (n: null) specs when there is no bysetpos', () => {
    expect(buildWeekdaySpecsFromOptions([0, 2], null)).toEqual([
      { weekday: 0, n: null },
      { weekday: 2, n: null },
    ]);
  });

  it('cross-products weekdays with bysetpos entries', () => {
    expect(buildWeekdaySpecsFromOptions([0, 2], [1, -1])).toEqual([
      { weekday: 0, n: 1 },
      { weekday: 2, n: 1 },
      { weekday: 0, n: -1 },
      { weekday: 2, n: -1 },
    ]);
  });
});

describe('buildWeekdaySpecsFromEntries', () => {
  it('returns null for undefined entries', () => {
    expect(buildWeekdaySpecsFromEntries(undefined, null)).toBeNull();
  });

  it('returns null for an empty entries array', () => {
    expect(buildWeekdaySpecsFromEntries([], null)).toBeNull();
  });

  it("keeps each entry's own n when present", () => {
    expect(
      buildWeekdaySpecsFromEntries(
        [
          { weekday: 0, n: 1 },
          { weekday: 4, n: -1 },
        ],
        null
      )
    ).toEqual([
      { weekday: 0, n: 1 },
      { weekday: 4, n: -1 },
    ]);
  });

  it('falls back to top-level bysetpos for entries without their own n', () => {
    expect(buildWeekdaySpecsFromEntries([{ weekday: 0 }], [1])).toEqual([{ weekday: 0, n: 1 }]);
  });

  it('leaves n as null when neither the entry nor bysetpos specify a position', () => {
    expect(buildWeekdaySpecsFromEntries([{ weekday: 0 }, { weekday: 2 }], null)).toEqual([
      { weekday: 0, n: null },
      { weekday: 2, n: null },
    ]);
  });
});

describe('normalize: WKST', () => {
  it('does not crash when WKST is present in the RRULE string', () => {
    expect(() => normalize('FREQ=WEEKLY;WKST=SU')).not.toThrow();
  });

  it('does not crash when WKST is absent', () => {
    expect(() => normalize('FREQ=WEEKLY')).not.toThrow();
  });
});

describe('normalize: error message for an unparsable string', () => {
  it('includes the original rule text', () => {
    expect(() => normalize('this is not a valid rrule')).toThrow(/this is not a valid rrule/);
  });
});
