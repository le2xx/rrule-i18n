import { describe, expect, it, beforeAll } from 'vitest';
import { rruleToText, tryRruleToText, registerLocale } from '../src/index';
import { ruLocale } from '../src/locales/ru';
import { fixtures } from './fixtures';

beforeAll(() => {
  registerLocale(ruLocale);
});

describe('rruleToText: golden fixtures', () => {
  for (const fixture of fixtures) {
    it(fixture.name, () => {
      expect(rruleToText(fixture.rule, { locale: fixture.locale })).toBe(fixture.expected);
    });
  }
});

describe('rruleToText: locale can be passed as an object without registering it', () => {
  it('accepts the ru locale object directly', () => {
    expect(rruleToText('FREQ=DAILY;INTERVAL=1', { locale: ruLocale })).toBe('Каждый день');
  });
});

describe('rruleToText: input shapes', () => {
  it('accepts a raw RRULE string', () => {
    expect(rruleToText('FREQ=DAILY;INTERVAL=2')).toBe('Every 2 days');
  });

  it('accepts a string with a leading "RRULE:" prefix', () => {
    expect(rruleToText('RRULE:FREQ=DAILY;COUNT=1')).toBe('Every day for 1 time');
  });

  it('accepts a plain RRuleOptionsLike object', () => {
    expect(rruleToText({ freq: 3, interval: 2 })).toBe('Every 2 days');
  });

  it('accepts an { options } wrapper, structurally compatible with an RRule instance', () => {
    expect(rruleToText({ options: { freq: 3, interval: 2 } })).toBe('Every 2 days');
  });

  it('accepts a plain object with byweekday + bysetpos (Nth weekday, general contract)', () => {
    expect(rruleToText({ freq: 1, byweekday: [0], bysetpos: [1] })).toBe(
      'Every month on the 1st Monday'
    );
  });

  it('accepts a plain object with byweekday and no bysetpos (plain weekday listing)', () => {
    expect(rruleToText({ freq: 2, byweekday: [0, 2] })).toBe('Every week on Monday and Wednesday');
  });

  it('accepts a plain object with bysetpos covering multiple weekdays (cross product)', () => {
    expect(rruleToText({ freq: 1, byweekday: [0, 2], bysetpos: [1] })).toBe(
      'Every month on the 1st Monday and on the 1st Wednesday'
    );
  });
});

describe('rruleToText: options', () => {
  it('capitalize defaults to true', () => {
    expect(rruleToText('FREQ=DAILY')).toBe('Every day');
  });

  it('capitalize: false leaves the sentence lowercase', () => {
    expect(rruleToText('FREQ=DAILY', { capitalize: false })).toBe('every day');
  });

  it('honors a custom dateFormatter for UNTIL clauses', () => {
    const text = rruleToText('FREQ=DAILY;UNTIL=20261231T000000Z', {
      dateFormatter: (d) => d.toISOString().slice(0, 10),
    });
    expect(text).toBe('Every day until 2026-12-31');
  });

  it('falls back to fallbackLocale when the requested locale string is not registered', () => {
    expect(rruleToText('FREQ=DAILY', { locale: 'zz', fallbackLocale: 'en' })).toBe('Every day');
  });

  it('falls back to "en" when fallbackLocale is not specified', () => {
    expect(rruleToText('FREQ=DAILY', { locale: 'zz' })).toBe('Every day');
  });

  it('throws when neither the requested locale nor the fallback locale is registered', () => {
    expect(() =>
      rruleToText('FREQ=DAILY', {
        locale: 'totally-unregistered',
        fallbackLocale: 'also-unregistered',
      })
    ).toThrow();
  });

  it('falls back to a default Intl formatter when the locale code is not a valid BCP-47 tag', () => {
    registerLocale({
      code: '!!!not-a-real-locale!!!',
      frequencyPhrase: () => 'freq',
      weekdaysPhrase: () => 'wd',
      nthWeekdayPhrase: () => 'nth',
      monthsPhrase: () => 'months',
      monthdaysPhrase: () => 'monthdays',
      until: (date, formatter) => `until ${formatter(date, '!!!not-a-real-locale!!!')}`,
      count: (n) => `count ${n}`,
      join: (parts) => parts.filter((p): p is string => !!p).join(' '),
    });
    const text = rruleToText('FREQ=DAILY;UNTIL=20261231T000000Z', {
      locale: '!!!not-a-real-locale!!!',
    });
    expect(text).toContain('2026');
  });
});

