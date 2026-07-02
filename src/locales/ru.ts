import type { RRuleDateFormatter, RRuleFrequency, RRuleLocale } from '../types';
import { joinWithConjunction, ruCount, ruNumeralOrdinalSuffix } from './shared';

type Gender = 'm' | 'f' | 'n';

// 0=Mon..6=Sun, matching `rrule`'s weekday numbering.
const WEEKDAY_NOMINATIVE = [
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
  'воскресенье',
];
const WEEKDAY_ACCUSATIVE = [
  'понедельник',
  'вторник',
  'среду',
  'четверг',
  'пятницу',
  'субботу',
  'воскресенье',
];
const WEEKDAY_DATIVE_PLURAL = [
  'понедельникам',
  'вторникам',
  'средам',
  'четвергам',
  'пятницам',
  'субботам',
  'воскресеньям',
];
const WEEKDAY_GENDER: Gender[] = ['m', 'm', 'f', 'm', 'f', 'f', 'n'];

const MONTH_PREPOSITIONAL = [
  'январе',
  'феврале',
  'марте',
  'апреле',
  'мае',
  'июне',
  'июле',
  'августе',
  'сентябре',
  'октябре',
  'ноябре',
  'декабре',
];

// [nominative singular, genitive singular, genitive plural] -- e.g. "1 день", "2 дня", "5 дней".
const UNIT_COUNT_FORMS: Record<RRuleFrequency, readonly [string, string, string]> = {
  0: ['год', 'года', 'лет'],
  1: ['месяц', 'месяца', 'месяцев'],
  2: ['неделя', 'недели', 'недель'],
  3: ['день', 'дня', 'дней'],
  4: ['час', 'часа', 'часов'],
  5: ['минута', 'минуты', 'минут'],
  6: ['секунда', 'секунды', 'секунд'],
};

// "каждый день", "каждую неделю"... -- accusative time expressions used when interval === 1.
const EVERY_SINGLE: Record<RRuleFrequency, string> = {
  0: 'каждый год',
  1: 'каждый месяц',
  2: 'каждую неделю',
  3: 'каждый день',
  4: 'каждый час',
  5: 'каждую минуту',
  6: 'каждую секунду',
};

// Accusative case (agrees with `weekdayAccusative()` below, as used in the
// "в первый понедельник" / "в первую среду" construction). Masculine and
// neuter accusative are identical to nominative for inanimate nouns here;
// feminine is not ("первая" nominative vs "первую" accusative).
const ORDINAL_WORDS: Record<number, Record<Gender, string>> = {
  1: { m: 'первый', f: 'первую', n: 'первое' },
  2: { m: 'второй', f: 'вторую', n: 'второе' },
  3: { m: 'третий', f: 'третью', n: 'третье' },
  4: { m: 'четвёртый', f: 'четвёртую', n: 'четвёртое' },
  5: { m: 'пятый', f: 'пятую', n: 'пятое' },
};
const ORDINAL_LAST: Record<Gender, string> = {
  m: 'последний',
  f: 'последнюю',
  n: 'последнее',
};

const BUSINESS_WEEK = new Set([0, 1, 2, 3, 4]);

const weekdayGender = (weekday: number): Gender => {
  return WEEKDAY_GENDER[weekday] ?? 'm';
};

const weekdayAccusative = (weekday: number): string => {
  return WEEKDAY_ACCUSATIVE[weekday] ?? WEEKDAY_NOMINATIVE[weekday] ?? `день недели ${weekday}`;
};

const weekdayDativePlural = (weekday: number): string => {
  return WEEKDAY_DATIVE_PLURAL[weekday] ?? `дням недели ${weekday}`;
};

const monthPrepositional = (month: number): string => {
  return MONTH_PREPOSITIONAL[month - 1] ?? `месяце ${month}`;
};

const isFullBusinessWeek = (days: number[]): boolean => {
  return days.length === 5 && days.every((d) => BUSINESS_WEEK.has(d));
};

export const ruLocale: RRuleLocale = {
  code: 'ru',

  frequencyPhrase(freq, interval) {
    // `freq` is validated against the 0..6 RRuleFrequency range before any
    // locale method is ever invoked, so every key of these two lookup
    // tables is covered -- no fallback needed.
    if (interval === 1) return EVERY_SINGLE[freq];
    return `каждые ${ruCount(interval, UNIT_COUNT_FORMS[freq])}`;
  },

  weekdaysPhrase(days) {
    if (isFullBusinessWeek(days)) return 'по будням';
    if (days.length === 2 && days.includes(5) && days.includes(6)) return 'по выходным';
    const names = [...days].sort((a, b) => a - b).map(weekdayDativePlural);
    return `по ${joinWithConjunction(names, 'и')}`;
  },

  nthWeekdayPhrase(pos, weekday) {
    const gender = weekdayGender(weekday);
    let ordinal: string;
    if (pos === -1) {
      ordinal = ORDINAL_LAST[gender];
    } else if (pos >= 1 && pos <= 5) {
      ordinal = ORDINAL_WORDS[pos]![gender];
    } else if (pos < 0) {
      ordinal = `${Math.abs(pos)}-${ruNumeralOrdinalSuffix(gender)} с конца`;
    } else {
      ordinal = `${pos}-${ruNumeralOrdinalSuffix(gender)}`;
    }
    return `в ${ordinal} ${weekdayAccusative(weekday)}`;
  },

  monthsPhrase(months) {
    const names = [...months].sort((a, b) => a - b).map(monthPrepositional);
    return `в ${joinWithConjunction(names, 'и')}`;
  },

  monthdaysPhrase(days) {
    const positives = days.filter((d) => d > 0).sort((a, b) => a - b);
    const negatives = days.filter((d) => d < 0).sort((a, b) => b - a);

    const fragments: string[] = [];
    if (positives.length > 0) {
      fragments.push(
        `${joinWithConjunction(
          positives.map((d) => `${d}-го`),
          'и'
        )} числа`
      );
    }
    for (const d of negatives) {
      if (d === -1) fragments.push('в последний день месяца');
      else fragments.push(`${Math.abs(d)}-й день с конца месяца`);
    }
    return fragments.join(' и ');
  },

  until(date: Date, dateFormatter: RRuleDateFormatter) {
    return `до ${dateFormatter(date, 'ru')}`;
  },

  count(n) {
    return ruCount(n, ['раз', 'раза', 'раз']);
  },

  join(parts) {
    return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
  },
};
