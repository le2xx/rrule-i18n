import { describe, expect, it } from 'vitest';
import {
  joinWithConjunction,
  ordinalEn,
  ruCount,
  ruPluralIndex,
  ruNumeralOrdinalSuffix,
} from '../src/locales/shared';

describe('joinWithConjunction', () => {
  it('returns an empty string for an empty list', () => {
    expect(joinWithConjunction([], 'and')).toBe('');
  });

  it('returns the single item unchanged', () => {
    expect(joinWithConjunction(['a'], 'and')).toBe('a');
  });

  it('joins two items with the conjunction, no comma', () => {
    expect(joinWithConjunction(['a', 'b'], 'and')).toBe('a and b');
  });

  it('joins three+ items with commas and a trailing conjunction, no Oxford comma', () => {
    expect(joinWithConjunction(['a', 'b', 'c'], 'and')).toBe('a, b and c');
  });
});

describe('ordinalEn', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [10, '10th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [22, '22nd'],
    [23, '23rd'],
    [24, '24th'],
    [101, '101st'],
    [111, '111th'],
    [112, '112th'],
    [113, '113th'],
  ])('ordinalEn(%i) === %s', (n, expected) => {
    expect(ordinalEn(n)).toBe(expected);
  });

  it('operates on the absolute value', () => {
    expect(ordinalEn(-2)).toBe('2nd');
  });
});

describe('ruPluralIndex / ruCount', () => {
  it.each([
    [0, 2],
    [1, 0],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 2],
    [10, 2],
    [11, 2],
    [12, 2],
    [13, 2],
    [14, 2],
    [15, 2],
    [20, 2],
    [21, 0],
    [22, 1],
    [23, 1],
    [24, 1],
    [25, 2],
    [100, 2],
    [101, 0],
    [111, 2],
    [112, 2],
    [113, 2],
    [114, 2],
    [121, 0],
    [122, 1],
  ])('ruPluralIndex(%i) === %i', (n, expected) => {
    expect(ruPluralIndex(n)).toBe(expected);
  });

  it('ruCount prefixes the number and picks the right form', () => {
    expect(ruCount(1, ['день', 'дня', 'дней'])).toBe('1 день');
    expect(ruCount(2, ['день', 'дня', 'дней'])).toBe('2 дня');
    expect(ruCount(5, ['день', 'дня', 'дней'])).toBe('5 дней');
  });
});

describe('ruNumeralOrdinalSuffix', () => {
  it('returns the masculine suffix', () => {
    expect(ruNumeralOrdinalSuffix('m')).toBe('й');
  });

  it('returns the feminine suffix', () => {
    expect(ruNumeralOrdinalSuffix('f')).toBe('я');
  });

  it('returns the neuter suffix', () => {
    expect(ruNumeralOrdinalSuffix('n')).toBe('е');
  });
});
