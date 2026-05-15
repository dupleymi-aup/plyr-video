// ==========================================================================
// Plyr Captions
// ==========================================================================

import controls from './controls';
import { getLabel as getLabelFromUtils } from './captions-utils';
import { dedupe } from './utils/arrays';
import browser from './utils/browser';
import {
  createElement,
  emptyElement,
  getAttributesFromSelector,
  insertAfter,
  removeElement,
  toggleClass,
} from './utils/elements';
import { on, triggerEvent } from './utils/events';
import fetch from './utils/fetch';
import is from './utils/is';
import sendCommand from './utils/post-message';
import { getHTML } from './utils/strings';
import { translate } from './utils/translate';
import { parseUrl } from './utils/urls';

/**
 * Captions class
 */
class Captions {
  /**
   * Constructor
   * @param {Plyr} plyr - The Plyr instance
   */
  constructor(plyr) {
    this.plyr = plyr;

    // State
    this.toggled = false;
    this.active = false;
    this.language = '';
    this.languages = [];
    this.translation = {
      active: false,
      language: 'en',
    };
    this.meta = new WeakMap();
    this.currentTrack = -1;
    this.currentTrackNode = null;
    this.storage = plyr.storage;
    this.debug = plyr.debug;
    this.config = plyr.config;
    this.elements = plyr.elements;
    this.media = plyr.media;
    this.supported = plyr.supported;
    this.isVideo = plyr.isVideo;
    this.isHTML5 = plyr.isHTML5;
    this.isVimeo = plyr.isVimeo;
    this.isRutube = plyr.isRutube;
    this.isYandexCloud = plyr.isYandexCloud;
    this.isYouTube = plyr.isYouTube;
    this.embed = plyr.embed;
  }

  // Setup captions
  setup() {
    // Requires UI support
    if (!this.supported.ui) {
      return;
    }

    // Skip YouTube (handles captions internally) and HTML5 without textTrack support
    if (!this.isVideo || this.isYouTube || (this.isHTML5 && !this.supported.textTracks)) {
      // Clear menu and hide
      if (
        is.array(this.config.controls)
        && this.config.controls.includes('settings')
        && this.config.settings.includes('captions')
      ) {
        controls.setCaptionsMenu.call(this.plyr);
      }

      return;
    }

    // For embeds (Vimeo, Rutube, Yandex), wait for tracks to be available
    if (this.isVimeo || this.isRutube || this.isYandexCloud) {
      // Captions will be setup when tracks are loaded from the embed API
      return;
    }

    // Inject the container
    if (!is.element(this.elements.captions)) {
      this.elements.captions = createElement('div', getAttributesFromSelector(this.config.selectors.captions));
      this.elements.captions.setAttribute('dir', 'auto');

      insertAfter(this.elements.captions, this.elements.wrapper);
    }

    // Inject the translation container
    if (!is.element(this.elements.translation)) {
      this.elements.translation = createElement('div', getAttributesFromSelector(this.config.selectors.translation));
      this.elements.translation.setAttribute('dir', 'auto');
      insertAfter(this.elements.translation, this.elements.wrapper);
    }

    // Fix IE captions if CORS is used
    // Fetch captions and inject as blobs instead (data URIs not supported!)
    if (browser.isIE && window.URL) {
      const elements = this.media.querySelectorAll('track');

      Array.from(elements).forEach((track) => {
        const src = track.getAttribute('src');
        const url = parseUrl(src);

        if (
          url !== null
          && url.hostname !== window.location.href.hostname
          && ['http:', 'https:'].includes(url.protocol)
        ) {
          fetch(src, 'blob')
            .then((blob) => {
              track.setAttribute('src', window.URL.createObjectURL(blob));
            })
            .catch(() => {
              removeElement(track);
            });
        }
      });
    }

    // Get and set initial data
    // The "preferred" options are not realized unless / until the wanted language has a match
    // * languages: Array of user's browser languages.
    // * language:  The language preferred by user settings or config
    // * active:    The state preferred by user settings or config
    // * toggled:   The real captions state

    const browserLanguages = navigator.languages || [navigator.language || navigator.userLanguage || 'en'];
    const languages = dedupe(browserLanguages.map(language => language.split('-')[0]));
    let language = (this.storage.get('language') || this.captions.language || this.config.captions.language || 'auto').toLowerCase();

    // Use first browser language when language is 'auto'
    if (language === 'auto') {
      [language] = languages;
    }

    let active = this.storage.get('captions') || this.active;
    if (!is.boolean(active)) {
      ({ active } = this.config.captions);
    }

    // Translation state
    let translationActive = this.storage.get('translationActive') || this.config.translation.active;
    if (!is.boolean(translationActive)) {
      translationActive = this.config.translation.active;
    }
    let translationLanguage = this.storage.get('translationLanguage') || this.config.translation.language;
    if (!is.string(translationLanguage)) {
      translationLanguage = this.config.translation.language;
    }

    Object.assign(this, {
      toggled: false,
      active,
      language,
      languages,
      translation: {
        active: translationActive,
        language: translationLanguage,
      },
    });

    // Watch changes to textTracks and update captions menu
    if (this.isHTML5) {
      const trackEvents = this.config.captions.update ? 'addtrack removetrack' : 'removetrack';
      on.call(this.plyr, this.media.textTracks, trackEvents, this.update.bind(this));
    }

    // Update available languages in list next tick (the event must not be triggered before the listeners)
    setTimeout(this.update.bind(this), 0);
  }

