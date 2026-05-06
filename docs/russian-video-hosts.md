# Документация по российским видеохостингам

## Общие сведения

Plyr поддерживает интеграцию с российскими видеохостингами, включая:
- Rutube
- Yandex Cloud Video
- VK Video
- Mail.ru Video
- MTS Link

## Rutube

### Поддерживаемые функции:
- Воспроизведение
- Контроль воспроизведения (play/pause)
- Получение заголовка видео
- Контроль скорости воспроизведения
- Поддержка субтитров
- Поддержка качества видео

### URL форматы:
- https://rutube.ru/video/embed/{id}
- https://rutube.ru/r/{id}
- rutube.ru/channel/{channel_id}/video/{video_id}

## Yandex Cloud Video

### Поддерживаемые функции:
- Воспроизведение
- Контроль воспроизведения (play/pause)
- Получение заголовка видео
- Поддержка субтитров (при наличии)

### URL форматы:
- https://video.cloud.yandex.ru/player/{video_id}

## VK Video

### Поддерживаемые функции:
- Воспроизведение
- Контроль воспроизведения (play/pause)
- Получение заголовка видео
- Поддержка субтитров (при наличии)

### URL форматы:
- https://vk.com/video-{id}
- https://vk.com/video_ext.php?clip={id}
- https://vk.com/video?z=video{owner_id}_{id}

## Mail.ru Video

### Поддерживаемые функции:
- Воспроизведение
- Контроль воспроизведения (play/pause)
- Получение заголовка видео (заглушка)

### URL форматы:
- https://my.mail.ru/video/embed.html?{id}

## MTS Link

### Поддерживаемые функции:
- Воспроизведение
- Контроль воспроизведения (play/pause)
- Получение заголовка видео
- Поддержка субтитров
- Поддержка качества видео

### URL форматы:
- https://player.mts-link.ru/{id}
- https://player.mts.ru/{id}