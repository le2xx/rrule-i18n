# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-07-10

### Added

- `byyeardayPhrase` / `byweeknoPhrase` on `RRuleLocale` (breaking change to the locale interface, acceptable pre-1.0): `BYYEARDAY` and `BYWEEKNO` now render as real, grammatically-agreeing text (e.g. "on the 1st and 200th day of the year" / "1-го и 200-го дня года", "in the last week of the year" / "на последней неделе года") instead of the generic "(~ approximately)" note.
- GitHub Actions CI workflow: lint, typecheck, build, and test (with coverage) on every push/PR to `main`, coverage uploaded to Codecov.
- Issue templates for bug reports and feature requests.
- README badges (npm version, bundle size, coverage, CI status, license).

### Changed

- `normalize.ts`: simplified `WKST` extraction from RRULE strings -- `rrule` always parses `WKST` into a `Weekday` object (never a raw number), so the `typeof orig.wkst === 'number'` check was dead code; now always stores `null` (the field isn't surfaced in `NormalizedRule` regardless, per the WKST note above).

## [0.1.1] - 2026-07-02

### Fixed

- `ru` locale: `nthWeekdayPhrase` produced "в второй вторник" instead of the grammatically correct "во второй вторник" ("в" → "во" before a в/ф + consonant cluster, triggered by "второй/вторую/второе").
- `en`/`ru` `monthdaysPhrase`: 3+ fragments (e.g. mixed positive and negative `BYMONTHDAY` values) now join with the natural "a, b and c" / "a, b и c" pattern instead of a repeated "and"/"и".

### Added

- `repository`, `bugs`, and `homepage` links in `package.json`.

## [0.1.0] - 2026-07-02

Initial release.

### Added

- `rruleToText` / `tryRruleToText`, `registerLocale` / `getLocale`.
- `en` locale, bundled for zero-config use.
- `ru` locale, published as a separate tree-shakeable subpath (`rrule-i18n/locales/ru`).
- Support for all seven `FREQ` values, plus `INTERVAL`, `COUNT`, `UNTIL`, `BYDAY` (including `BYSETPOS` "Nth weekday" form), `BYMONTHDAY` (including negative/from-end-of-month values), and `BYMONTH`.
- `BYYEARDAY` / `BYWEEKNO` accepted with an approximate-match note rather than silently dropped.
- Dual ESM + CJS build via tsdown, with per-condition `.d.mts` / `.d.cts` type declarations.

[Unreleased]: https://github.com/le2xx/rrule-i18n/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/le2xx/rrule-i18n/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/le2xx/rrule-i18n/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/le2xx/rrule-i18n/releases/tag/v0.1.0
