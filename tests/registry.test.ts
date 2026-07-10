import { describe, expect, it } from 'vitest';
import { getLocale, registerLocale, rruleToText, type RRuleLocale } from '../src/index';

/**
 * A deliberately trivial third locale, registered only inside this test, to
 * prove the plugin architecture is genuinely extensible at runtime (new
 * language = a new `RRuleLocale` object + `registerLocale()`, no changes to
 * the core engine).
 */
const xxLocale: RRuleLocale = {
  code: 'xx',
  frequencyPhrase: (_freq, interval) => `XX-FREQ-${interval}`,
  weekdaysPhrase: (days) => `XX-WEEKDAYS-${days.join('.')}`,
  nthWeekdayPhrase: (pos, weekday) => `XX-NTH-${pos}-${weekday}`,
  monthsPhrase: (months) => `XX-MONTHS-${months.join('.')}`,
  monthdaysPhrase: (days) => `XX-MONTHDAYS-${days.join('.')}`,
  byyeardayPhrase: (days) => `XX-YEARDAYS-${days.join('.')}`,
  byweeknoPhrase: (weeks) => `XX-WEEKNOS-${weeks.join('.')}`,
  until: (date, formatter) => `XX-UNTIL-${formatter(date, 'xx')}`,
  count: (n) => `XX-COUNT-${n}`,
  join: (parts) => parts.filter((p): p is string => !!p).join(' | '),
};

describe('registerLocale / getLocale: third-party locale extensibility', () => {
  it('is not registered before registerLocale() is called', () => {
    expect(getLocale('xx')).toBeUndefined();
  });

  it('registers and is then retrievable by code', () => {
    registerLocale(xxLocale);
    expect(getLocale('xx')).toBe(xxLocale);
  });

  it('rruleToText actually uses the newly-registered locale when referenced by code', () => {
    expect(rruleToText('FREQ=DAILY;INTERVAL=2', { locale: 'xx' })).toBe('XX-FREQ-2');
  });

  it('the custom locale correctly special-cases the weekday clause', () => {
    expect(rruleToText('FREQ=WEEKLY;BYDAY=MO,WE', { locale: 'xx' })).toBe(
      'XX-FREQ-1 | XX-WEEKDAYS-0.2'
    );
  });

  it('the custom locale is used for COUNT/UNTIL tail clauses too', () => {
    expect(rruleToText('FREQ=WEEKLY;COUNT=3', { locale: 'xx' })).toBe('XX-FREQ-1 | XX-COUNT-3');
  });
});
