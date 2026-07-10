/**
 * Recurrence frequency, using the exact same numeric codes as `rrule`'s
 * `Frequency` enum: YEARLY = 0, MONTHLY = 1, WEEKLY = 2, DAILY = 3,
 * HOURLY = 4, MINUTELY = 5, SECONDLY = 6.
 */
export type RRuleFrequency = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A plain, structural description of a recurrence rule's parsed options.
 * This intentionally mirrors the shape of `RRule#options` from the `rrule`
 * package without requiring a hard dependency on its types, so plain
 * objects work too.
 */
export interface RRuleOptionsLike {
  /** YEARLY..SECONDLY, coded as in `rrule.Frequency`. */
  freq: RRuleFrequency;
  interval?: number | null;
  count?: number | null;
  until?: Date | null;
  /** 0=Mon..6=Sun, as in `rrule`. */
  byweekday?: number[] | null;
  /** Negative values count back from the end of the month. */
  bymonthday?: number[] | null;
  bymonth?: number[] | null;
  bysetpos?: number[] | null;
  byyearday?: number[] | null;
  byweekno?: number[] | null;
  wkst?: number | null;
}

/**
 * Structurally compatible with an `RRule` instance from the `rrule`
 * package (which exposes a `.options` property), without importing its
 * types directly.
 */
export interface RRuleInstanceLike {
  options: RRuleOptionsLike;
}

/**
 * Anything that can be turned into text:
 *  - a raw RRULE string (`"FREQ=DAILY;INTERVAL=1"`), with or without a
 *    leading `"RRULE:"` prefix,
 *  - an already-parsed options object,
 *  - or an object structurally compatible with an `RRule` instance.
 */
export type RRuleLike = string | RRuleOptionsLike | RRuleInstanceLike;

/**
 * Formats a `Date` for use inside an "until" clause. Defaults to
 * `Intl.DateTimeFormat` with `dateStyle: 'long'`.
 */
export type RRuleDateFormatter = (date: Date, locale: string) => string;

export interface RRuleTextOptions {
  /** A locale code registered via {@link registerLocale}, or a locale object. */
  locale?: string | RRuleLocale;
  /** Locale code to fall back to when `locale` is a string that isn't registered. Default: `'en'`. */
  fallbackLocale?: string;
  /** Used to format `UNTIL` dates. Defaults to `Intl.DateTimeFormat`. */
  dateFormatter?: RRuleDateFormatter;
  /** Capitalize the first letter of the resulting sentence. Default: `true`. */
  capitalize?: boolean;
}

/**
 * A pluggable language pack. Each method returns a fully-formed,
 * grammatically agreeing phrase fragment (including whatever preposition
 * or case ending the target language requires) -- never a bare word meant
 * to be substituted into a fixed English template.
 */
export interface RRuleLocale {
  /** BCP-47-ish locale code, e.g. `'en'`, `'ru'`. */
  code: string;

  /** e.g. "every day" / "every 2 days", "каждый день" / "каждые 2 дня". */
  frequencyPhrase(freq: RRuleFrequency, interval: number): string;

  /**
   * e.g. "on Monday, Wednesday and Friday" / "по понедельникам, средам и
   * пятницам". When `days` is exactly Monday-through-Friday, should
   * return the idiomatic "on weekdays" / "по будням" form.
   */
  weekdaysPhrase(days: number[]): string;

  /**
   * e.g. "on the first Monday" / "в первый понедельник", "on the last
   * Friday" / "в последнюю пятницу". Gender/number agreement between the
   * ordinal and the weekday noun is the locale's responsibility.
   */
  nthWeekdayPhrase(pos: number, weekday: number): string;

  /** e.g. "in January and February" / "в январе и феврале". */
  monthsPhrase(months: number[]): string;

  /** e.g. "on the 1st and 15th" / "1-го и 15-го числа", "on the last day of the month" / "в последний день месяца". */
  monthdaysPhrase(days: number[]): string;

  /** e.g. "on the 1st and 200th day of the year" / "1-го и 200-го дня года", "on the last day of the year" / "в последний день года". */
  byyeardayPhrase(days: number[]): string;

  /** e.g. "in the 1st and 26th week of the year" / "на 1-й и 26-й неделе года", "in the last week of the year" / "на последней неделе года". */
  byweeknoPhrase(weeks: number[]): string;

  /** e.g. "until December 31, 2026" / "до 31 декабря 2026 г." */
  until(date: Date, dateFormatter: RRuleDateFormatter): string;

  /** e.g. "for 10 times" / "10 раз". */
  count(n: number): string;

  /** Joins the non-null clause fragments into the final sentence. */
  join(parts: (string | null | undefined)[]): string;
}
