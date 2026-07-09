# Черновики постов для продвижения rrule-i18n

Ничего не опубликовано — это черновики для твоей правки и ручной публикации.
Публикация от своего имени под твоим аккаунтом обычно воспринимается лучше, чем видно, что пост писал бот, так что перед постингом пройдись своими словами по паре мест.

---

## 1. Show HN (news.ycombinator.com)

**Title:**
Show HN: rrule-i18n – RFC5545 recurrence rules to grammatically correct text (not just English)

**Text:**

I built this because `rrule`'s built-in `toText()` only really works for English. Its extension point is word-for-word substitution ("Monday" -> "Понедельник"), which breaks immediately for languages with real grammar:

- Russian numeral agreement: 1 день / 2 дня / 5 дней / 11 дней (not `n % 10` — 11-14 are always the "many" form)
- Gender agreement: "в первый понедельник" (masculine) vs "в первую среду" (feminine) — the ordinal and the weekday have to be generated together, not as separate tokens
- Case changes: "в январе" (prepositional) vs "по понедельникам" (dative plural) — same word, different case depending on context

`rrule-i18n` doesn't patch `rrule` — it's a from-scratch text generator where each locale is a self-contained plugin returning whole, already-agreeing phrases. `rrule` stays as a peer dependency purely for RFC 5545 parsing.

Currently ships English + Russian, MIT licensed, zero runtime deps, tree-shakeable per-locale exports, 100% branch coverage on the core engine. Adding a new locale is purely additive — the core never needs to change.

npm: https://www.npmjs.com/package/rrule-i18n
GitHub: https://github.com/le2xx/rrule-i18n

Happy to answer questions about the grammar-agreement approach or the architecture.

---

## 2. Reddit — r/typescript (или r/javascript)

**Title:**
I built a library that turns RRULE strings into grammatically correct text in multiple languages (not just English)

**Body:**

If you've ever used `rrule`'s `toText()` for anything beyond English, you've probably hit the wall: its extension point is just word substitution, so it can't handle languages with real grammar rules.

Example in Russian: "every Monday" needs "по понедельникам" (dative plural), but "the first Monday" needs "в первый понедельник" (masculine, prepositional) — same word "понедельник", different form depending on grammatical context. A substitution-based approach can't produce this correctly.

`rrule-i18n` solves this by having each locale implement a small interface where every method returns a complete, already-agreeing phrase — not a word to interpolate into a template. The core engine just normalizes the RRULE fields and calls into whatever locale you give it; it has zero language-specific logic itself.

- Zero runtime deps (rrule is a peer dep, only used for parsing)
- Tree-shakeable — locales are separate subpath exports
- 100% branch coverage on the core, extensive fixture-based tests per locale
- MIT licensed

Currently en + ru. Adding a locale is purely additive (new file, don't touch the core) — contributions welcome if you need a language that's not there yet.

npm: https://www.npmjs.com/package/rrule-i18n
GitHub: https://github.com/le2xx/rrule-i18n

---

## 3. dev.to — статья (более длинная, технический разбор)

**Заголовок:**
Why "every Monday" and "the first Monday" need different grammar in Russian — and what that means for i18n libraries

**Черновик структуры (расписать подробнее перед публикацией):**

1. **Хук**: показать `rrule.toText()` на английском, затем что происходит при попытке в лоб подставить русские слова — "в второй вторник" вместо "во второй вторник" (реальный баг, который я сам поймал в процессе разработки).
2. **Три конкретные грамматические проблемы** (с примерами): numeral agreement, gender agreement, case changes by construction. Использовать точные примеры из README.
3. **Архитектурное решение**: почему "locale возвращает готовую фразу, а не слово" — единственный подход, который реально работает для языков с согласованием. Показать кусок интерфейса `RRuleLocale`.
4. **Как тестировали**: упомянуть, что exhaustive fixture matrix (все месяцы, все дни недели, все numeral-формы) реально нашёл баги, которые ручная проверка бы пропустила.
5. **Призыв к действию**: "добавление языка — это just a new file", ссылка на гайд в README "Adding a new locale", ссылка на репозиторий.

Код-сниппеты брать прямо из README (Quick start, API, Adding a new locale) — там уже всё есть, просто нужно раскрыть текстом вокруг.

---

## Заметки перед публикацией

- Всюду ссылки на **последнюю версию** README (после того как смёржишь фикс бейджа) — на случай, если кто-то откроет репозиторий сразу после поста.
- В Show HN и Reddit — не постить одновременно, лучше developer.
- После публикации: последить за Issues/comments первые 24-48ч, отвечать быстро — это то, что реально решает, взлетит пост или нет.
