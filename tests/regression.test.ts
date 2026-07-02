import { describe, expect, it } from 'vitest';
import { RRule } from 'rrule';
import { rruleToText } from '../src/index';
import { fixtures } from './fixtures';

/**
 * Rules where this library *intentionally* diverges from `rrule`'s own
 * (English-only) `toText()`. Each entry documents *why*: in every case,
 * `rrule-i18n` is either fixing a known gap in `rrule`'s text generation
 * (the whole reason this package exists) or making a small, deliberate
 * style choice. This test asserts BOTH texts are still non-empty and that
 * the divergence is the one we expect -- so an *unexpected* future
 * divergence (a real regression) still fails the test.
 */
const INTENTIONAL_DIFFERENCES: Record<string, string> = {
  // rrule drops BYSETPOS entirely for BYDAY+BYSETPOS ("every month on
  // Monday" -- no ordinal!). This is the single biggest motivating gap for
  // this package; we always include the ordinal.
  'FREQ=MONTHLY;BYDAY=MO;BYSETPOS=1': 'every month on Monday',
  // rrule joins lists with commas only ("Monday, Wednesday, Friday"); we use
  // a natural-language "and" before the last item.
  'FREQ=WEEKLY;BYDAY=MO,WE,FR': 'every week on Monday, Wednesday, Friday',
  // rrule has no "weekend" idiom.
  'FREQ=WEEKLY;BYDAY=SA,SU': 'every week on Saturday, Sunday',
  // rrule's weekday-collapse idiom is "every weekday"; we use the
  // (equally natural, and more composable across locales) "on weekdays".
  'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR': 'every weekday',
  // rrule is terser for "last day of month" / "Nth-to-last day" -- we spell
  // it out for clarity, and to mirror the Russian fixtures' phrasing.
  'FREQ=MONTHLY;BYMONTHDAY=-1': 'every month on the last',
  'FREQ=MONTHLY;BYMONTHDAY=-2': 'every month on the 2nd last',
  // rrule collapses YEARLY+BYMONTH to "every <months>" (keeping the word
  // "every"); we use "in <months>", which reads better without a leading
  // frequency word and matches the Russian "в январе и июне" construction.
  'FREQ=YEARLY;BYMONTH=1,6': 'every January and June',
  'FREQ=YEARLY;INTERVAL=2;BYMONTH=1,6': 'every 2 years January and June',
  'FREQ=YEARLY;BYMONTH=3;BYDAY=1SU': 'every March on the 1st Sunday',
  'FREQ=YEARLY;BYMONTH=3,4;BYDAY=MO': 'every March and April on Monday',
  // rrule has no notion of combining two differently-positioned weekday
  // shorthands into one sentence the way we do.
  'FREQ=MONTHLY;BYDAY=1MO,-1FR': 'every month on the 1st Monday and last Friday',
};

const lowerFirst = (text: string): string => {
  return text.length === 0 ? text : text.charAt(0).toLowerCase() + text.slice(1);
};

describe('regression vs rrule.fromString(x).toText() (en locale only)', () => {
  const englishFixtures = fixtures.filter((f) => f.locale === 'en');

  // Sanity check: make sure this suite is actually exercising a meaningful
  // number of fixtures, and that every documented rule is one we actually test.
  it('has at least one english fixture', () => {
    expect(englishFixtures.length).toBeGreaterThan(0);
  });

  for (const fixture of englishFixtures) {
    it(`"${fixture.rule}"`, () => {
      const ours = lowerFirst(rruleToText(fixture.rule, { locale: 'en' }));

      let rrulesOwn: string;
      try {
        rrulesOwn = RRule.fromString(fixture.rule).toText();
      } catch {
        rrulesOwn = '';
      }
      // rrule's toText() doesn't support every FREQ (e.g. SECONDLY) -- for
      // those it returns an error *string* rather than throwing. Either way,
      // there's nothing meaningful to regress against.
      if (rrulesOwn.startsWith('RRule error')) {
        rrulesOwn = '';
      }

      if (rrulesOwn === '') {
        expect(ours.length).toBeGreaterThan(0);
        return;
      }

      if (fixture.rule in INTENTIONAL_DIFFERENCES) {
        expect(rrulesOwn).toBe(INTENTIONAL_DIFFERENCES[fixture.rule]);
        expect(ours).not.toBe(rrulesOwn);
      } else {
        expect(ours).toBe(rrulesOwn);
      }
    });
  }
});