  // Update available language options in settings based on tracks
  update() {
    const tracks = this.getTracks(true);
    // Get the wanted language
    const { active, language, meta, currentTrackNode } = this;
    const languageExists = Boolean(tracks.find(track => track.language === language));

    // Handle tracks (add event listener and "pseudo"-default)
    if (this.isHTML5 && this.isVideo) {
      tracks
        .filter(track => !meta.get(track))
        .forEach((track) => {
          this.debug.log('Track added', track);

          // Attempt to store if the original dom element was "default"
          meta.set(track, {
            default: track.mode === 'showing',
          });

          // Turn off native caption rendering to avoid double captions
          // Note: mode='hidden' forces a track to download. To ensure every track
          // isn't downloaded at once, only 'showing' tracks should be reassigned

          if (track.mode === 'showing') {
            track.mode = 'hidden';
          }

          // Add event listener for cue changes
          on.call(this.plyr, track, 'cuechange', () => this.updateCues());
        });
    }

    // Update language first time it matches, or if the previous matching track was removed
    if ((languageExists && this.language !== language) || !tracks.includes(currentTrackNode)) {
      this.setLanguage(language);
      this.toggle(active && languageExists);
    }

    // Enable or disable captions based on track length
    if (this.elements) {
      toggleClass(this.elements.container, this.config.classNames.captions.enabled, !is.empty(tracks));
    }

    // Update available languages in list
    if (
      is.array(this.config.controls)
      && this.config.controls.includes('settings')
      && this.config.settings.includes('captions')
    ) {
      controls.setCaptionsMenu.call(this.plyr);
    }
  }

  // Toggle captions display
  // Used internally for the toggleCaptions method, with the passive option forced to false
  toggle(input, passive = true) {
    // If there's no full support
    if (!this.supported.ui) {
      return;
    }

    const { toggled } = this; // Current state
    const activeClass = this.config.classNames.captions.active;
    // Get the next state
    // If the method is called without parameter, toggle based on current value
    const active = is.nullOrUndefined(input) ? !toggled : input;

    // Update state and trigger event
    if (active !== toggled) {
      // When passive, don't override user preferences
      if (!passive) {
        this.active = active;
        this.storage.set({ captions: active });
      }

      // Force language if the call isn't passive and there is no matching language to toggle to
      if (!this.language && active && !passive) {
        const tracks = this.getTracks();
        const track = this.findTrack([this.language, ...this.languages], true);

        // Override user preferences to avoid switching languages if a matching track is added
        this.language = track.language;

        // Set caption, but don't store in localStorage as user preference
        this.set(tracks.indexOf(track));
        return;
      }

      // Toggle button if it's enabled
      if (this.elements.buttons.captions) {
        this.elements.buttons.captions.pressed = active;
      }

      // Add class hook
      toggleClass(this.elements.container, activeClass, active);

      this.toggled = active;

      // Update settings menu
      controls.updateSetting.call(this.plyr, 'captions');

      // Trigger event (not used internally)
      triggerEvent.call(this.plyr, this.media, active ? 'captionsenabled' : 'captionsdisabled');
    }

    // Wait for the call stack to clear before setting mode='hidden'
    // on the active track - forcing the browser to download it
    setTimeout(() => {
      if (active && this.toggled) {
        this.currentTrackNode.mode = 'hidden';
      }
    });
  }