describe('rruleToText: out-of-range values degrade gracefully instead of crashing', () => {
  it('falls back to a generic label for an out-of-range weekday number', () => {
    expect(rruleToText({ freq: 2, byweekday: [9] })).toContain('weekday 9');
  });

  it('falls back to a generic label for an out-of-range month number', () => {
    expect(rruleToText({ freq: 0, bymonth: [13] })).toContain('month 13');
  });
});

describe('rruleToText: nth-weekday ordinal edge cases (pos < -1 and pos > 5)', () => {
  it('en: 2nd-to-last weekday', () => {
    expect(rruleToText({ freq: 1, byweekday: [4], bysetpos: [-2] })).toBe(
      'Every month on the 2nd-to-last Friday'
    );
  });

  it('en: 6th weekday (beyond the word-form range)', () => {
    expect(rruleToText({ freq: 1, byweekday: [0], bysetpos: [6] })).toBe(
      'Every month on the 6th Monday'
    );
  });

  it('ru: 2nd-to-last weekday, masculine', () => {
    expect(rruleToText({ freq: 1, byweekday: [0], bysetpos: [-2] }, { locale: 'ru' })).toBe(
      'Каждый месяц в 2-й с конца понедельник'
    );
  });

  it('ru: 2nd-to-last weekday, feminine', () => {
    expect(rruleToText({ freq: 1, byweekday: [2], bysetpos: [-2] }, { locale: 'ru' })).toBe(
      'Каждый месяц в 2-я с конца среду'
    );
  });

  it('ru: 6th weekday, neuter (beyond the word-form range)', () => {
    expect(rruleToText({ freq: 1, byweekday: [6], bysetpos: [6] }, { locale: 'ru' })).toBe(
      'Каждый месяц в 6-е воскресенье'
    );
  });
});

describe('rruleToText: BYYEARDAY / BYWEEKNO (best-effort, must not crash)', () => {
  it('appends an approximate-match note for BYYEARDAY', () => {
    expect(rruleToText('FREQ=YEARLY;BYYEARDAY=1,100')).toContain('~');
  });

  it('appends an approximate-match note for BYWEEKNO', () => {
    expect(rruleToText('FREQ=MONTHLY;BYWEEKNO=1', { locale: 'ru' })).toContain('~');
  });
});

describe('rruleToText: negative cases (throws RRuleTextError)', () => {
  it('throws on an unparsable string', () => {
    expect(() => rruleToText('this is not an rrule')).toThrow();
  });

  it('throws on an empty string', () => {
    expect(() => rruleToText('')).toThrow();
  });

  it('throws on null', () => {
    expect(() => rruleToText(null as unknown as never)).toThrow();
  });

  it('throws on undefined', () => {
    expect(() => rruleToText(undefined as unknown as never)).toThrow();
  });

  it('throws on a missing freq', () => {
    expect(() => rruleToText({} as never)).toThrow();
  });

  it('throws on an out-of-range freq', () => {
    expect(() => rruleToText({ freq: 99 as never })).toThrow();
  });

  it('throws on a non-object, non-string input', () => {
    expect(() => rruleToText(123 as unknown as never)).toThrow();
  });

  it('throws when an { options } wrapper has a non-object options', () => {
    expect(() => rruleToText({ options: null } as never)).toThrow();
  });
});

describe('tryRruleToText: never throws', () => {
  it('returns null for null', () => {
    expect(tryRruleToText(null as unknown as never)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(tryRruleToText(undefined as unknown as never)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(tryRruleToText('')).toBeNull();
  });

  it('returns null for a blank (whitespace-only) string', () => {
    expect(tryRruleToText('   ')).toBeNull();
  });

  it('returns null for an unparsable string', () => {
    expect(tryRruleToText('not an rrule at all')).toBeNull();
  });

  it('returns null for a non-object, non-string input', () => {
    expect(tryRruleToText(123 as unknown as never)).toBeNull();
  });

  it('returns a string for a valid rule', () => {
    expect(tryRruleToText('FREQ=DAILY')).toBe('Every day');
  });
});

describe('rruleToText: smoke test across the full fixture matrix', () => {
  it('produces a clean, non-empty string with no "undefined"/"[object Object]" leakage for every fixture', () => {
    for (const fixture of fixtures) {
      const text = rruleToText(fixture.rule, { locale: fixture.locale });
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toContain('undefined');
      expect(text).not.toContain('[object Object]');
      expect(text).not.toContain('NaN');
      expect(text).not.toContain('null');
    }
  });
});
