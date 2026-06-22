# План улучшений plyr-video (10 пунктов)

## 1. ✅ Исправить валидацию currentTime — разрешить seeks к 0
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js:508`
- Изменение: `input > 0` → `input >= 0`

## 2. ✅ Добавить null-guard для get/set accessor'ов после destroy
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js`
- Добавлены null-safe геттеры: `paused`, `ended`, `seeking`, `volume`, `speed`

## 3. ✅ Исправить default step для decreaseVolume
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js:631-632`
- `decreaseVolume()` без аргумента теперь корректно уменьшает громкость на 0.1

## 4. ✅ Добавить JSDoc для play() return type
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js:390`
- Добавлено `@returns {Promise<void>|null}`

## 5. ✅ Рефакторинг speed getter/setter — lookup-таблица
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js`
- if-цепочки заменены на lookup-таблицу `{ provider: { min, max } }`

## 6. ✅ Убрать дублирование clearInterval в destroy()
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js`
- Удалены дублирующие `clearInterval` в YouTube ветке

## 7. ✅ Улучшить error handling в on()/off()/once()
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js:1294-1314`
- `if (!this.ready) return` guard в on/off/once

## 8. ✅ Добавить unit-тесты для currentTime setter
- Статус: ВЫПОЛНЕНО
- Файл: `test/controls/current-time.test.js`
- 7 тестов: seek к 0, отрицательные, за пределами duration, NaN, Infinity, duration=0

## 9. ✅ Реализовать недостающие горячие клавиши: s, ,, .
- Статус: ВЫПОЛНЕНО
- Файлы: `src/js/listeners.js`, `src/js/plyr.js`
- Клавиша `s` — скриншот текущего кадра (HTML5 video → canvas → dataURL)
- Клавиша `,` — шаг назад на 1/30 секунды (кадр)
- Клавиша `.` — шаг вперёд на 1/30 секунды (кадр)
- Добавлены `d`, `s`, `,`, `.` в `preventDefault` список
- Методы `screenshot()`, `stepBackward()`, `stepForward()` добавлены в Plyr

## 10. ✅ Добавить unit-тесты для новых методов
- Статус: ВЫПОЛНЕНО
- Файл: `test/plyr-methods.test.js`
- 7 тестов: stepBackward/Forward для HTML5 и embed, screenshot для non-HTML5/video-not-loaded/video-loaded

## 11. ✅ Оптимизация Console — кеширование привязанных функций
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/console.js`
- Ранее каждый вызов `this.debug.log()` через getter создавал новую `Function.prototype.bind` аллокацию
- Теперь绑定ные функции создаются один раз в конструкторе и кешируются в `_log`, `_warn`, `_error`
- Getter просто возвращает кешированную ссылку — нулевые аллокации при частых вызовах
- 2 новых теста: проверка идентичности ссылки (`toBe`) и noop для отключённого режима

## 12. ✅ Исправить баг в support.mime() — несоответствие переменных
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/support.js:67`
- `defaultCodecs[input]` → `defaultCodecs[type]` — переменная `type` используется на строке выше для проверки ключа, должна использоваться и для доступа к значению

## 13. ✅ Добавить типы для stepBackward/stepForward/screenshot в plyr.d.ts
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.d.ts`
- TypeScript-типы не содержали новые методы `stepBackward()`, `stepForward()`, `screenshot()`
- Добавлены JSDoc-комментарии и правильные сигнатуры: `stepBackward(): void`, `stepForward(): void`, `screenshot(): string | null`

## 14. ✅ Исправить баг: меню транскрипции использовало языки перевода
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/controls/submenu-builders.js:214`
- `this.player.config.translation.languages` → `this.player.config.transcription.languages`
- Меню транскрипции показывало список языков перевода вместо списка языков транскрипции

## 15. ✅ Исправить баг: format() падал при отсутствии аргумента
- Статус: ВЫПОЛНЕНО
- Файлы: `src/js/utils/strings.js`, `test/utils/strings.test.js`
- `format('Hello {0} {1}', 'World')` выбрасывал TypeError вместо корректной обработки
- Теперь отсутствующий аргумент сохраняет плейсхолдер как есть: `Hello World {1}`

---

**Итого:** Все пункты выполнены. 543 тестов, 29 файлов.