  // Toggle translation display
  toggleTranslation(input, passive = true) {
    // If there's no full support
    if (!this.supported.ui) {
      return;
    }

    const { active } = this.translation; // Current state
    const activeClass = this.config.classNames.translation.active;
    // Get the next state
    // If the method is called without parameter, toggle based on current value
    const translationActive = is.nullOrUndefined(input) ? !active : input;

    // Update state and trigger event
    if (translationActive !== active) {
      // When passive, don't override user preferences
      if (!passive) {
        this.translation.active = translationActive;
        this.storage.set({ translationActive });
      }

      // Toggle button if it's enabled
      if (this.elements.buttons.translation) {
        this.elements.buttons.translation.pressed = translationActive;
      }

      // Add class hook
      toggleClass(this.elements.container, activeClass, translationActive);

      // Update settings menu
      controls.updateSetting.call(this.plyr, 'translation');

      // Trigger event (not used internally)
      triggerEvent.call(this.plyr, this.media, translationActive ? 'translationenabled' : 'translationdisabled');
    }

    // Update translation container immediately
    if (translationActive && this.elements.translation && this.elements.captions.innerHTML) {
      // Translate current captions
      translate(this.elements.captions.innerHTML, this.translation.language)
        .then((translated) => {
          if (this.elements.translation) {
            this.elements.translation.innerHTML = translated;
          }
        })
        .catch((error) => {
          console.warn('Translation failed:', error);
          if (this.elements.translation) {
            this.elements.translation.innerHTML = '';
          }
        });
    }
    else if (this.elements.translation) {
      // Clear translation container if not active
      this.elements.translation.innerHTML = '';
    }
  }

  // Set captions by track index
  // Used internally for the currentTrack setter with the passive option forced to false
  set(index, passive = true) {
    const tracks = this.getTracks();

    // Disable captions if setting to -1
    if (index === -1) {
      this.toggle(false, passive);
      return;
    }

    if (!is.number(index)) {
      this.debug.warn('Invalid caption argument', index);
      return;
    }

    if (!(index in tracks)) {
      this.debug.warn('Track not found', index);
      return;
    }

    if (this.currentTrack !== index) {
      this.currentTrack = index;
      const track = tracks[index];
      const { language } = track || {};

      // Store reference to node for invalidation on remove
      this.currentTrackNode = track;

      // Update settings menu
      controls.updateSetting.call(this.plyr, 'captions');

      // When passive, don't override user preferences
      if (!passive) {
        this.language = language;
        this.storage.set({ language });
      }

      // Handle Vimeo captions
      if (this.isVimeo) {
        // Enable text track but don't render captions within the player
        // Since we handle that ourselves
        this.embed.enableTextTrack(language, null, false);
      }

      // Handle Rutube captions
      if (this.isRutube) {
        // Send command to Rutube to enable the caption track
        const rutubeTrack = this.embed.captionTracks && this.embed.captionTracks[index];
        if (rutubeTrack) {
          sendCommand(this.plyr, 'player:setCaption', { id: rutubeTrack.id, enabled: true });
        }
      }

      // Handle Yandex Cloud Video captions
      if (this.isYandexCloud) {
        // Send command to Yandex to enable the caption track
        const yandexTrack = this.embed.captionTracks && this.embed.captionTracks[index];
        if (yandexTrack) {
          sendCommand(this.plyr, 'player:setCaption', { id: yandexTrack.id, enabled: true });
        }
      }

      // Trigger event
      triggerEvent.call(this.plyr, this.media, 'languagechange');
    }

    // Show captions
    this.toggle(true, passive);

    if (this.isHTML5 && this.isVideo) {
      // If we change the active track while a cue is already displayed we need to update it
      this.updateCues();
    }
  }

