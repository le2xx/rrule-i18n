import type { RRuleDateFormatter, RRuleFrequency, RRuleLocale } from '../types';
import { joinWithConjunction, ordinalEn } from './shared';

const UNIT_NAMES: Record<RRuleFrequency, string> = {
  0: 'year',
  1: 'month',
  2: 'week',
  3: 'day',
  4: 'hour',
  5: 'minute',
  6: 'second',
};

const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const BUSINESS_WEEK = new Set([0, 1, 2, 3, 4]);

const weekdayName = (weekday: number): string => {
  return WEEKDAY_NAMES[weekday] ?? `weekday ${weekday}`;
};

const monthName = (month: number): string => {
  return MONTH_NAMES[month - 1] ?? `month ${month}`;
};

const isFullBusinessWeek = (days: number[]): boolean => {
  return days.length === 5 && days.every((d) => BUSINESS_WEEK.has(d));
};

export const enLocale: RRuleLocale = {
  code: 'en',

  frequencyPhrase(freq, interval) {
    // `freq` is validated against the 0..6 RRuleFrequency range before any
    // locale method is ever invoked, so every key of UNIT_NAMES is covered.
    const unit = UNIT_NAMES[freq];
    if (interval === 1) return `every ${unit}`;
    return `every ${interval} ${unit}s`;
  },

  weekdaysPhrase(days) {
    if (isFullBusinessWeek(days)) return 'on weekdays';
    if (days.length === 2 && days.includes(5) && days.includes(6)) return 'on weekends';
    const names = [...days].sort((a, b) => a - b).map(weekdayName);
    return `on ${joinWithConjunction(names, 'and')}`;
  },

  nthWeekdayPhrase(pos, weekday) {
    const day = weekdayName(weekday);
    if (pos === -1) return `on the last ${day}`;
    if (pos < 0) return `on the ${ordinalEn(Math.abs(pos))}-to-last ${day}`;
    return `on the ${ordinalEn(pos)} ${day}`;
  },

  monthsPhrase(months) {
    const names = [...months].sort((a, b) => a - b).map(monthName);
    return `in ${joinWithConjunction(names, 'and')}`;
  },

  monthdaysPhrase(days) {
    const positives = days.filter((d) => d > 0).sort((a, b) => a - b);
    const negatives = days.filter((d) => d < 0).sort((a, b) => b - a);

    const fragments: string[] = [];
    if (positives.length > 0) {
      fragments.push(`on the ${joinWithConjunction(positives.map(ordinalEn), 'and')}`);
    }
    for (const d of negatives) {
      if (d === -1) fragments.push('on the last day of the month');
      else fragments.push(`on the ${ordinalEn(Math.abs(d))}-to-last day of the month`);
    }
    return joinWithConjunction(fragments, 'and');
  },

  byyeardayPhrase(days) {
    const positives = days.filter((d) => d > 0).sort((a, b) => a - b);
    const negatives = days.filter((d) => d < 0).sort((a, b) => b - a);

    const fragments: string[] = [];
    if (positives.length > 0) {
      fragments.push(
        `on the ${joinWithConjunction(positives.map(ordinalEn), 'and')} day of the year`
      );
    }
    for (const d of negatives) {
      if (d === -1) fragments.push('on the last day of the year');
      else fragments.push(`on the ${ordinalEn(Math.abs(d))}-to-last day of the year`);
    }
    return joinWithConjunction(fragments, 'and');
  },

  byweeknoPhrase(weeks) {
    const positives = weeks.filter((w) => w > 0).sort((a, b) => a - b);
    const negatives = weeks.filter((w) => w < 0).sort((a, b) => b - a);

    const fragments: string[] = [];
    if (positives.length > 0) {
      fragments.push(
        `in the ${joinWithConjunction(positives.map(ordinalEn), 'and')} week of the year`
      );
    }
    for (const w of negatives) {
      if (w === -1) fragments.push('in the last week of the year');
      else fragments.push(`in the ${ordinalEn(Math.abs(w))}-to-last week of the year`);
    }
    return joinWithConjunction(fragments, 'and');
  },

  until(date: Date, dateFormatter: RRuleDateFormatter) {
    return `until ${dateFormatter(date, 'en')}`;
  },

  count(n) {
    return `for ${n} time${n === 1 ? '' : 's'}`;
  },

  join(parts) {
    return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
  },
};
