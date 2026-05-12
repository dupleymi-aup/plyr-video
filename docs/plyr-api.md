# Plyr API Documentation

Полная документация по JavaScript API Plyr видео-плеера.

## Quick Start

### HTML Setup

```html
<!-- HTML5 Video -->
<video id="player" playsinline controls data-poster="/path/to/poster.jpg">
  <source src="/path/to/video.mp4" type="video/mp4" />
  <track kind="captions" label="English" src="/path/to/captions.vtt" srclang="en" default />
</video>

<!-- YouTube -->
<div id="player" data-plyr-provider="youtube" data-plyr-embed-id="bTqVqk7FSmY"></div>

<!-- Vimeo -->
<div id="player" data-plyr-provider="vimeo" data-plyr-embed-id="76979871"></div>
```

### JavaScript Initialization

```js
import Plyr from 'plyr';

// Single player
const player = new Plyr('#player');

// With options
const player = new Plyr('#player', {
  controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'fullscreen'],
  autoplay: false,
  volume: 0.8,
});

// Multiple players
const players = Plyr.setup('.js-player');

// From NodeList
const players = Array.from(document.querySelectorAll('.js-player')).map(p => new Plyr(p));
```

### CSS & SVG

```html
<link rel="stylesheet" href="https://cdn.plyr.io/3.8.4/plyr.css" />
<script src="https://cdn.plyr.io/3.8.4/plyr.js"></script>
```

SVG sprite is loaded automatically from CDN at `https://cdn.plyr.io/3.8.4/plyr.svg`.

---

## Configuration Options

Pass options as the second argument to the constructor or via `data-plyr-config` attribute.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | Boolean | `true` | Completely disable Plyr programmatically |
| `debug` | Boolean | `false` | Display debugging information in console |
| `controls` | Array, Function, Element | `['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen']` | Control elements to display. See [CONTROLS.md](../CONTROLS.md) for custom HTML |
| `settings` | Array | `['captions', 'quality', 'speed', 'loop']` | Settings menu items when using default controls |
| `i18n` | Object | See [defaults.js](/src/js/config/defaults.js) | Internationalization strings |
| `loadSprite` | Boolean | `true` | Load SVG sprite from `iconUrl` |
| `iconUrl` | String | `https://cdn.plyr.io/3.8.4/plyr.svg` | URL/path to SVG sprite |
| `iconPrefix` | String | `plyr` | Icon ID prefix (prevents clashes with custom sprites) |
| `blankVideo` | String | `https://cdn.plyr.io/static/blank.mp4` | URL to blank video for cancelling network requests |
| `autoplay` | Boolean | `false` | Autoplay media on load |
| `autopause` | Boolean | `true` | Only allow one player playing at once (Vimeo only) |
| `playsinline` | Boolean | `true` | Allow inline playback on iOS |
| `seekTime` | Number | `10` | Seek time in seconds for rewind/fast-forward |
| `volume` | Number | `1` | Initial volume (0 to 1) |
| `muted` | Boolean | `false` | Start playback muted |
| `clickToPlay` | Boolean | `true` | Click video container to toggle play/pause |
| `disableContextMenu` | Boolean | `true` | Disable right-click menu on video |
| `hideControls` | Boolean | `true` | Auto-hide controls after 2s of inactivity |
| `resetOnEnd` | Boolean | `false` | Reset playback to start when media ends |
| `keyboard` | Object | `{ focused: true, global: false }` | Keyboard shortcuts scope |
| `tooltips` | Object | `{ controls: false, seek: true }` | `controls`: show tooltips on hover/focus. `seek`: show seek position tooltip |
| `duration` | Number | `null` | Custom duration for media |
| `displayDuration` | Boolean | `true` | Show duration on metadata load |
| `invertTime` | Boolean | `true` | Show remaining time instead of elapsed |
| `toggleInvert` | Boolean | `true` | Allow clicking to toggle time display |
| `listeners` | Object | `null` | Custom event listeners before default handlers |
| `captions` | Object | `{ active: false, language: 'auto', update: false }` | Caption settings |
| `fullscreen` | Object | `{ enabled: true, fallback: true, iosNative: false, container: null }` | Fullscreen settings |
| `ratio` | String | `null` | Force aspect ratio (e.g., `'16:9'`) |
| `storage` | Object | `{ enabled: true, key: 'plyr' }` | LocalStorage settings |
| `speed` | Object | `{ selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4] }` | Playback speed options |
| `quality` | Object | `{ default: 576, options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240] }` | Quality levels |
| `loop` | Object | `{ active: false }` | Loop playback |
| `ads` | Object | `{ enabled: false, publisherId: '', tagUrl: '' }` | Advertisement settings (vi.ai or custom VAST) |
| `urls` | Object | See source | Override API URLs or custom download URL |
| `vimeo` | Object | `{ byline: false, portrait: false, title: false, speed: true, transparent: false }` | Vimeo embed options |
| `youtube` | Object | `{ noCookie: false, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 }` | YouTube embed options |
| `previewThumbnails` | Object | `{ enabled: false, src: '', withCredentials: false }` | Preview thumbnail settings |
| `mediaMetadata` | Object | `{ title: '', artist: '', album: '', artwork: [] }` | Media Session API metadata |
| `markers` | Object | `{ enabled: false, points: [] }` | Chapter markers (`{ time, label }` array) |

