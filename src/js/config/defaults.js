// ==========================================================================
// Plyr default config
// ==========================================================================

const defaults = {
  // Disable
  enabled: true,

  // Custom media title
  title: '',

  // Logging to console
  debug: false,

  // Auto play (if supported)
  autoplay: false,

  // Only allow one media playing at once (vimeo only)
  autopause: true,

  // Allow inline playback on iOS
  playsinline: true,

  // Default time to skip when rewind/fast forward
  seekTime: 10,

  // Default volume
  volume: 1,
  muted: false,

  // Pass a custom duration
  duration: null,

  // Display the media duration on load in the current time position
  // If you have opted to display both duration and currentTime, this is ignored
  displayDuration: true,

  // Invert the current time to be a countdown
  invertTime: true,

  // Clicking the currentTime inverts it's value to show time left rather than elapsed
  toggleInvert: true,

  // Force an aspect ratio
  // The format must be `'w:h'` (e.g. `'16:9'`)
  ratio: null,

  // Click video container to play/pause
  clickToPlay: true,

  // Auto hide the controls
  hideControls: true,

  // Reset to start when playback ended
  resetOnEnd: false,

  // Disable the standard context menu
  disableContextMenu: true,

  // Sprite (for icons)
  loadSprite: true,
  iconPrefix: 'plyr',
  iconUrl: 'https://cdn.plyr.io/3.8.4/plyr.svg',

  // Blank video (used to prevent errors on source change)
  blankVideo: 'https://cdn.plyr.io/static/blank.mp4',

  // Quality default
  quality: {
    default: 576,
    // The options to display in the UI, if available for the source media
    options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240],
    forced: false,
    onChange: null,
  },

  // Set loops
  loop: {
    active: false,
    start: null,
    end: null,
  },

  // Speed default and options to display
  speed: {
    selected: 1,
    // The options to display in the UI, if available for the source media (e.g. Vimeo and YouTube only support 0.5x-4x)
    options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4],
  },

  // Keyboard shortcut settings
  keyboard: {
    focused: true,
    global: false,
  },

  // Display tooltips
  tooltips: {
    controls: true,
    seek: true,
  },

  // Captions settings
  captions: {
    active: false,
    language: 'auto',
    // Listen to new tracks added after Plyr is initialized.
    // This is needed for streaming captions, but may result in unselectable options
    update: false,
  },

  // Transcription settings
  transcription: {
    active: false,
    language: 'en', // language of the speech to transcribe
    // List of languages to display in the menu
    languages: [
      'af',
      'sq',
      'am',
      'ar',
      'hy',
      'az',
      'eu',
      'be',
      'bn',
      'bs',
      'bg',
      'ca',
      'ceb',
      'ny',
      'zh',
      'zh-TW',
      'co',
      'hr',
      'cs',
      'da',
      'nl',
      'en',
      'eo',
      'et',
      'fi',
      'fr',
      'fy',
      'gl',
      'ka',
      'de',
      'el',
      'gu',
      'ht',
      'ha',
      'haw',
      'iw',
      'hi',
      'hmn',
      'hu',
      'is',
      'ig',
      'id',
      'ga',
      'it',
      'ja',
      'jw',
      'kn',
      'kk',
      'km',
      'rw',
      'ko',
      'ku',
      'ky',
      'lo',
      'la',
      'lv',
      'lt',
      'lb',
      'mk',
      'mg',
      'ms',
      'ml',
      'mt',
      'mi',
      'mr',
      'mn',
      'my',
      'ne',
      'no',
      'or',
      'ps',
      'fa',
      'pl',
      'pt',
      'pa',
      'ro',
      'ru',
      'sm',
      'gd',
      'sr',
      'st',
      'sn',
      'sd',
      'si',
      'sk',
      'sl',
      'so',
      'es',
      'su',
      'sw',
      'sv',
      'tl',
      'tg',
      'ta',
      'tt',
      'te',
      'th',
      'tr',
      'tk',
      'uk',
      'ur',
      'ug',
      'uz',
      'vi',
      'cy',
      'xh',
      'yi',
      'yo',
      'zu',
    ],
    // Note: Requires the Web Speech API (supported in Chrome, Edge, Safari)
  },

  // Translation settings
  translation: {
    active: false,
    language: 'en', // target language for translation
    // List of languages to display in the menu
    languages: [
      'af',
      'sq',
      'am',
      'ar',
      'hy',
      'az',
      'eu',
      'be',
      'bn',
      'bs',
      'bg',
      'ca',
      'ceb',
      'ny',
      'zh',
      'zh-TW',
      'co',
      'hr',
      'cs',
      'da',
      'nl',
      'en',
      'eo',
      'et',
      'fi',
      'fr',
      'fy',
      'gl',
      'ka',
      'de',
      'el',
      'gu',
      'ht',
      'ha',
      'haw',
      'iw',
      'hi',
      'hmn',
      'hu',
      'is',
      'ig',
      'id',
      'ga',
      'it',
      'ja',
      'jw',
      'kn',
      'kk',
      'km',
      'rw',
      'ko',
      'ku',
      'ky',
      'lo',
      'la',
      'lv',
      'lt',
      'lb',
      'mk',
      'mg',
      'ms',
      'ml',
      'mt',
      'mi',
      'mr',
      'mn',
      'my',
      'ne',
      'no',
      'or',
      'ps',
      'fa',
      'pl',
      'pt',
      'pa',
      'ro',
      'ru',
      'sm',
      'gd',
      'sr',
      'st',
      'sn',
      'sd',
      'si',
      'sk',
      'sl',
      'so',
      'es',
      'su',
      'sw',
      'sv',
      'tl',
      'tg',
      'ta',
      'tt',
      'te',
      'th',
      'tr',
      'tk',
      'uk',
      'ur',
      'ug',
      'uz',
      'vi',
      'cy',
      'xh',
      'yi',
      'yo',
      'zu',
    ],
    // Note: Requires a translation service (e.g., LibreTranslate) to be configured
  },

  // Fullscreen settings
  fullscreen: {
    enabled: true, // Allow fullscreen?
    fallback: true, // Fallback using full viewport/window
    iosNative: false, // Use the native fullscreen in iOS (disables custom controls)
    // Selector for the fullscreen container so contextual / non-player content can remain visible in fullscreen mode
    // Non-ancestors of the player element will be ignored
    // container: null, // defaults to the player element
  },

  // Local storage
  storage: {
    enabled: true,
    key: 'plyr',
  },

  // Default controls
  controls: [
    'play-large',
    // 'restart',
    // 'rewind',
    'play',
    // 'fast-forward',
    'progress',
    'current-time',
    // 'duration',
    'mute',
    'volume',
    'captions',
    'translation',
    'transcription',
    'settings',
    'pip',
    'airplay',
    // 'download',
    'fullscreen',
  ],
  settings: ['captions', 'translation', 'transcription', 'quality', 'speed', 'loop'],

  // Localisation
  i18n: {
    restart: 'Restart',
    rewind: 'Rewind {seektime}s',
    play: 'Play',
    pause: 'Pause',
    fastForward: 'Forward {seektime}s',
    seek: 'Seek',
    seekLabel: '{currentTime} of {duration}',
    played: 'Played',
    buffered: 'Buffered',
    currentTime: 'Current time',
    duration: 'Duration',
    volume: 'Volume',
    mute: 'Mute',
    unmute: 'Unmute',
    enableCaptions: 'Enable captions',
    disableCaptions: 'Disable captions',
    download: 'Download',
    enterFullscreen: 'Enter fullscreen',
    exitFullscreen: 'Exit fullscreen',
    frameTitle: 'Player for {title}',
    captions: 'Captions',
    settings: 'Settings',
    pip: 'PIP',
    menuBack: 'Go back to previous menu',
    speed: 'Speed',
    normal: 'Normal',
    quality: 'Quality',
    loop: 'Loop',
    loopOn: 'On',
    loopOff: 'Off',
    loopAll: 'Loop all',
    loopMarkStart: 'Mark start',
    loopMarkEnd: 'Mark end',
    disabled: 'Disabled',
    enabled: 'Enabled',
    advertisement: 'Ad',
    qualityBadge: {
      2160: '4K',
      1440: 'HD',
      1080: 'HD',
      720: 'HD',
      576: 'SD',
      480: 'SD',
    },
    qualityLabel: {
      4320: '8K Ultra HD',
      2880: '5K',
      2160: '4K Ultra HD',
      1440: 'QHD',
      1080: 'Full HD',
      720: 'HD',
      576: 'SD',
      480: 'SD',
      360: 'Low',
      240: 'Very Low',
    },
    // Translation
    translate: 'Translate',
    translateEnabled: 'Translation enabled',
    translateDisabled: 'Translation disabled',
    // Transcription
    transcribe: 'Transcribe',
    transcription: 'Transcription',
    transcriptionEnabled: 'Transcription enabled',
    transcriptionDisabled: 'Transcription disabled',
    // Keyboard shortcuts
    keyboardShortcuts: 'Keyboard Shortcuts',
    keyboardShortcutsHelp: 'Press any of these keys while the player is focused:',
    shortcutPlayPause: 'Play / Pause',
    shortcutRewind: 'Rewind',
    shortcutForward: 'Fast Forward',
    shortcutSeek: 'Seek to percentage (0-9)',
    shortcutVolumeUp: 'Volume Up',
    shortcutVolumeDown: 'Volume Down',
    shortcutMute: 'Mute / Unmute',
    shortcutFullscreen: 'Toggle Fullscreen',
    shortcutCaptions: 'Toggle Captions',
    shortcutLoop: 'Toggle Loop',
    shortcutHideControls: 'Hide / Show Controls',
    // Settings descriptions
    settingsDescription: 'Customize your playback experience',
    qualityDescription: 'Higher quality uses more bandwidth',
    speedDescription: 'Adjust playback speed',
    captionsDescription: 'Display subtitles when available',
    transcriptionDescription: 'Auto-generate speech-to-text',
    translationDescription: 'Translate captions to another language',
    loopDescription: 'Repeat the video automatically',
    // Quality level descriptions
    qualityDescriptions: {
      4320: '8K Ultra HD - Maximum quality',
      2880: '5K - Very high quality',
      2160: '4K Ultra HD - Excellent quality',
      1440: 'QHD - High quality',
      1080: 'Full HD - Standard high quality',
      720: 'HD - Good quality',
      576: 'SD - Standard definition',
      480: 'SD - Lower bandwidth',
      360: 'Low - Saves data',
      240: 'Very Low - Minimum bandwidth',
    },
    // Speed descriptions
    speedDescriptions: {
      0.5: 'Half speed - Very slow',
      0.75: 'Three-quarter speed - Slow',
      1: 'Normal speed',
      1.25: 'Slightly faster',
      1.5: 'One and a half speed',
      1.75: 'Almost double speed',
      2: 'Double speed',
      4: 'Quadruple speed - Very fast',
    },
    // Control tooltips
    tooltipPlay: 'Play or pause the video',
    tooltipRewind: 'Go back {seektime} seconds',
    tooltipForward: 'Skip ahead {seektime} seconds',
    tooltipMute: 'Mute or unmute audio',
    tooltipCaptions: 'Show or hide subtitles',
    tooltipSettings: 'Open settings menu',
    tooltipFullscreen: 'Enter or exit fullscreen mode',
    tooltipVolume: 'Adjust volume level',
    tooltipSeek: 'Click or drag to seek to a position',
    tooltipPiP: 'Play in a floating window',
    tooltipAirPlay: 'Stream to Apple TV or AirPlay device',
    loading: 'Loading...',
    buffering: 'Buffering...',
    stalled: 'Connection stalled...',
    // Error messages
    errorTitle: 'Playback Error',
    errorNetwork: 'Network error occurred. Please check your internet connection.',
    errorMediaNotFound: 'Video not found.',
    errorMediaUnavailable: 'Video is temporarily unavailable.',
    errorGeoblocked: 'Video is not available in your region.',
    errorMediaRemoved: 'Video has been removed.',
    errorMediaPrivate: 'Access to this video is restricted.',
    errorPlayerInit: 'Player initialization failed.',
    errorEmbedBlocked: 'Embed playback is blocked.',
    errorDRM: 'DRM protected content cannot be played.',
    errorUnknown: 'An unknown error occurred.',
    errorRetry: 'Retry',
    // Transcription help text
    transcriptionHelp: 'Transcription uses your browser\'s speech recognition. Supported in Chrome, Edge, and Safari.',
    transcriptionPermissionRequired: 'Microphone access is required for transcription. Please allow microphone access in your browser settings.',
    transcriptionNotSupported: 'Speech recognition is not supported in your browser. Try using Chrome, Edge, or Safari.',
    // Translation help text
    translationHelp: 'Translation sends caption text to an external service. Translation quality may vary.',
    // Caption help text
    captionsHelp: 'Captions include dialogue and sound effects. Subtitles show only dialogue.',
    captionsOff: 'Off',
    translationOff: 'Off',
    transcriptionOff: 'Off',
  },

  // URLs
  urls: {
    download: null,
    vimeo: {
      sdk: 'https://player.vimeo.com/api/player.js',
      iframe: 'https://player.vimeo.com/video/{0}?{1}',
      api: 'https://vimeo.com/api/oembed.json?url={0}',
    },
    youtube: {
      sdk: 'https://www.youtube.com/iframe_api',
      api: 'https://noembed.com/embed?url=https://www.youtube.com/watch?v={0}',
    },
    rutube: {
      embed: 'https://rutube.ru/play/embed/{0}',
    },
    yandex: {
      embed: 'https://video.cloud.yandex.net/player/{0}',
    },
    vk: {
      embed: 'https://vk.ru/video_ext.php?{0}&js_api=1',
    },
    mailru: {
      embed: 'https://my.mail.ru/video/embed/{0}?wmode=opaque',
    },
    mtslink: {
      embed: 'https://player.mts-link.ru/player/{0}',
    },
    googleIMA: {
      sdk: 'https://imasdk.googleapis.com/js/sdkloader/ima3.js',
    },
  },

  // Custom control listeners
  listeners: {
    seek: null,
    play: null,
    pause: null,
    restart: null,
    rewind: null,
    fastForward: null,
    mute: null,
    volume: null,
    captions: null,
    download: null,
    fullscreen: null,
    pip: null,
    airplay: null,
    speed: null,
    quality: null,
    loop: null,
    language: null,
  },

  // Events to watch and bubble
  events: [
    // Events to watch on HTML5 media elements and bubble
    // https://developer.mozilla.org/en/docs/Web/Guide/Events/Media_events
    'ended',
    'progress',
    'stalled',
    'playing',
    'waiting',
    'canplay',
    'canplaythrough',
    'loadstart',
    'loadeddata',
    'loadedmetadata',
    'timeupdate',
    'volumechange',
    'play',
    'pause',
    'error',
    'seeking',
    'seeked',
    'emptied',
    'ratechange',
    'cuechange',

    // Custom events
    'download',
    'enterfullscreen',
    'exitfullscreen',
    'captionsenabled',
    'captionsdisabled',
    'languagechange',
    'controlshidden',
    'controlsshown',
    'ready',

    // YouTube
    'statechange',

    // Quality
    'qualitychange',

    // Ads
    'adsloaded',
    'adscontentpause',
    'adscontentresume',
    'adstarted',
    'adsmidpoint',
    'adscomplete',
    'adsallcomplete',
    'adsimpression',
    'adsclick',
  ],

  // Selectors
  // Change these to match your template if using custom HTML
  selectors: {
    editable: 'input, textarea, select, [contenteditable]',
    container: '.plyr',
    controls: {
      container: null,
      wrapper: '.plyr__controls',
    },
    labels: '[data-plyr]',
    buttons: {
      play: '[data-plyr="play"]',
      pause: '[data-plyr="pause"]',
      restart: '[data-plyr="restart"]',
      rewind: '[data-plyr="rewind"]',
      fastForward: '[data-plyr="fast-forward"]',
      mute: '[data-plyr="mute"]',
      captions: '[data-plyr="captions"]',
      download: '[data-plyr="download"]',
      fullscreen: '[data-plyr="fullscreen"]',
      pip: '[data-plyr="pip"]',
      airplay: '[data-plyr="airplay"]',
      settings: '[data-plyr="settings"]',
      loop: '[data-plyr="loop"]',
      translation: '[data-plyr="translation"]',
    },
    inputs: {
      seek: '[data-plyr="seek"]',
      volume: '[data-plyr="volume"]',
      speed: '[data-plyr="speed"]',
      language: '[data-plyr="language"]',
      quality: '[data-plyr="quality"]',
    },
    display: {
      currentTime: '.plyr__time--current',
      duration: '.plyr__time--duration',
      buffer: '.plyr__progress__buffer',
      loop: '.plyr__progress__loop', // Used later
      volume: '.plyr__volume--display',
    },
    progress: '.plyr__progress',
    captions: '.plyr__captions',
    caption: '.plyr__caption',
  },

  // Class hooks added to the player in different states
  classNames: {
    type: 'plyr--{0}',
    provider: 'plyr--{0}',
    video: 'plyr__video-wrapper',
    embed: 'plyr__video-embed',
    videoFixedRatio: 'plyr__video-wrapper--fixed-ratio',
    embedContainer: 'plyr__video-embed__container',
    poster: 'plyr__poster',
    posterEnabled: 'plyr__poster-enabled',
    ads: 'plyr__ads',
    control: 'plyr__control',
    controlPressed: 'plyr__control--pressed',
    playing: 'plyr--playing',
    paused: 'plyr--paused',
    stopped: 'plyr--stopped',
    loading: 'plyr--loading',
    hover: 'plyr--hover',
    tooltip: 'plyr__tooltip',
    cues: 'plyr__cues',
    marker: 'plyr__progress__marker',
    hidden: 'plyr__sr-only',
    hideControls: 'plyr--hide-controls',
    isTouch: 'plyr--is-touch',
    uiSupported: 'plyr--full-ui',
    noTransition: 'plyr--no-transition',
    display: {
      time: 'plyr__time',
    },
    menu: {
      value: 'plyr__menu__value',
      badge: 'plyr__badge',
      open: 'plyr--menu-open',
    },
    captions: {
      enabled: 'plyr--captions-enabled',
      active: 'plyr--captions-active',
    },
    translation: {
      enabled: 'plyr--translation-enabled',
      active: 'plyr--translation-active',
    },
    transcription: {
      enabled: 'plyr--transcription-enabled',
      active: 'plyr--transcription-active',
    },
    fullscreen: {
      enabled: 'plyr--fullscreen-enabled',
      fallback: 'plyr--fullscreen-fallback',
    },
    pip: {
      supported: 'plyr--pip-supported',
      active: 'plyr--pip-active',
    },
    airplay: {
      supported: 'plyr--airplay-supported',
      active: 'plyr--airplay-active',
    },
    previewThumbnails: {
      // Tooltip thumbs
      thumbContainer: 'plyr__preview-thumb',
      thumbContainerShown: 'plyr__preview-thumb--is-shown',
      imageContainer: 'plyr__preview-thumb__image-container',
      timeContainer: 'plyr__preview-thumb__time-container',
      // Scrubbing
      scrubbingContainer: 'plyr__preview-scrubbing',
      scrubbingContainerShown: 'plyr__preview-scrubbing--is-shown',
    },
  },

  // Embed attributes
  attributes: {
    embed: {
      provider: 'data-plyr-provider',
      id: 'data-plyr-embed-id',
      hash: 'data-plyr-embed-hash',
    },
  },

  // Advertisements plugin
  // Register for an account here: http://vi.ai/publisher-video-monetization/?aid=plyrio
  ads: {
    enabled: false,
    publisherId: '',
    tagUrl: '',
  },

  // Preview Thumbnails plugin
  previewThumbnails: {
    enabled: false,
    src: '',
    withCredentials: false,
  },

  // Vimeo plugin
  vimeo: {
    byline: false,
    portrait: false,
    title: false,
    speed: true,
    transparent: false,
    // Custom settings from Plyr
    customControls: true,
    referrerPolicy: null, // https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/referrerPolicy
    // Whether the owner of the video has a Pro or Business account
    // (which allows us to properly hide controls without CSS hacks, etc)
    premium: false,
  },

  // YouTube plugin
  youtube: {
    rel: 0, // No related vids
    showinfo: 0, // Hide info
    iv_load_policy: 3, // Hide annotations
    modestbranding: 1, // Hide logos as much as possible (they still show one in the corner when paused)
    // Custom settings from Plyr
    customControls: true,
    noCookie: false, // Whether to use an alternative version of YouTube without cookies
  },

  // Rutube plugin
  rutube: {
    // Custom settings from Plyr
    customControls: true,
    autoplay: false,
    quality: null, // Initial quality (e.g. 360, 480, 720, 1080)
    skinColor: null, // Interface color in HEX (e.g. 'e53935')
    stopTime: null, // Stop playback at this time (seconds)
    playlistId: null, // Rutube playlist ID (e.g. '1167014')
  },

  // Yandex Cloud Video plugin
  yandex: {
    // Custom settings from Plyr
    customControls: true,
    autoplay: false,
    muted: false,
    loop: false,
  },

  // VK Video plugin
  vk: {
    // Custom settings from Plyr
    customControls: true,
    autoplay: false,
    hd: null, // Video quality: 1=360p, 2=480p, 3=720p, 4=1080p
    startTime: null, // Start time in format: 00h00m00s
  },

  // Mail.ru Video plugin
  mailru: {
    // Custom settings from Plyr
    customControls: true,
    autoplay: false,
  },

  // MTS Link plugin
  mtslink: {
    // Custom settings from Plyr
    customControls: true,
    autoplay: false,
    muted: false,
    loop: false,
    startTime: null,
    skinColor: null,
    token: null,
  },

  // Media Metadata
  mediaMetadata: {
    title: '',
    artist: '',
    album: '',
    artwork: [],
  },

  // Markers
  markers: {
    enabled: false,
    points: [],
  },
};

export default defaults;
