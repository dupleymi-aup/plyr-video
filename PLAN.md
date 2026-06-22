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

---

**Итого:** Все 10 пунктов выполнены. 541 тест проходит (29 файлов).