### Example: Config via HTML Attribute

```html
<video src="/path/to/video.mp4" controls data-plyr-config='{ "title": "My Video", "autoplay": false }'></video>
```

---

## API Methods

Access methods via player instance:

```js
const player = new Plyr('#player');

player.play();                  // Start playback
player.pause();                 // Pause playback
player.fullscreen.enter();      // Enter fullscreen
player.fullscreen.exit();       // Exit fullscreen
```

### Playback Control

| Method | Parameters | Description |
|--------|------------|-------------|
| `play()` | — | Start playback. Returns Promise for HTML5 players |
| `pause()` | — | Pause playback |
| `togglePlay(toggle)` | Boolean | Toggle playback. Optional boolean to force state |
| `stop()` | — | Stop playback and reset to start |
| `restart()` | — | Restart playback from beginning |
| `rewind(seekTime)` | Number | Rewind by specified seconds (defaults to `seekTime` option) |
| `forward(seekTime)` | Number | Fast forward by specified seconds |
| `destroy()` | — | Destroy instance and cleanup |

### Volume & Audio

| Method | Parameters | Description |
|--------|------------|-------------|
| `increaseVolume(step)` | Number | Increase volume by step |
| `decreaseVolume(step)` | Number | Decrease volume by step |

### Captions

| Method | Parameters | Description |
|--------|------------|-------------|
| `toggleCaptions(toggle)` | Boolean | Toggle captions display |

### Fullscreen

| Method | Parameters | Description |
|--------|------------|-------------|
| `fullscreen.enter()` | — | Enter fullscreen (uses fallback if not supported) |
| `fullscreen.exit()` | — | Exit fullscreen |
| `fullscreen.toggle()` | — | Toggle fullscreen state |

### Other

| Method | Parameters | Description |
|--------|------------|-------------|
| `airplay()` | — | Trigger AirPlay dialog (Safari only) |
| `setPreviewThumbnails(source)` | PreviewThumbnailsOptions | Set preview thumbnail source |
| `toggleControls(toggle)` | Boolean | Show/hide controls (video only) |
| `supports(type)` | String | Check mime type support |
| `on(event, handler)` | String, Function | Add event listener |
| `once(event, handler)` | String, Function | Add one-time event listener |
| `off(event, handler)` | String, Function | Remove event listener |

---

## Properties (Getters & Setters)

### Read-Only Properties

| Property | Type | Description |
|----------|------|-------------|
| `isHTML5` | Boolean | Whether current player is HTML5 |
| `isEmbed` | Boolean | Whether current player is embedded (YouTube/Vimeo) |
| `playing` | Boolean | Whether media is currently playing |
| `paused` | Boolean | Whether media is paused |
| `stopped` | Boolean | Whether media is stopped |
| `ended` | Boolean | Whether playback has finished |
| `buffered` | Number (0-1) | How much media is buffered |
| `seeking` | Boolean | Whether player is currently seeking |
| `duration` | Number | Total duration in seconds |
| `hasAudio` | Boolean | Whether media has audio track |
| `fullscreen.active` | Boolean | Whether fullscreen is active |
| `fullscreen.enabled` | Boolean | Whether fullscreen is available |

