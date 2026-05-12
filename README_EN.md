<div align="center">

# Plyr Video Player v3.8.4

### Simple, Accessible & Customizable Media Player

[![npm version](https://badge.fury.io/js/plyr.svg)](https://badge.fury.io/js/plyr)
[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/QuadDarv1ne/plyr-video)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

---

**Author:** Dupley Maxim Igorevich

**Intellectual Property:** Dupley Maxim Igorevich

[Русская версия](README_RU.md)

</div>

---

## About the Project

**Plyr Video Player** is a simple, lightweight, accessible and customizable HTML5, YouTube, Vimeo and Russian video hosting player. The project supports all modern browsers and provides a rich API for playback control, captions, video quality and fullscreen mode.

The player is written in "vanilla" JavaScript (ES6) without framework dependencies, uses semantic HTML markup and Sass for styling. The architecture is built on progressive enhancement principles — the base `<video>` or `<audio>` element works without JavaScript, and Plyr adds extended functionality when available.

## Key Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **HTML5 Video & Audio** | Native video and audio support with custom controls |
| 2 | **YouTube & Vimeo** | Integration with popular video hosting via unified API |
| 3 | **Russian Hostings** | Support for Rutube, VK Video, Yandex Cloud Video, Mail.ru Video |
| 4 | **Video Gallery** | Interactive preview gallery for video selection (Rutube-style) |
| 5 | **Animated Preloader** | Spinner and progress bar during video loading and buffering |
| 6 | **Captions (VTT)** | WebVTT caption support with multiple tracks |
| 7 | **Fullscreen** | Native fullscreen with fallback to "full window" mode |
| 8 | **Keyboard Shortcuts** | Playback control via keyboard shortcuts |
| 9 | **Picture-in-Picture** | Picture-in-Picture mode support |
| 10 | **Playback Speed** | Speed adjustment from 0.5x to 4x |
| 11 | **Preview Thumbnails** | Display thumbnails on scrubber hover |
| 12 | **Monetization (Ads)** | VAST ad integration via vi.ai |
| 13 | **Streaming (HLS/DASH)** | Support for hls.js, Shaka Player and dash.js |
| 14 | **i18n** | Control internationalization (control translation) |
| 15 | **API** | Full programmatic API: play, pause, seek, volume, fullscreen |
| 16 | **Events** | Unified events for all media types |
| 17 | **Responsive Design** | Responsive layout for any screen size |
| 18 | **Accessibility** | Full screen reader support and ARIA attributes |
| 19 | **Sass** | Style customization via Sass variables and CSS Custom Properties |
| 20 | **Browsersync UI** | Built-in dev server with live reload and ghost mode |

## Supported Platforms

| Platform | Quality | Captions | Speed | Fullscreen |
|----------|---------|----------|-------|------------|
| **HTML5 Video** | ✓ (all) | ✓ | ✓ | ✓ |
| **HTML5 Audio** | ✓ (all) | — | ✓ | — |
| **YouTube** | ✓ (all) | ✓ | ✓ (0.5-2x) | ✓ |
| **Vimeo** | ✓ (all) | ✓ | ✓ (0.5-2x) | ✓ |
| **Rutube** | ✓ (1080/720/480/360/240/144) | ✓ | ✓ | ✓ |
| **VK Video** | ✓ (HD) | ⚠️ | ⚠️ | ✓ |
| **Yandex Cloud Video** | ✓ | ✓ (if available) | ✓ | ✓ |
| **Mail.ru Video** | ✓ | ⚠️ | ⚠️ | ✓ |
| **HLS.js** | ✓ (adaptive) | ✓ | ✓ | ✓ |
| **Shaka Player** | ✓ (adaptive) | ✓ | ✓ | ✓ |
| **Dash.js** | ✓ (adaptive) | ✓ | ✓ | ✓ |

## Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **JavaScript (ES6)** | — | Core player logic without frameworks |
| **Sass/SCSS** | — | Styling with component architecture |
| **Gulp** | 4 | Build system (CSS, JS, minification) |
| **Browsersync** | — | Dev server with live reload |
| **HLS.js** | — | HLS streaming for HTML5 video |
| **SVG Sprite** | — | Control icons via SVG sprite |
| **WebVTT** | — | Caption format |

## Installation and Setup

### Prerequisites

- **Node.js** version 18 or higher
- **npm** as package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/QuadDarv1ne/plyr-video.git
cd plyr-video

# Install dependencies
npm install

# Run in development mode
npm start
```

The application will be available at [http://localhost:3007](http://localhost:3007)
Browsersync UI panel: [http://localhost:3008](http://localhost:3008)

### Production Build

```bash
# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
plyr-video/
├── src/
│   ├── js/                      # JavaScript player logic
│   │   ├── config/              # Default configuration
│   │   ├── providers/           # Providers (HTML5, YouTube, Vimeo, Rutube, VK, Yandex, Mail.ru)
│   │   ├── utils/               # Utilities (DOM, events, browsers, promises)
│   │   ├── controls.js          # Controls management
│   │   ├── listeners.js         # Event handlers
│   │   ├── plyr.js              # Main Plyr class
│   │   ├── ui.js                # UI components (preloader, fullscreen)
│   │   └── ...                  # Other modules
│   └── sass/                    # Sass styles
│       ├── components/          # Components (control, controls, menus, preloader, etc.)
│       ├── plugins/             # Plugins (ads, preview-thumbnails)
│       ├── states/              # States (fullscreen)
│       ├── types/               # Types (audio, video)
│       ├── utils/               # Utilities (animation, hidden)
│       └── plyr.scss            # Main styles file
├── demo/                        # Demo page
│   ├── index.html               # HTML demo page
│   ├── src/
│   │   ├── js/
│   │   │   ├── demo.js          # Demo logic (gallery, video selection)
│   │   │   └── sources.js       # Video sources for demo
│   │   └── sass/
│   │       ├── components/      # Demo components (video-gallery, etc.)
│   │       └── bundles/         # Sass entry points
│   └── dist/                    # Compiled files
├── docs/                        # Documentation
│   ├── plyr-api.md              # Full API documentation
│   ├── browsersync-ui.md        # Browsersync UI guide
│   └── russian-video-hosts.md   # Russian hosting integration
├── package.json                 # Dependencies and scripts
├── gulpfile.js                  # Gulp configuration
├── README_RU.md                 # Russian documentation
├── README_EN.md                 # English documentation
└── LICENSE                      # License (bilingual)
```

## Documentation

- **[Full API Documentation](docs/plyr-api.md)** — complete guide to Plyr API, configuration, events, and methods
- **[Browsersync UI Guide](docs/browsersync-ui.md)** — development server, live reload, and debugging tools
- **[Custom Controls](CONTROLS.md)** — how to customize player controls
- **[Russian Video Hosts](docs/russian-video-hosts.md)** — Rutube, VK, Yandex, Mail.ru integration

## Roadmap

- [x] HTML5 Video & Audio support
- [x] YouTube and Vimeo integration
- [x] Russian video hostings (Rutube, VK, Yandex, Mail.ru)
- [x] Rutube-style video gallery
- [x] Animated preloader with progress bar
- [x] Preview thumbnails
- [x] HLS.js streaming
- [x] Monetization (vi.ai ads)
- [x] Full API documentation
- [x] Browsersync UI for development
- [ ] Shaka Player support
- [ ] Dash.js support
- [ ] Extended i18n (full multilingual support)
- [ ] E2E tests (Playwright)

---

## Author

**Dupley Maxim Igorevich**

This project is the intellectual property of Dupley Maxim Igorevich. All rights to the source code, design, and documentation belong to the author.

## License

This project is the intellectual property of Dupley Maxim Igorevich. Terms of use are described in the [LICENSE](./LICENSE) file.

---

<div align="center">

**Plyr Video Player v3.8.4** — © 2025 Dupley Maxim Igorevich

</div>
