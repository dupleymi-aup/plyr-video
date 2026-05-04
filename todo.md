# TODO — Российские видеохостинги

## Улучшения качества кода
- [x] Добавить try/catch в postMessage обработчики всех провайдеров
- [x] Улучшить обработку ошибок сети (fetch) при загрузке метаданных
  - Добавлены AbortController таймауты (8s) для fetchTitle и fetchPoster
- [x] VK: `getTitle()` использует недокументированный endpoint `vk.ru/al_video.php` — может сломаться
- [x] Mail.ru: `getTitle()` — заглушка, реализована (API недоступен)
- [x] Добавить валидацию videoId перед созданием iframe
- [x] Унифицировать формат postMessage команд между всеми провайдерами
  - Rutube/Yandex/MTS Link: `{ type, data }` → `player:play`
  - VK: `{ method, params }` → `{method:'play'}` — через parseVKMessage в createEmbed
  - Mail.ru: сырая строка `'play'` — через parseMailruMessage в createEmbed
  - Все провайдеры теперь используют createEmbed/defineMediaProperties/defineMediaControls из base-embed
  - VK и Mail.ru передают кастомные overrides для provider-специфичных свойств
- [x] Добавить таймаут инициализации (fallback если плеер не отвечает)
  - Добавлен initTimeout (15s) во все провайдеры, включая Mail.ru
- [x] Убрать неиспользуемые импорты (loadImage, format в rutube.js)
- [x] Вынести дублирование кода в shared base-embed.js
  - `assurePlaybackState()`, `createEmbed()`, `defineMediaProperties()`, `defineMediaControls()`, `destroy()`, `fetchTitle()`, `fetchPoster()`
  - Обработчики сообщений: `handleChangeState()`, `handleCurrentTime()`, `handleCaptionList()`, `handleCueChange()`, `handleQualityList()`, `handleCurrentQuality()`, `handlePlayOptionsLoaded()`
  - VK и Mail.ru полностью рефакторинг — используют createEmbed + overrides
  - defineMediaProperties/defineMediaControls теперь принимают overrides для provider-специфичных свойств
  - createEmbed поддерживает parseMessage для нестандартных форматов (VK/Mail.ru)
- [x] Добавить стандартизированную обработку ошибок — `src/js/utils/provider-errors.js`
  - Коды ошибок: NETWORK_ERROR, TIMEOUT, MEDIA_NOT_FOUND, MEDIA_GEOBLOCKED, MEDIA_PRIVATE, PLAYER_INIT_FAILED и др.
  - Severity: FATAL, ERROR, WARNING
  - Provider-специфичные сообщения (Rutube, Yandex, VK, Mail.ru, MTS Link)
  - `createProviderError()`, `getErrorSeverity()`, `isRetryableError()`, `mapProviderErrorCode()`
- [x] Покрыть провайдеры unit-тестами
  - Создана тестовая инфраструктура с Vitest
  - 17 тестов для 4 провайдеров (Rutube, Yandex, VK, Mail.ru)
  - Команды: `npm test`, `npm run test:watch`, `npm run test:coverage`

## Rutube (Приоритет: Высокий) ✅
- [x] Создать `src/js/plugins/rutube.js` — провайдер с postMessage API
- [x] Обновить `src/js/config/types.js` — добавить `rutube` и URL regex
- [x] Обновить `src/js/config/defaults.js` — настройки rutube + URL
- [x] Обновить `src/js/media.js` — добавить ветку `this.isRutube`
- [x] Обновить `src/js/plyr.js` — геттер `isRutube`, destroy, source
- [x] Поддержка качества (1080/720/480/360/240/144)
- [x] Поддержка субтитров
- [x] Поддержка скорости воспроизведения
- [x] Расширенный парсинг URL (Round 8):
  - Каналы: `rutube.ru/channel/{id}/video/{videoId}`
  - Короткие ссылки: `rutube.ru/r/{id}`
  - Альт. домен: `play.rutube.ru/embed/{id}`
  - Обновлён regex в types.js
- [ ] Тестирование с реальными Rutube видео
- [x] Добавлен в demo страницу
- [x] Origin validation: использует `Array.includes()` для точного совпадения — безопасно

## Yandex Cloud Video (Приоритет: Средний) ✅
- [x] Получить полную документацию по iframe SDK
- [x] Создать `src/js/plugins/yandex-video.js`
- [x] Зарегистрировать в types.js, defaults.js, media.js, plyr.js
- [ ] Протестировать с реальным видео из Yandex Cloud
- [x] Добавлен в demo страницу
- [x] Origin validation: использует `Array.includes()` для точного совпадения — безопасно
- [x] minimumSpeed/maximumSpeed: 0.25–2 (Round 8)

## VK Video (Приоритет: По возможности) ✅
- [x] Найти/получить документацию по VK Video iframe API
- [x] Создать `src/js/plugins/vk-video.js`
- [x] Зарегистрировать в конфигурации
- [x] Добавлен в demo страницу
- [x] Рефакторинг на base-embed (Round 8):
  - Использует createEmbed с parseVKMessage для нестандартного формата
  - defineMediaProperties с overrides для VK-специфики
  - ~100 строк дублирования удалено
