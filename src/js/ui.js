// ==========================================================================
// Plyr UI
// ==========================================================================

import controls from './controls';
import support from './support';
import transcription from './transcription';
import { getElement, toggleClass, toggleHidden } from './utils/elements';
import { ready, triggerEvent } from './utils/events';
import i18n from './utils/i18n';
import is from './utils/is';
import loadImage from './utils/load-image';

const ui = {
  addStyleHook() {
    toggleClass(this.elements.container, this.config.selectors.container.replace('.', ''), true);
    toggleClass(this.elements.container, this.config.classNames.uiSupported, this.supported.ui);
  },

  // Toggle native HTML5 media controls
  toggleNativeControls(toggle = false) {
    if (toggle && this.isHTML5) {
      this.media.setAttribute('controls', '');
    }
    else {
      this.media.removeAttribute('controls');
    }
  },

  // Setup the UI
  build() {
    // Re-attach media element listeners
    this.listeners.media();

    // Don't setup interface if no support
    if (!this.supported.ui) {
      this.debug.warn(`Basic support only for ${this.provider} ${this.type}`);

      // Restore native controls
      ui.toggleNativeControls.call(this, true);

      // Bail
      return;
    }

    // Inject custom controls if not present
    if (!is.element(this.elements.controls)) {
      // Inject custom controls
      controls.inject.call(this);

      // Re-attach control listeners
      this.listeners.controls();
    }

    // Remove native controls
    ui.toggleNativeControls.call(this);

    // Setup captions and transcription for HTML5
    if (this.isHTML5) {
      this.captions.setup();
      transcription.setup.call(this);
    }

    // Reset volume
    this.volume = null;

    // Reset mute state
    this.muted = null;

    // Reset loop state
    this.loop = null;

    // Reset quality setting
    this.quality = null;

    // Reset speed
    this.speed = null;

    // Reset volume display
    controls.updateVolume.call(this);

    // Reset time display
    controls.timeUpdate.call(this);

    // Reset duration display
    controls.durationUpdate.call(this);

    // Update the UI
    ui.checkPlaying.call(this);

    // Check for picture-in-picture support
    toggleClass(
      this.elements.container,
      this.config.classNames.pip.supported,
      support.pip && this.isHTML5 && this.isVideo,
    );

    // Check for airplay support
    toggleClass(this.elements.container, this.config.classNames.airplay.supported, support.airplay && this.isHTML5);

    // Add touch class
    toggleClass(this.elements.container, this.config.classNames.isTouch, this.touch);

    // Ready for API calls
    this.ready = true;

    // Ready event at end of execution stack
    setTimeout(() => {
      triggerEvent.call(this, this.media, 'ready');
    }, 0);

    // Set the title
    ui.setTitle.call(this);

    // Assure the poster image is set, if the property was added before the element was created
    if (this.poster) {
      ui.setPoster.call(this, this.poster, false).catch(() => {});
    }

    // Manually set the duration if user has overridden it.
    // The event listeners for it doesn't get called if preload is disabled (#701)
    if (this.config.duration) {
      controls.durationUpdate.call(this);
    }

    // Media metadata
    if (this.config.mediaMetadata) {
      controls.setMediaMetadata.call(this);
    }
  },

  // Setup aria attribute for play and iframe title
  setTitle() {
    // Find the current text
    let label = i18n.get('play', this.config);

    // If there's a media title set, use that for the label
    if (is.string(this.config.title) && !is.empty(this.config.title)) {
      label += `, ${this.config.title}`;
    }

    // If there's a play button, set label
    Array.from(this.elements.buttons.play || []).forEach((button) => {
      button.setAttribute('aria-label', label);
    });

    // Set iframe title
    // https://github.com/QuadDarv1ne/plyr-video/issues/124
    if (this.isEmbed) {
      const iframe = getElement.call(this, 'iframe');

      if (!is.element(iframe)) {
        return;
      }

      // Default to media type
      const title = !is.empty(this.config.title) ? this.config.title : 'video';
      const format = i18n.get('frameTitle', this.config);

      iframe.setAttribute('title', format.replace('{title}', title));
    }
  },

  // Toggle poster
  togglePoster(enable) {
    toggleClass(this.elements.container, this.config.classNames.posterEnabled, enable);
  },

  // Set the poster image (async)
  // Used internally for the poster setter, with the passive option forced to false
  setPoster(poster, passive = true) {
    // Don't override if call is passive
    if (passive && this.poster) {
      return Promise.reject(new Error('Poster already set'));
    }

    // Set property synchronously to respect the call order
    this.media.setAttribute('data-poster', poster);

    // Show the poster
    this.elements.poster.removeAttribute('hidden');

    // Wait until ui is ready
    return (
      ready
        .call(this)
        // Load image
        .then(() => loadImage(poster))
        .catch((error) => {
          // Hide poster on error unless it's been set by another call
          if (poster === this.poster) {
            ui.togglePoster.call(this, false);
          }
          // Rethrow
          throw error;
        })
        .then(() => {
          // Prevent race conditions
          if (poster !== this.poster) {
            throw new Error('setPoster cancelled by later call to setPoster');
          }
        })
        .then(() => {
          Object.assign(this.elements.poster.style, {
            backgroundImage: `url('${poster}')`,
            // Reset backgroundSize as well (since it can be set to "cover" for padded thumbnails for youtube)
            backgroundSize: '',
          });

          ui.togglePoster.call(this, true);

          return poster;
        })
    );
  },

  // Check playing state
  checkPlaying(event) {
    // Class hooks
    toggleClass(this.elements.container, this.config.classNames.playing, this.playing);
    toggleClass(this.elements.container, this.config.classNames.paused, this.paused);
    toggleClass(this.elements.container, this.config.classNames.stopped, this.stopped);

    // Set state
    Array.from(this.elements.buttons.play || []).forEach((target) => {
      Object.assign(target, { pressed: this.playing });
      target.setAttribute('aria-label', i18n.get(this.playing ? 'pause' : 'play', this.config));
    });

    // Only update controls on non timeupdate events
    if (is.event(event) && event.type === 'timeupdate') {
      return;
    }

    // Toggle controls
    ui.toggleControls.call(this);
  },

  // Check if media is loading
  checkLoading(event) {
    this.loading = ['stalled', 'waiting'].includes(event.type);

    // Clear timer
    clearTimeout(this.timers.loading);

    // Timer to prevent flicker when seeking
    this.timers.loading = setTimeout(
      () => {
        // Update progress bar loading class state
        toggleClass(this.elements.container, this.config.classNames.loading, this.loading);

        // Update controls visibility
        ui.toggleControls.call(this);
      },
      this.loading ? 250 : 0,
    );
  },

  // Show the preloader
  showPreloader() {
    // Bail if no support for UI
    if (!this.supported.ui) {
      return;
    }

    // Create preloader element if it doesn't exist
    if (!is.element(this.elements.preloader)) {
      const loadingText = i18n.get('loading', this.config) || 'Loading...';
      const preloader = document.createElement('div');
      preloader.className = 'plyr__preloader';
      preloader.innerHTML = `
        <div class="plyr__preloader__spinner"></div>
        <div class="plyr__preloader__text">${loadingText}</div>
        <div class="plyr__preloader__progress">
          <div class="plyr__preloader__progress-bar"></div>
        </div>
      `;
      this.elements.container.appendChild(preloader);
      this.elements.preloader = preloader;
    }

    // Add loading class
    toggleClass(this.elements.container, this.config.classNames.loading, true);
  },

  // Hide the preloader
  hidePreloader() {
    if (!this.supported.ui || !is.element(this.elements.preloader)) {
      return;
    }

    // Remove loading class
    toggleClass(this.elements.container, this.config.classNames.loading, false);
  },

  // Show user-facing error message
  showError(errorCode, errorMessage) {
    if (!this.supported.ui) {
      return;
    }

    // Map error code to i18n key
    const errorKeyMap = {
      1: 'errorNetwork',
      11: 'errorMediaNotFound',
      12: 'errorMediaUnavailable',
      13: 'errorGeoblocked',
      14: 'errorMediaRemoved',
      15: 'errorMediaPrivate',
      21: 'errorPlayerInit',
      23: 'errorEmbedBlocked',
      31: 'errorDRM',
      32: 'errorDRM',
    };

    const i18nKey = errorKeyMap[errorCode] || 'errorUnknown';
    const title = i18n.get('errorTitle', this.config);
    const message = errorMessage || i18n.get(i18nKey, this.config);
    const retryText = i18n.get('errorRetry', this.config);

    // Create error element if it doesn't exist
    if (!is.element(this.elements.error)) {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'plyr__error';
      errorContainer.setAttribute('role', 'alert');
      errorContainer.setAttribute('aria-live', 'assertive');
      errorContainer.innerHTML = `
        <div class="plyr__error__icon">⚠️</div>
        <div class="plyr__error__content">
          <h3 class="plyr__error__title">${title}</h3>
          <p class="plyr__error__message"></p>
          <button class="plyr__error__retry" type="button" aria-label="${retryText}">${retryText}</button>
        </div>
      `;

      // Bind retry button
      const retryButton = errorContainer.querySelector('.plyr__error__retry');
      retryButton.addEventListener('click', () => {
        this.hideError();
        if (this.isHTML5) {
          this.media.load();
        }
        else {
          this.restart();
        }
      });

      this.elements.container.appendChild(errorContainer);
      this.elements.error = errorContainer;
    }

    // Update message
    const messageEl = this.elements.error.querySelector('.plyr__error__message');
    if (messageEl) {
      messageEl.textContent = message;
    }

    // Show error
    toggleClass(this.elements.container, 'plyr--has-error', true);
    toggleHidden(this.elements.error, false);
  },

  // Hide error message
  hideError() {
    if (!is.element(this.elements.error)) {
      return;
    }

    toggleClass(this.elements.container, 'plyr--has-error', false);
    toggleHidden(this.elements.error, true);
  },

  // Update preloader progress bar
  updatePreloaderProgress(buffered) {
    if (!this.supported.ui || !is.element(this.elements.preloader)) {
      return;
    }

    const progressBar = this.elements.preloader.querySelector('.plyr__preloader__progress-bar');
    if (progressBar && is.number(buffered) && buffered > 0 && buffered <= 1) {
      progressBar.style.width = `${buffered * 100}%`;
    }
  },

  // Toggle controls based on state and `force` argument
  toggleControls(force) {
    const { controls: controlsElement } = this.elements;

    if (controlsElement && this.config.hideControls) {
      // Don't hide controls if a touch-device user recently seeked. (Must be limited to touch devices, or it occasionally prevents desktop controls from hiding.)
      const recentTouchSeek = this.touch && this.lastSeekTime + 2000 > Date.now();

      // Show controls if force, loading, paused, button interaction, or recent seek, otherwise hide
      this.toggleControls(
        Boolean(
          force || this.loading || this.paused || controlsElement.pressed || controlsElement.hover || recentTouchSeek,
        ),
      );
    }
  },

  // Migrate any custom properties from the media to the parent
  migrateStyles() {
    // Loop through values (as they are the keys when the object is spread 🤔)
    Object.values({ ...this.media.style })
      // We're only fussed about Plyr specific properties
      .filter(key => !is.empty(key) && is.string(key) && key.startsWith('--plyr'))
      .forEach((key) => {
        // Set on the container
        this.elements.container.style.setProperty(key, this.media.style.getPropertyValue(key));

        // Clean up from media element
        this.media.style.removeProperty(key);
      });

    // Remove attribute if empty
    if (is.empty(this.media.style)) {
      this.media.removeAttribute('style');
    }
  },
};

export default ui;