  // Set captions by language
  // Used internally for the language setter with the passive option forced to false
  setLanguage(input, passive = true) {
    if (!is.string(input)) {
      this.debug.warn('Invalid language argument', input);
      return;
    }
    // Normalize
    const language = input.toLowerCase();
    this.language = language;

    // Set currentTrack
    const tracks = this.getTracks();
    const track = this.findTrack([language]);
    this.set(tracks.indexOf(track), passive);
  }

  // Get current valid caption tracks
  // If update is false it will also ignore tracks without metadata
  // This is used to "freeze" the language options when captions.update is false
  getTracks(update = false) {
    // Handle media or textTracks missing or null
    const tracks = Array.from((this.media || {}).textTracks || []);
    // For HTML5, use cache instead of current tracks when it exists (if captions.update is false)
    // Filter out removed tracks and tracks that aren't captions/subtitles (for example metadata)
    return tracks
      .filter(track => !this.isHTML5 || update || this.meta.has(track))
      .filter(track => ['captions', 'subtitles'].includes(track.kind));
  }

  // Match tracks based on languages and get the first
  findTrack(languages, force = false) {
    const tracks = this.getTracks();
    const sortIsDefault = track => Number((this.meta.get(track) || {}).default);
    const sorted = Array.from(tracks).sort((a, b) => sortIsDefault(b) - sortIsDefault(a));
    let track;

    languages.every((language) => {
      track = sorted.find(t => t.language === language);
      return !track; // Break iteration if there is a match
    });

    // If no match is found but is required, get first
    return track || (force ? sorted[0] : undefined);
  }

  // Get the current track
  getCurrentTrack() {
    return this.getTracks()[this.currentTrack];
  }

  // Get UI label for track
  getLabel(track) {
    return getLabelFromUtils(this, track);
  }

  // Update captions using current track's active cues
  // Also optional array argument in case there isn't any track (ex: vimeo)
  updateCues(input) {
    // Requires UI
    if (!this.supported.ui) {
      return;
    }

    if (!is.element(this.elements.captions)) {
      this.debug.warn('No captions element to render to');
      return;
    }

    // Only accept array or empty input
    if (!is.nullOrUndefined(input) && !Array.isArray(input)) {
      this.debug.warn('updateCues: Invalid input', input);
      return;
    }

    let cues = input;

    // Get cues from track
    if (!cues) {
      const track = this.getCurrentTrack();

      cues = Array.from((track || {}).activeCues || [])
        .map(cue => cue.getCueAsHTML())
        .map(getHTML);
    }

    // Set new caption text
    const content = cues.map(cueText => cueText.trim()).join('\n');
    const changed = content !== this.elements.captions.innerHTML;

    if (changed) {
      // Empty the container and create a new child element
      emptyElement(this.elements.captions);
      const caption = createElement('span', getAttributesFromSelector(this.config.selectors.caption));
      caption.innerHTML = content;
      this.elements.captions.appendChild(caption);

      // Update translation container if translation is active and transcription is not active
      if (this.translation.active && !(this.plyr.transcription && this.plyr.transcription.active)) {
        translate(content, this.translation.language)
          .then((translated) => {
            if (this.elements.translation) {
              this.elements.translation.innerHTML = translated;
            }
          })
          .catch((error) => {
            console.warn('Translation failed:', error);
            if (this.elements.translation) {
              this.elements.translation.innerHTML = ''; // Clear on error
            }
          });
      }
      else if (this.elements.translation && !(this.plyr.transcription && this.plyr.transcription.active)) {
        // Clear translation container if not active (and transcription is not active)
        this.elements.translation.innerHTML = '';
      }

      // Trigger event
      triggerEvent.call(this.plyr, this.media, 'cuechange');
    }
  }
}

export default Captions;
