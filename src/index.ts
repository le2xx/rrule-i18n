import { RRuleTextError } from './errors';
import { normalize, type NormalizedRule, type WeekdaySpec } from './normalize';
import { enLocale } from './locales/en';
import { joinWithConjunction } from './locales/shared';
import type { RRuleDateFormatter, RRuleLike, RRuleLocale, RRuleTextOptions } from './types';

export type {
  RRuleFrequency,
  RRuleInstanceLike,
  RRuleLike,
  RRuleLocale,
  RRuleOptionsLike,
  RRuleTextOptions,
  RRuleDateFormatter,
} from './types';
export { RRuleTextError } from './errors';

const FREQ = {
  YEARLY: 0,
  MONTHLY: 1,
  WEEKLY: 2,
  DAILY: 3,
  HOURLY: 4,
  MINUTELY: 5,
  SECONDLY: 6,
} as const;

const BUSINESS_WEEK = [0, 1, 2, 3, 4];

// Used only to join multiple "Nth weekday" fragments together (e.g. the rare
// `BYDAY=1MO,-1FR` case: "the first Monday" + "the last Friday"). Not part of
// the public `RRuleLocale` contract -- each `nthWeekdayPhrase()` call already
// returns a complete fragment, this just needs a small connector word.
const LIST_CONJUNCTION: Record<string, string> = {
  ru: 'и',
  en: 'and',
};

const localeRegistry = new Map<string, RRuleLocale>();

/** Registers a locale so it can be referenced by its `code` string (e.g. `{ locale: 'ru' }`). Not required if you pass the locale object directly. */
export const registerLocale = (locale: RRuleLocale): void => {
  localeRegistry.set(locale.code, locale);
};

/** Looks up a previously-registered locale by code. */
export const getLocale = (code: string): RRuleLocale | undefined => {
  return localeRegistry.get(code);
};

// The English locale ships as part of the core bundle so that
// `rruleToText(rule)` works out of the box with zero configuration. Every
// other locale (e.g. `ru`) lives at its own subpath (`rrule-i18n/locales/ru`)
// and must be imported explicitly, keeping the core tree-shakeable.
registerLocale(enLocale);

const defaultDateFormatter: RRuleDateFormatter = (date, locale) => {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date);
  }
};

const resolveLocale = (options: RRuleTextOptions | undefined): RRuleLocale => {
  const requested = options?.locale;

  if (requested && typeof requested === 'object') {
    return requested;
  }

  if (typeof requested === 'string') {
    const found = getLocale(requested);
    if (found) return found;
  }

  const fallbackCode = options?.fallbackLocale ?? 'en';
  const fallback = getLocale(fallbackCode);
  if (fallback) return fallback;

  throw new RRuleTextError(
    `Locale "${String(requested ?? fallbackCode)}" is not registered and no fallback locale was found. ` +
      'Pass a locale object directly, or call registerLocale() first.'
  );
};

const isFullBusinessWeek = (specs: WeekdaySpec[] | null): boolean => {
  if (specs?.length !== 5) return false;
  if (specs.some((s) => s.n !== null)) return false;
  const set = new Set(specs.map((s) => s.weekday));
  return BUSINESS_WEEK.every((d) => set.has(d));
};

const buildWeekdayClause = (specs: WeekdaySpec[], locale: RRuleLocale): string => {
  const plain = specs.every((s) => s.n === null);
  if (plain) {
    const days = [...new Set(specs.map((s) => s.weekday))].sort((a, b) => a - b);
    return locale.weekdaysPhrase(days);
  }
  const conjunction = LIST_CONJUNCTION[locale.code] ?? 'and';
  const fragments = specs.map((s) => locale.nthWeekdayPhrase(s.n!, s.weekday));
  return joinWithConjunction(fragments, conjunction);
};

const buildSentence = (rule: NormalizedRule, locale: RRuleLocale): string => {
  const parts: (string | null)[] = [];

  const weekdaySpecs = rule.weekdaySpecs;
  const collapseIntoWeekday =
    (rule.freq === FREQ.DAILY || rule.freq === FREQ.WEEKLY) &&
    rule.interval === 1 &&
    isFullBusinessWeek(weekdaySpecs);

  const collapseIntoMonth =
    rule.freq === FREQ.YEARLY && rule.interval === 1 && !!rule.bymonth && rule.bymonth.length > 0;

  if (!collapseIntoWeekday && !collapseIntoMonth) {
    parts.push(locale.frequencyPhrase(rule.freq, rule.interval));
  }

  if (rule.bymonth && rule.bymonth.length > 0) {
    parts.push(locale.monthsPhrase([...rule.bymonth].sort((a, b) => a - b)));
  }

  if (weekdaySpecs && weekdaySpecs.length > 0) {
    parts.push(buildWeekdayClause(weekdaySpecs, locale));
  }

  if (rule.bymonthday && rule.bymonthday.length > 0) {
    parts.push(locale.monthdaysPhrase([...rule.bymonthday].sort((a, b) => a - b)));
  }

  if (rule.byyearday && rule.byyearday.length > 0) {
    parts.push(locale.byyeardayPhrase([...rule.byyearday].sort((a, b) => a - b)));
  }

  if (rule.byweekno && rule.byweekno.length > 0) {
    parts.push(locale.byweeknoPhrase([...rule.byweekno].sort((a, b) => a - b)));
  }

  return locale.join(parts);
};

const capitalizeFirst = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const render = (rule: RRuleLike, options: RRuleTextOptions | undefined): string => {
  const normalized = normalize(rule);
  const locale = resolveLocale(options);
  const dateFormatter = options?.dateFormatter ?? defaultDateFormatter;

  let text = buildSentence(normalized, locale);

  const tailParts: (string | null)[] = [];
  if (normalized.until) {
    tailParts.push(locale.until(normalized.until, dateFormatter));
  } else if (normalized.count !== null) {
    tailParts.push(locale.count(normalized.count));
  }
  if (tailParts.length > 0) {
    text = locale.join([text, ...tailParts]);
  }

  const shouldCapitalize = options?.capitalize ?? true;
  return shouldCapitalize ? capitalizeFirst(text) : text;
};

/** Turns a parsed (or raw string) RRULE into grammatically-correct, human-readable text. Throws {@link RRuleTextError} on invalid input. */
export const rruleToText = (rule: RRuleLike, options?: RRuleTextOptions): string => {
  return render(rule, options);
};

/** Same as {@link rruleToText}, but returns `null` instead of throwing on invalid input (including `null`/`undefined`/empty-string rules). */
export const tryRruleToText = (rule: RRuleLike, options?: RRuleTextOptions): string | null => {
  try {
    if (rule === null || rule === undefined) return null;
    if (typeof rule === 'string' && rule.trim() === '') return null;
    return render(rule, options);
  } catch {
    return null;
  }
};
