import { describe, expect, it } from 'vitest';
import { registerLocale, rruleToText, type RRuleLocale } from '../src/index';
import { ruLocale } from '../src/locales/ru';

registerLocale(ruLocale);

/** A minimal, deliberately-blank locale (code intentionally not `en`/`ru`) used to exercise fallback branches that only trigger for unrecognized locale codes. */
const blankLocale: RRuleLocale = {
  code: 'zz-blank',
  frequencyPhrase: () => '',
  weekdaysPhrase: () => '',
  nthWeekdayPhrase: (pos, weekday) => `N${pos}W${weekday}`,
  monthsPhrase: () => '',
  monthdaysPhrase: () => '',
  byyeardayPhrase: () => 'YEARDAY',
  byweeknoPhrase: () => 'WEEKNO',
  until: () => '',
  count: () => '',
  join: (parts) => parts.filter((p): p is string => !!p).join(' '),
};

registerLocale(blankLocale);

describe('resolveLocale: unresolvable locale throws (no locale option at all)', () => {
  it('throws when only an unregistered fallbackLocale is given', () => {
    expect(() =>
      rruleToText('FREQ=DAILY', { fallbackLocale: 'totally-unregistered-xyz' })
    ).toThrow();
  });
});

describe('isFullBusinessWeek: does not collapse when the 5 weekday specs carry a position', () => {
  it('keeps the frequency phrase and lists each weekday individually', () => {
    const text = rruleToText({ freq: 2, byweekday: [0, 1, 2, 3, 4], bysetpos: [1] });
    expect(text.startsWith('Every week on the 1st Monday')).toBe(true);
    expect(text).not.toBe('On weekdays');
  });
});

describe('buildWeekdayClause: conjunction fallback for an unrecognized locale code', () => {
  it('defaults to the English "and" connector', () => {
    expect(rruleToText('FREQ=MONTHLY;BYDAY=1MO,-1FR', { locale: 'zz-blank' })).toBe(
      'N1W0 and N-1W4'
    );
  });
});

describe('byyeardayPhrase / byweeknoPhrase: wired through for an unrecognized locale code', () => {
  it('calls byyeardayPhrase for BYYEARDAY', () => {
    expect(rruleToText('FREQ=YEARLY;BYYEARDAY=1,100', { locale: 'zz-blank' })).toBe('YEARDAY');
  });

  it('calls byweeknoPhrase for BYWEEKNO', () => {
    expect(rruleToText('FREQ=MONTHLY;BYWEEKNO=1', { locale: 'zz-blank' })).toBe('WEEKNO');
  });

  it('calls both when a rule has both BYYEARDAY and BYWEEKNO', () => {
    expect(
      rruleToText('FREQ=YEARLY;BYYEARDAY=1;BYWEEKNO=26', { locale: 'zz-blank' })
    ).toBe('YEARDAY WEEKNO');
  });
});

describe('capitalizeFirst: empty-string input', () => {
  it('returns an empty string unchanged instead of throwing', () => {
    expect(rruleToText('FREQ=DAILY', { locale: 'zz-blank' })).toBe('');
  });
});

describe('monthdaysPhrase: multiple negative month-days (exercises the sort comparator)', () => {
  it('en', () => {
    expect(rruleToText('FREQ=MONTHLY;BYMONTHDAY=-1,-3')).toBe(
      'Every month on the last day of the month and on the 3rd-to-last day of the month'
    );
  });

  it('ru', () => {
    expect(rruleToText('FREQ=MONTHLY;BYMONTHDAY=-1,-3', { locale: 'ru' })).toBe(
      'Каждый месяц в последний день месяца и 3-й день с конца месяца'
    );
  });
});

describe('ru.ts: out-of-range weekday/month fall back to a generic label', () => {
  it('weekday out of range in weekdaysPhrase', () => {
    expect(rruleToText({ freq: 2, byweekday: [9] }, { locale: 'ru' })).toContain('9');
  });

  it('weekday out of range in nthWeekdayPhrase', () => {
    expect(rruleToText({ freq: 1, byweekday: [9], bysetpos: [1] }, { locale: 'ru' })).toContain(
      '9'
    );
  });

  it('month out of range in monthsPhrase', () => {
    expect(rruleToText({ freq: 0, bymonth: [13] }, { locale: 'ru' })).toContain('13');
  });
});