- [x] Расширенный парсинг URL (Round 8):
  - VK Clips: `clip-123_456`
  - Списки видео: `z=video-123_456`
  - Hash из URL для видео_ext.php
- [x] Поддержка субтитров (Round 8): запрос getCaptions, обработка captionList/cueChange
- [x] minimumSpeed/maximumSpeed: 1–1 (API не поддерживает скорость) (Round 8)
- [ ] Протестировать
- [!] `playbackRate` getter/setter — заглушка, API не поддерживает
- [!] `getTitle()` — недокументированный endpoint, может сломаться

## Mail.ru Video (Приоритет: Низкий) ✅
- [x] Mail.ru Video — провайдер создан, базовая поддержка
- [x] Рефакторинг на base-embed (Round 8):
  - Использует createEmbed с parseMailruMessage для смешанного формата
  - defineMediaProperties с overrides для Mail.ru-специфики
  - ~100 строк дублирования удалено
  - handleStringEvent интегрирован в parseMailruMessage
- [x] minimumSpeed/maximumSpeed: 1–1 (API не поддерживает скорость) (Round 8)
- API недокументирован, реализован методом обратной инженерии
- Нет поддержки quality, captions, speed
- `getTitle()` — заглушка

## MTS Link (Приоритет: Средний) ✅ NEW
- [x] Создать `src/js/plugins/mts-link.js` — провайдер с postMessage API
- [x] Зарегистрировать в types.js, defaults.js, media.js, plyr.js
- [x] Поддержка качества, субтитров, скорости воспроизведения
- [x] Конфигурация: customControls, autoplay, muted, loop, startTime, skinColor, token
- [x] minimumSpeed/maximumSpeed: 0.5–2
- [x] Origin validation: `player.mts-link.ru`, `mts-link.ru`, `player.mts.ru`
- [ ] Протестировать с реальным видео
- [!] API документация недоступна — формат основан на типичной postMessage структуре

## Исправления (Round 6)
- [x] controls.js:1827 — инвертированное условие в setMarkers
- [x] vimeo.js:324 — `setAspectRatio.call(this)` → `setAspectRatio.call(player)`
- [x] vimeo.js:224 — seek error не сбрасывал `seeking` state
- [x] vimeo.js:275 — mute setter передавал `player.config.muted` вместо `toggle`
- [x] mailru-video.js:90-94 — `initTimeout` не очищался при успешной инициализации

## Исправления (Round 7)
- [x] is.js:50 — `isUrl()` всегда возвращал false для https:// URL
- [x] ads.js — `destroy()` не вызывался при уничтожении плеера
- [x] listeners.js:268-273 — установка style в `null` вместо `''`
- [x] preview-thumbnails.js:187 — проверка `frames.length` перед доступом

## Улучшения (Round 8)
- [x] Рефакторинг VK Video — использование createEmbed/defineMediaProperties с overrides
- [x] Рефакторинг Mail.ru Video — использование createEmbed/defineMediaProperties с overrides
- [x] Новый провайдер MTS Link — полная поддержка (quality, captions, speed, skinColor, token)
- [x] Утилита provider-errors.js — стандартизированные коды ошибок и сообщения
- [x] Расширенный парсинг URL:
  - Rutube: каналы, короткие ссылки, play.rutube.ru
  - VK: Clips (clip-), списки видео (z=video-), hash
  - Обновлён regex в types.js
- [x] Корректные границы скорости:
  - VK: 1–1 (API не поддерживает)
  - Mail.ru: 1–1 (API не поддерживает)
  - MTS Link: 0.5–2
  - Yandex: 0.25–2
- [x] Поддержка субтитров для VK Video (через base-embed handleCaptionList/handleCueChange)
- [x] Поддержка субтитров для MTS Link (через base-embed)
- [x] base-embed.js: расширен для поддержки overrides и parseMessage

## Исправления (Round 9 — Синтаксические ошибки и линтинг)
- [x] vimeo.js — удалён сломанный код (фрагмент assurePlaybackState между функциями)
- [x] youtube.js — удалён сломанный код и исправлена функция parseId
- [x] rutube.js — исправлены отступы с 4 на 2 пробела
- [x] yandex-video.js — добавлен отсутствующий импорт ui
- [x] mailru-video.js — удалён неиспользуемый параметр videoId в getTitle()
- [x] Все провайдеры теперь проходят ESLint без ошибок
- [x] Сборка проходит успешно (gulp build)

## Текущий статус (2026-05-04)
- ✅ Линтинг проходит успешно (eslint + stylelint)
- ✅ Сборка проходит успешно без ошибок
- ✅ Все российские платформы интегрированы: Rutube, Yandex, VK, Mail.ru, MTS Link
- ✅ Обновлены тестовые ID в демо-странице на реальные видео
- ✅ Создана инфраструктура unit-тестов (Vitest, 17 тестов)
- ✅ Merge-конфликты с upstream разрешены
- ⏳ Требуется тестирование с реальными видео