### Read-Write Properties

| Property | Type | Description |
|----------|------|-------------|
| `currentTime` | Number | Get/set current playback position (seconds) |
| `volume` | Number (0-1) | Get/set volume |
| `muted` | Boolean | Get/set mute state |
| `speed` | Number | Get/set playback speed |
| `quality` | Number | Get/set quality level (HTML5 only) |
| `loop` | Boolean | Get/set loop state |
| `source` | Object | Get/set media source |
| `poster` | String | Get/set poster image URL |
| `previewThumbnails` | Object/String | Get/set thumbnail source |
| `autoplay` | Boolean | Get/set autoplay state |
| `currentTrack` | Number | Get/set caption track index (-1 = off) |
| `language` | String | Get/set preferred caption language (ISO code) |
| `pip` | Boolean | Get/set picture-in-picture state (Safari/Chrome) |
| `ratio` | String | Get/set video aspect ratio (e.g., `'16:9'`) |
| `download` | String | Get/set download URL |

### Examples

```js
// Getters
console.log(player.currentTime);  // 42.5
console.log(player.duration);     // 180
console.log(player.volume);       // 0.8
console.log(player.playing);      // true

// Setters
player.volume = 0.5;              // Set volume to 50%
player.currentTime = 30;          // Seek to 30 seconds
player.muted = true;              // Mute audio
player.speed = 1.5;               // Play at 1.5x speed
```

---

## Dynamic Source Change

Change media source on the fly using the `source` setter.

### HTML5 Video

```js
player.source = {
  type: 'video',
  title: 'Movie Title',
  sources: [
    { src: '/path/to/movie-720p.mp4', type: 'video/mp4', size: 720 },
    { src: '/path/to/movie-1080p.webm', type: 'video/webm', size: 1080 },
  ],
  poster: '/path/to/poster.jpg',
  previewThumbnails: { src: '/path/to/thumbnails.vtt' },
  tracks: [
    { kind: 'captions', label: 'English', srclang: 'en', src: '/path/to/en.vtt', default: true },
    { kind: 'captions', label: 'French', srclang: 'fr', src: '/path/to/fr.vtt' },
  ],
};
```

### HTML5 Audio

```js
player.source = {
  type: 'audio',
  title: 'Song Title',
  sources: [
    { src: '/path/to/song.mp3', type: 'audio/mp3' },
    { src: '/path/to/song.ogg', type: 'audio/ogg' },
  ],
};
```

### YouTube

```js
player.source = {
  type: 'video',
  sources: [
    { src: 'bTqVqk7FSmY', provider: 'youtube' },
  ],
};
```

### Vimeo

```js
player.source = {
  type: 'video',
  sources: [
    { src: '76979871', provider: 'vimeo' },
  ],
};
```

### Russian Video Hosts

#### Rutube

```js
player.source = {
  type: 'video',
  sources: [
    { src: '1e5c8c87e8d0d8d8e8d0d8d8e8d0d8d8', provider: 'rutube' },
  ],
};
```

Or via HTML:

```html
<div id="player" data-plyr-provider="rutube" data-plyr-embed-id="1e5c8c87e8d0d8d8e8d0d8d8e8d0d8d8"></div>
```

**Supported features:** quality (1080/720/480/360/240/144), captions, speed, title

#### Yandex Cloud Video

```js
player.source = {
  type: 'video',
  sources: [
    { src: 'your-video-id', provider: 'yandex' },
  ],
};
```

```html
<div id="player" data-plyr-provider="yandex" data-plyr-embed-id="your-video-id"></div>
```

**Supported features:** title, captions (if available)

#### VK Video

```js
player.source = {
  type: 'video',
  sources: [
    { src: 'video-161895864_456241478', provider: 'vk' },
  ],
};
```

```html
<div id="player" data-plyr-provider="vk" data-plyr-embed-id="video-161895864_456241478"></div>
```

**Supported features:** quality (via HD param), title. Speed and captions limited by API.

#### Mail.ru Video

```js
player.source = {
  type: 'video',
  sources: [
    { src: '1234567890', provider: 'mailru' },
  ],
};
```

```html
<div id="player" data-plyr-provider="mailru" data-plyr-embed-id="1234567890"></div>
```

**Supported features:** basic playback. Limited API support.

---

## Events

