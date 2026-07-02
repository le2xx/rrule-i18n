/**
 * Small, locale-agnostic helpers shared by the bundled locales. Not part of
 * the public API -- each locale is free to ignore these and implement its
 * own list-joining/ordinal logic instead.
 */

/** Joins a list of strings with a language-appropriate conjunction before the last item, and no Oxford comma: `[a] -> "a"`, `[a,b] -> "a <and> b"`, `[a,b,c] -> "a, b <and> c"`. */
export const joinWithConjunction = (items: string[], conjunction: string): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]!} ${conjunction} ${items[1]!}`;
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]!}`;
};

/** English ordinal suffix, e.g. 1 -> "1st", 2 -> "2nd", 11 -> "11th", 22 -> "22nd". Operates on the absolute value. */
export const ordinalEn = (n: number): string => {
  const abs = Math.abs(n);
  const rem100 = abs % 100;
  const rem10 = abs % 10;
  let suffix = 'th';
  if (rem100 < 11 || rem100 > 13) {
    if (rem10 === 1) suffix = 'st';
    else if (rem10 === 2) suffix = 'nd';
    else if (rem10 === 3) suffix = 'rd';
  }
  return `${abs}${suffix}`;
};

/**
 * Russian pluralization index, following the standard one/few/many split:
 *  - index 0 ("one"):  1, 21, 31, 101... (n % 10 === 1 && n % 100 !== 11)
 *  - index 1 ("few"):  2-4, 22-24, 102-104... (n % 10 in 2..4 && n % 100 not in 12..14)
 *  - index 2 ("many"): 0, 5-20, 25-30, 11-14...
 */
export const ruPluralIndex = (n: number): 0 | 1 | 2 => {
  const abs = Math.abs(Math.trunc(n));
  const n10 = abs % 10;
  const n100 = abs % 100;
  if (n10 === 1 && n100 !== 11) return 0;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return 1;
  return 2;
};

/** Picks the correct Russian noun form for `n` from `[one, few, many]` and prefixes it with the number. */
export const ruCount = (n: number, forms: readonly [string, string, string]): string => {
  return `${n} ${forms[ruPluralIndex(n)]}`;
};

/** Russian ordinal-numeral suffix for a gendered fallback ordinal, e.g. 6 + 'm' -> "6-й". */
export const ruNumeralOrdinalSuffix = (gender: 'm' | 'f' | 'n'): string => {
  return gender === 'm' ? 'й' : gender === 'f' ? 'я' : 'е';
};
