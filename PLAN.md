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

## 16. ✅ Исправить баг: focusFirstMenuItem падал TypeError при невидимых панелях

- Статус: ВЫПОЛНЕНО
- Файл: `src/js/controls/settings-menu.js:129-143`
- `target.querySelector(...)` падал TypeError если `find()` вернул `undefined`
- Добавлен null-guard: `if (!is.element(target)) return;`

## 17. ✅ Добавить null-guards для геттеров после destroy

- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js`
- Геттеры `muted`, `hasAudio`, `quality`, `loop` не имели null-проверок для `this.media`
- После `destroy()` `this.media = null`, вызов этих геттеров выбрасывал TypeError
- Добавлены проверки: `this.media ? ... : defaultValue`
- 9 тестов в `test/null-guards.test.js`

## 18. ✅ Исправить screenshot() — SecurityError при кросс-доменном видео

- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js`
- `canvas.toDataURL()` выбрасывает SecurityError для кросс-доменного видео без CORS
- Добавлен try/catch с понятным предупреждением и возвратом null
- 1 новый тест в `test/plyr-methods.test.js`

## 19. ✅ Исправить formatTime() — некорректная обработка отрицательных значений

- Статус: ВЫПОЛНЕНО
- Файл: `src/js/utils/time.js`
- Отрицательное время (например -5с) отображалось некорректно из-за `%` на отрицательных числах
- Добавлен `Math.abs(time)` и проверка знака для отображения минуса
- Убран вводящий в заблуждение второй аргумент `Math.trunc(value, 10)` (игнорируется)
- 2 новых теста в `test/utils/time.test.js`

## 20. ✅ Убрать дублирование в transcription.toggle()
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/transcription.js`
- `this.transcription.active` устанавливался дважды: в блоке `if (!passive)` и ниже безусловно
- Рефакторинг: состояние устанавливается один раз в if/else блоке
- Пассивный режим теперь также корректно обновляет внутреннее состояние

## 21. ✅ Рефакторинг destroy() — объединение provider-веток
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js`
- YouTube, Rutube, Yandex Cloud, VK, Mail.ru, MTS Link используют одинаковый паттерн `embed.destroy()`
- Вместо отдельных `else if` веток — общий `else` блок
- Упрощение: 6 веток → 3 (HTML5 / Vimeo / все остальные embed)
- 4 теста в `test/destroy-providers.test.js`

## 22. ✅ Оптимизация listeners.js — Set для O(1) lookup
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/listeners.js`
- `preventDefault` массив заменён на `PREVENT_DEFAULT_KEYS` Set на уровне модуля
- `includes()` (O(n)) → `has()` (O(1))
- 3 теста в `test/prevent-default-keys.test.js`

## 23. ✅ Async null-guards в transcription.js и captions.js
- Статус: ВЫПОЛНЕНО
- Файлы: `src/js/transcription.js`, `src/js/captions.js`
- Асинхронные `translate()` колбэки могли выполниться после `destroy()`, когда `this.elements === null`
- Добавлены проверки: `if (!this.elements || !this.elements.translation) return;`
- Исправлено в `transcription.updateContainer()`, `captions.updateCues()`, `captions.toggleTranslation()`

---

**Итого:** Все пункты выполнены. 562 тестов, 32 файла.