Listen to events via `on()`, `once()`, or `addEventListener()`:

```js
player.on('ready', (event) => {
  const instance = event.detail.plyr;
  console.log('Player is ready!');
});

player.on('play', () => {
  console.log('Playback started');
});
```

### Standard Events (All Providers)

| Event | Description |
|-------|-------------|
| `ready` | Instance ready for API calls |
| `play` | Playback started after pause |
| `playing` | Media begins to play |
| `pause` | Playback paused |
| `ended` | Playback completed (not fired if autoplay=true) |
| `progress` | Download progress update |
| `timeupdate` | Current time changed |
| `volumechange` | Volume or mute state changed |
| `seeking` | Seek operation started |
| `seeked` | Seek operation completed |
| `ratechange` | Playback speed changed |
| `enterfullscreen` | Entered fullscreen mode |
| `exitfullscreen` | Exited fullscreen mode |
| `captionsenabled` | Captions enabled |
| `captionsdisabled` | Captions disabled |
| `languagechange` | Caption language changed |
| `controlshidden` | Controls hidden |
| `controlsshown` | Controls shown |

### HTML5 Only Events

| Event | Description |
|-------|-------------|
| `loadstart` | Media loading started |
| `loadeddata` | First frame loaded |
| `loadedmetadata` | Metadata loaded |
| `qualitychange` | Quality level changed |
| `canplay` | Enough data to play |
| `canplaythrough` | Can play without buffering |
| `stalled` | Data fetching stalled |
| `waiting` | Waiting for another operation |
| `emptied` | Media became empty |
| `cuechange` | TextTrack cues changed |
| `error` | Error occurred (check `element.error`) |

### YouTube Only Events

| Event | Description |
|-------|-------------|
| `statechange` | Player state changed. `event.detail.code`: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `0`–`9` | Seek 0%–90% |
| `Space` / `K` | Toggle playback |
| `←` | Rewind by `seekTime` |
| `→` | Forward by `seekTime` |
| `↑` | Increase volume |
| `↓` | Decrease volume |
| `M` | Toggle mute |
| `F` | Toggle fullscreen |
| `C` | Toggle captions |
| `L` | Toggle loop |

Configure scope via `keyboard` option:

```js
const player = new Plyr('#player', {
  keyboard: {
    focused: true,   // Only when player has focus
    global: false,   // Global shortcuts (caution with multiple players)
  },
});
```

---

## Preview Thumbnails

Display video preview thumbnails on scrubber hover.

### Generate Sprites

Use tools like AWS Transcoder to generate frames, then combine into sprite images. VTT files define coordinates:

```
# 100p.vtt
00:00:01.000 --> 00:00:02.000
100p-00001.jpg#xywh=0,0,427,240
```

Coordinates: `xywh=X Offset, Y Offset, Width, Height`

### Configuration

```js
const player = new Plyr(video, {
  previewThumbnails: {
    enabled: true,
    src: '/path/to/thumbnails.vtt',
    withCredentials: false,  // Attach credentials for cross-origin requests
  },
});
```

Multiple sources:

```js
previewThumbnails: {
  enabled: true,
  src: ['/path/to/100p.vtt', '/path/to/240p.vtt'],
}
```

Dynamic update:

```js
player.previewThumbnails = {
  enabled: true,
  src: '/path/to/new-thumbnails.vtt',
};
```

---

## Fullscreen

### Configuration

```js
const player = new Plyr('#player', {
  fullscreen: {
    enabled: true,       // Enable/disable fullscreen
    fallback: true,      // Fallback to full-window mode
    iosNative: false,    // Use native iOS fullscreen (hides custom controls)
    container: null,     // Selector for ancestor to go fullscreen
  },
});
```

### API

```js
player.fullscreen.enter();   // Enter fullscreen
player.fullscreen.exit();    // Exit fullscreen
player.fullscreen.toggle();  // Toggle state

// Check state
console.log(player.fullscreen.active);   // boolean
console.log(player.fullscreen.enabled);  // boolean
```

### iOS Notes

YouTube does not support programmatic fullscreen via API on iOS. Options:
- Use fallback "full window" mode (default)
- Set `playsinline: false` or `fullscreen.iosNative: true` — uses native player, hides custom controls

---

## Custom Controls

