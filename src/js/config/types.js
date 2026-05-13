// ==========================================================================
// Plyr supported types and providers
// ==========================================================================

export const providers = {
  html5: 'html5',
  youtube: 'youtube',
  vimeo: 'vimeo',
  rutube: 'rutube',
  yandex: 'yandex',
  vk: 'vk',
  mailru: 'mailru',
  mtslink: 'mtslink',
};

export const types = {
  audio: 'audio',
  video: 'video',
};

/**
 * Get provider by URL
 * @param {string} url
 */
export function getProviderByUrl(url) {
  // YouTube
  if (/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtube-nocookie\.com|youtu\.be)\/.+$/.test(url)) {
    return providers.youtube;
  }

  // Vimeo
  if (/^https?:\/\/player.vimeo.com\/video\/\d{0,9}(?=\b|\/)/.test(url)) {
    return providers.vimeo;
  }

  // Rutube — supports: rutube.ru/video/, rutube.ru/play/embed/, rutube.ru/embed/,
  // rutube.ru/channel/{id}/video/, rutube.ru/r/{id}, rutube.ru/plst/{id}, play.rutube.ru/
  if (
    /^https?:\/\/(?:www\.)?(?:rutube\.ru\/(?:play\/embed\/|video\/|embed\/|channel\/\d+\/video\/|r\/|plst\/)|play\.rutube\.ru\/)/.test(
      url,
    )
  ) {
    return providers.rutube;
  }

  // Yandex Cloud Video
  if (/^https?:\/\/(?:video\.cloud\.yandex\.net\/player\/|cloud\.yandex\.ru.*video\/)/.test(url)) {
    return providers.yandex;
  }

  // VK Video — supports: vk.com/video, vk.ru/video, vk.com/clip, vk.ru/clip,
  // vk.com/video_ext.php, vk.ru/video_ext.php
  // Note: 'video' alternative covers 'video_ext.php' prefix as well
  if (/^https?:\/\/(?:vk\.com|vk\.ru)\/(?:video|clip)/.test(url)) {
    return providers.vk;
  }

  // Mail.ru Video
  if (/^https?:\/\/(?:my\.mail\.ru\/video|api\.video\.mail\.ru\/videos)/.test(url)) {
    return providers.mailru;
  }

  // MTS Link
  if (/^https?:\/\/(?:player\.mts-link\.ru|mts-link\.ru\/(?:video|recordings)|player\.mts\.ru)/.test(url)) {
    return providers.mtslink;
  }

  return null;
}

export default { providers, types };
