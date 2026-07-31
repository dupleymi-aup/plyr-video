// ==========================================================================
// Plyr Media
// ==========================================================================

import html5 from './html5';
import mailru from './plugins/mailru-video';
import mtslink from './plugins/mts-link';
import rutube from './plugins/rutube';
import vimeo from './plugins/vimeo';
import vk from './plugins/vk-video';
import yandex from './plugins/yandex-video';
import youtube from './plugins/youtube';
import { createElement, toggleClass, wrap } from './utils/elements';
import is from './utils/is';

// Provider setup lookup table
const providerSetup = {
  html5: html5.setup,
  youtube: youtube.setup,
  vimeo: vimeo.setup,
  rutube: rutube.setup,
  yandex: yandex.setup,
  vk: vk.setup,
  mailru: mailru.setup,
  mtslink: mtslink.setup,
};

const media = {
  // Setup media
  setup() {
    // If there's no media, bail
    if (!this.media) {
      this.debug.warn('No media element found!');
      return;
    }

    // Add type class
    toggleClass(this.elements.container, this.config.classNames.type.replace('{0}', this.type), true);

    // Add provider class
    toggleClass(this.elements.container, this.config.classNames.provider.replace('{0}', this.provider), true);

    // Add video class for embeds
    // This will require changes if audio embeds are added
    if (this.isEmbed) {
      toggleClass(this.elements.container, this.config.classNames.type.replace('{0}', 'video'), true);
    }

    // Inject the player wrapper
    if (this.isVideo) {
      // Create the wrapper div
      this.elements.wrapper = createElement('div', {
        class: this.config.classNames.video,
      });

      // Wrap the video in a container
      wrap(this.media, this.elements.wrapper);

      // Poster image container
      this.elements.poster = createElement('div', {
        class: this.config.classNames.poster,
      });
      this.elements.wrapper.appendChild(this.elements.poster);
    }

    // Dispatch to provider-specific setup via lookup table
    const setup = providerSetup[this.provider];
    if (is.function(setup)) {
      setup.call(this);
    }
  },
};

export default media;
