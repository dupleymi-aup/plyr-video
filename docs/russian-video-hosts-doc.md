# Российские видеохостинги (обновленный раздел)

## Российские видеохостинги

Plyr поддерживает интеграцию с российскими видеохостингами: **Rutube**, **Yandex Cloud Video**, **VK Video**, **Mail.ru Video** и **MTS Link**.

### Rutube

```html
<div class="plyr__video-embed" id="player">
  <iframe src="https://rutube.ru/play/embed/1e5c8c87e8d0d8d8e8d0d8d8e8d0d8d8" allowfullscreen allowtransparency allow="autoplay"></iframe>
</div>
```

Или через data-атрибуты:

```html
<div id="player" data-plyr-provider="rutube" data-plyr-embed-id="1e5c8c87e8d0d8d8e8d0d8d8e8d8d8d8"></div>
```

**Поддерживаемые функции:**
- ✅ Качество видео (1080/720/480/360/240/144)
- ✅ Субтитры
- ✅ Скорость воспроизведения
- ✅ Получение заголовка видео

### Yandex Cloud Video

```html
<div class="plyr__video-embed" id="player">
  <iframe src="https://video.yandex.ru/player/your-video-id" allowfullscreen allowtransparency allow="autoplay"></iframe>
</div>
```

Или через data-атрибуты:

```html
<div id="player" data-plyr-provider="yandex" data-plyr-embed-id="your-video-id"></div>
```

**Поддерживаемые функции:**
- ✅ Получение заголовка видео
- ✅ Субтитры (при наличии)

### VK Video

```html
<div class="plyr__video-embed" id="player">
  <iframe src="https://vk.com/video-161895864_456241478" allowfullscreen allowtransparency allow="autoplay"></iframe>
</div>
```

Или через data-атрибуты:

```html
<div id="player" data-plyr-provider="vk" data-plyr-embed-id="video-161895864_456241478"></div>
```

**Поддерживаемые функции:**
- ✅ Качество видео (через HD параметр)
- ✅ Получение заголовка видео
- ⚠ Скорость воспроизведения (ограничена API)
- ⚠ Субтитры (не поддерживаются API)

### Mail.ru Video

```html
<div class="plyr__video-embed" id="player">
  <iframe src="https://my.mail.ru/video/embed/1234567890" allowfullscreen allowtransparency allow="autoplay"></iframe>
</div>
```

Или через data-атрибуты:

```html
<div id="player" data-plyr-provider="mailru" data-plyr-embed-id="1234567890"></div>
```

**Поддерживаемые функции:**
- ✅ Базовое воспроизведение
- ⚠ Ограниченная поддержка функций (API недокументирован)

### MTS Link

```html
<div class="plyr__video-embed" id="player">
  <iframe src="https://link.mts.ru/embed/your-mts-video-id" allowfullscreen allowtransparency allow="autoplay"></iframe>
</div>
```

Или через data-атрибуты:

```html
<div id="player" data-plyr-provider="mts" data-plyr-embed-id="your-mts-video-id"></div>
```

**Поддерживаемые функции:**
- ✅ Полная поддержка воспроизведения
- ✅ Поддержка субтитров
- ✅ Поддержка качества видео
- ✅ Поддержка скорости воспроизведения