// ==========================================================================
// Plyr.io demo
// This code is purely for the https://plyr.io website
// Please see README.md in the root or github.com/QuadDarv1ne/plyr-video
// ==========================================================================

import * as Sentry from '@sentry/browser';
import Shr from 'shr-buttons';

import Plyr from '../../../src/js/plyr';
import sources, { gallery } from './sources';

import 'custom-event-polyfill';
import 'url-polyfill';

const commonConfig = {
  iconUrl: 'dist/demo.svg',
  debug: true,
  keyboard: {
    global: true,
  },
  tooltips: {
    controls: true,
  },
  captions: {
    active: true,
  },
  fullscreen: {
    iosNative: true,
  },
  playsinline: true,
  vimeo: {
    // Prevent Vimeo blocking plyr.io demo site
    referrerPolicy: 'no-referrer',
  },
};

// SVG play icon for gallery items
const playIconSvg = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;

(() => {
  const production = 'plyr.io';
  const isProduction = window.location.host.includes(production);

  // Sentry for demo site (https://plyr.io) only
  if (isProduction) {
    try {
      Sentry.init({
        dsn: 'https://d4ad9866ad834437a4754e23937071e4@sentry.io/305555',
        whitelistUrls: [production].map(d => new RegExp(`https://(([a-z0-9])+(.))*${d}`)),
      });
    }
    catch {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    const selector = '#player';
    const galleryView = document.getElementById('gallery-view');
    const playerView = document.getElementById('player-view');
    const backBtn = document.getElementById('back-to-gallery');
    const galleryContainer = document.getElementById('video-gallery');

    // Setup share buttons
    Shr.setup('.js-shr', {
      count: {
        className: 'button__count',
      },
      wrapper: {
        className: 'button--with-count',
      },
    });

    // Render gallery items
    function renderGallery() {
      if (!galleryContainer) return;

      galleryContainer.innerHTML = gallery.map(item => `
        <li class="video-gallery__item" data-id="${item.id}">
          <div class="video-gallery__poster">
            <img src="${item.poster}" alt="${item.title}" loading="lazy" />
            <div class="video-gallery__play-icon">${playIconSvg}</div>
            <span class="video-gallery__duration">${item.duration}</span>
            <span class="video-gallery__provider video-gallery__provider--${item.provider}">${item.providerLabel}</span>
          </div>
          <div class="video-gallery__info">
            <h3 class="video-gallery__title">${item.title}</h3>
            <p class="video-gallery__subtitle">${item.subtitle}</p>
          </div>
        </li>
      `).join('');

      // Bind click handlers
      galleryContainer.querySelectorAll('.video-gallery__item').forEach((item) => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          selectVideo(id);
        });
      });
    }

    // Show gallery view
    function showGallery() {
      // Stop playback
      try {
        window.player?.pause();
        window.playerHls?.pause();
      }
      catch {}

      togglePlayerVisibility(window.player, false);
      togglePlayerVisibility(window.playerHls, false);

      galleryView.classList.remove('hidden');
      playerView.classList.add('hidden');

      // Show default cite
      Array.from(document.querySelectorAll('.plyr__cite')).forEach(cite => cite.hidden = true);
    }

    // Show player view
    function showPlayer() {
      galleryView.classList.add('hidden');
      playerView.classList.remove('hidden');
    }

    // Toggle player visibility
    function togglePlayerVisibility(player, show) {
      if (player?.elements?.container) {
        player.elements.container.hidden = !show;
        if (player.media) {
          player.media.hidden = !show;
          if (!show) player.pause();
        }
      }
    }

    // Select and play a video
    function selectVideo(id) {
      const sourceConfig = sources[id];
      if (!sourceConfig) return;

      showPlayer();

      // Destroy HLS player if exists
      window.playerHls?.destroy();

      // Check if this is an HLS source
      const hlsSource = sourceConfig.hlsSource;
      if (hlsSource) {
        // Create HLS player
        togglePlayerVisibility(window.player, false);

        const playerHls = new Plyr('#player-hls', { ...commonConfig, ...sourceConfig });
        window.playerHls = playerHls;

        const video = playerHls.media;
        if (window.Hls && Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(hlsSource);
          hls.attachMedia(video);
        }
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = hlsSource;
        }

        togglePlayerVisibility(playerHls, true);
      }
      else {
        // Use main player
        togglePlayerVisibility(window.playerHls, false);
        togglePlayerVisibility(window.player, true);

        window.player.source = sourceConfig;
      }

      // Update cite
      Array.from(document.querySelectorAll('.plyr__cite')).forEach(cite => cite.hidden = true);
      const cite = document.querySelector(`.plyr__cite--${id}`);
      if (cite) cite.hidden = false;
    }

    // Setup the player as video by default
    const player = new Plyr(selector, {
      ...commonConfig,
      ...sources.video,
    });

    // Expose for tinkering in the console
    window.player = player;

    // Start with gallery visible
    renderGallery();
    showGallery();

    // Back button handler
    backBtn.addEventListener('click', showGallery);

    // Handle URL hash for direct linking
    const hash = window.location.hash.substring(1);
    if (hash && sources[hash]) {
      selectVideo(hash);
    }
  });
})();