Provide custom HTML or modify the default controls array. See [CONTROLS.md](../CONTROLS.md) for full details.

### Available Control Elements

```js
controls: [
  'play-large',      // Center play button
  'restart',         // Restart playback
  'rewind',          // Rewind
  'play',            // Play/pause
  'fast-forward',    // Fast forward
  'progress',        // Progress bar
  'current-time',    // Current time display
  'duration',        // Duration display
  'mute',            // Mute toggle
  'volume',          // Volume slider
  'captions',        // Captions toggle
  'settings',        // Settings menu
  'pip',             // Picture-in-picture
  'airplay',         // AirPlay
  'download',        // Download button
  'fullscreen',      // Fullscreen toggle
];
```

### Custom HTML Example

```js
const controls = `
<div class="plyr__controls">
  <button type="button" class="plyr__control" data-plyr="play">
    <svg><use xlink:href="#plyr-play"></use></svg>
  </button>
  <input data-plyr="volume" type="range" min="0" max="1" step="0.05">
  <button type="button" class="plyr__control" data-plyr="fullscreen">
    <svg><use xlink:href="#plyr-enter-fullscreen"></use></svg>
  </button>
</div>
`;

const player = new Plyr('#player', { controls });
```

Placeholders: `{id}`, `{seektime}`, `{title}`

---

## Internationalization (i18n)

```js
const player = new Plyr('#player', {
  i18n: {
    restart: 'Restart',
    rewind: 'Rewind {seektime}s',
    play: 'Play',
    pause: 'Pause',
    fastForward: 'Forward {seektime}s',
    seek: 'Seek',
    played: 'Played',
    buffered: 'Buffered',
    currentTime: 'Current time',
    duration: 'Duration',
    volume: 'Volume',
    mute: 'Mute',
    unmute: 'Unmute',
    enableCaptions: 'Enable captions',
    disableCaptions: 'Disable captions',
    enterFullscreen: 'Enter fullscreen',
    exitFullscreen: 'Exit fullscreen',
    frameTitle: 'Player for {title}',
    captions: 'Captions',
    settings: 'Settings',
    speed: 'Speed',
    normal: 'Normal',
    quality: 'Quality',
    loop: 'Loop',
    start: 'Start',
    end: 'End',
    all: 'All',
    reset: 'Reset',
    disabled: 'Disabled',
    advertisement: 'Ad',
  },
});
```

---

## CSS Customization

Override CSS custom properties for theming:

```css
/* Global */
:root {
  --plyr-color-main: #1ac266;
}

/* Per-player */
.player {
  --plyr-color-main: #ff6600;
}

/* Inline */
<video class="player" style="--plyr-color-main: #1ac266;">
```

### Key Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--plyr-color-main` | `#00b3ff` | Primary UI color |
| `--plyr-control-spacing` | `10px` | Space between controls |
| `--plyr-control-icon-size` | `18px` | Icon size |
| `--plyr-control-radius` | `3px` | Control border radius |
| `--plyr-menu-background` | `rgba(255,255,255,0.9)` | Menu background |
| `--plyr-menu-radius` | `4px` | Menu border radius |
| `--plyr-font-family` | — | Font family |
| `--plyr-font-size-base` | `15px` | Base font size |
| `--plyr-range-thumb-height` | `13px` | Scrubber thumb height |
| `--plyr-range-track-height` | `5px` | Scrubber track height |
| `--plyr-tooltip-background` | `rgba(255,255,255,0.9)` | Tooltip background |

Full list in [README.md](../README.md#customizing-the-css).

---

## Browser Support

| Browser | Supported |
|---------|-----------|
| Safari | Yes |
| Mobile Safari | Yes¹ |
| Firefox | Yes |
| Chrome | Yes |
| Opera | Yes |
| Edge | Yes |
| IE11 | Yes² |
| IE10 | Yes²,³ |

1. Native player forced on iPhone without `playsinline`. Volume controls disabled.
2. Native player used, no fullscreen support (use fallback).
3. Polyfills required — use `plyr.polyfilled.js` build.

### Checking Support

```js
const supported = Plyr.supported('video', 'html5');
// Returns: { pip: bool, airplay: bool, fullscreen: bool, language: bool }
```

### Disable Programmatically

```js
const player = new Plyr('#player', {
  enabled: !/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent),
});
```
