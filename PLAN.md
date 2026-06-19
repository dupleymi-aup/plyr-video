# План улучшений plyr-video (10 пунктов)

## 1. ✅ Исправить валидацию currentTime — разрешить seeks к 0
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js:508`
- Изменение: `input > 0` → `input >= 0`
- Результат: 534 тестов проходят, линт чистый

## 2. ✅ Добавить null-guard для get/set accessor'ов после destroy
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js`
- Добавлены null-safe геттеры: `paused`, `ended`, `seeking`, `volume`, `speed`

## 3. ✅ Добавить default step для increaseVolume/decreaseVolume
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js:617-632`
- `decreaseVolume()` без аргумента теперь корректно уменьшает громкость на 0.1

## 4. ✅ Добавить типизацию для destroy() callback и soft параметра
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.d.ts:248`
- Тип `destroy(callback?: (...args: any[]) => void, soft?: boolean): void` уже был

## 5. ✅ Рефакторинг speed getter/setter для устранения дублирования
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js`
- if-цепочки заменены на lookup-таблицу `{ provider: { min, max } }`

## 6. ✅ Добавить unit-тест для currentTime setter edge cases
- Статус: ВЫПОЛНЕНО
- Файл: `test/controls/current-time.test.js`
- 7 тестов: seek к 0, отрицательные, за пределами duration, NaN, Infinity, duration=0

## 7. ✅ Убрать дублирование clearInterval в destroy() для YouTube
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js`
- Удалены дублирующие `clearInterval(buffering)` и `clearInterval(playing)` в YouTube ветке

## 8. ✅ Добавить JSDoc для `play()` return type (Promise | null)
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js:390`
- Добавлено `@returns {Promise<void>|null}`

## 9. ✅ Улучшить error handling в on()/off()/once() для destroyed players
- Статус: ВЫПОЛНЕНО
- Файл: `src/js/plyr.js:1294-1314`
- Добавлен `if (!this.ready) return` guard в on/off/once

## 10. ✅ Обновить CHANGELOG.md с описанием всех исправлений
- Статус: ВЫПОЛНЕНО
- Файл: `CHANGELOG.md`

---

**Итого:** Все 10 пунктов выполнены. 534 тестов, линт чистый, 2 коммита отправлены.
