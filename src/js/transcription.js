// ==========================================================================
// Plyr Transcription
// ==========================================================================

import controls from './controls';
import { createElement, getAttributesFromSelector, insertAfter, toggleClass } from './utils/elements';
import { on, triggerEvent } from './utils/events';
import i18n from './utils/i18n';
import is from './utils/is';
import { translate } from './utils/translate';

const transcription = {
  // Setup transcription
  setup() {
    // Requires UI support
    if (!this.supported.ui) {
      return;
    }

    // Skip if not HTML5 video/audio (we need media element to access audio)
    if (!this.isHTML5) {
      // For embeds, we cannot access audio stream for transcription
      // Clear menu and hide
      if (
        is.array(this.config.controls)
        && this.config.controls.includes('settings')
        && this.config.settings.includes('transcription')
      ) {
        // We'll need to update controls to set transcription menu
        // For now, just return
      }
      return;
    }

    // Check for SpeechRecognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.debug.warn('Speech Recognition not supported in this browser');
      // Disable transcription in config
      this.config.transcription.active = false;

      // Show user-facing message if UI exists
      if (this.elements.transcription) {
        this.elements.transcription.innerHTML = `<div class="plyr__transcription__message">${i18n.get('transcriptionNotSupported', this.config)}</div>`;
      }
      return;
    }

    // Inject the transcription container if not exists (we'll reuse translation container for now)
    // Actually we want to show transcription in the translation area? The user wants to show transcribed text and its translation.
    // We'll use the translation container to show either transcribed text (if translation not active) or translated text (if translation active).
    // But we also have captions container for original captions.
    // Let's plan:
    // - Captions area: shows original captions (from tracks)
    // - Translation area: shows translated captions (if translation active) OR transcribed text (if transcription active and translation not active) OR translated transcribed text (if both active)
    // However, the user asked: "перевода речи из видео с текст и показывать его справа в телесуфлёре например." meaning show transcribed text on the right in the tooltip? Actually "телесуфлёре" might be a typo for "субтитрах"? They want to show transcribed text and its translation on the right side.
    // We'll use the translation container to show the transcribed text (original language) and if translation is active, show the translation of that transcribed text.
    // We'll also need to update the translation container when transcription changes.

    // For now, we'll assume we have a translation container (already created in captions.setup). We'll use it for transcription output.
    // But we need to make sure it exists. If not, create it.
    if (!is.element(this.elements.translation)) {
      this.elements.translation = createElement('div', getAttributesFromSelector(this.config.selectors.translation));
      this.elements.translation.setAttribute('dir', 'auto');
      this.elements.translation.setAttribute('role', 'log');
      this.elements.translation.setAttribute('aria-live', 'polite');
      this.elements.translation.setAttribute('aria-label', i18n.get('transcription', this.config));
      insertAfter(this.elements.translation, this.elements.wrapper);
    }
    else if (this.elements.translation) {
      // Update ARIA attributes for transcription use
      this.elements.translation.setAttribute('role', 'log');
      this.elements.translation.setAttribute('aria-live', 'polite');
      this.elements.translation.setAttribute('aria-label', i18n.get('transcription', this.config));
    }

    // Initialize SpeechRecognition
    this.transcription.recognition = new SpeechRecognition();
    this.transcription.recognition.continuous = true;
    this.transcription.recognition.interimResults = true;
    this.transcription.recognition.lang = this.transcription.language;

    // Event listeners for recognition
    on.call(this, this.transcription.recognition, 'result', (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
        else {
          transcript += event.results[i][0].transcript;
        }
      }
      this.transcription.transcript = transcript.trim();
      // Update UI
      this.transcription.updateContainer.call(this);
    });

    on.call(this, this.transcription.recognition, 'end', () => {
      if (this.transcription.active) {
        // Restart if stopped unexpectedly
        this.transcription.recognition.start();
      }
    });

    on.call(this, this.transcription.recognition, 'error', (event) => {
      this.debug.warn('Speech recognition error', event.error);
      // Handle specific errors
      if (event.error === 'not-allowed') {
        // Microphone access denied - show user message
        this.transcription.toggle.call(this, false);

        if (this.elements.translation) {
          this.elements.translation.innerHTML = `<div class="plyr__transcription__message plyr__transcription__message--error">${i18n.get('transcriptionPermissionRequired', this.config)}</div>`;
        }
      }
    });

    // Listen for translation language changes to update the translated transcript
    on.call(this, this.media, 'translationlanguagechange', () => {
      if (this.transcription.active) {
        this.transcription.updateContainer.call(this);
      }
    });

    // Get and set initial data
    const language = (this.storage.get('transcriptionLanguage') || this.config.transcription.language || 'en').toLowerCase();
    let active = this.storage.get('transcriptionActive') || this.config.transcription.active;
    if (!is.boolean(active)) {
      active = this.config.transcription.active;
    }

    Object.assign(this.transcription, {
      active,
      language,
    });

    // Update available languages in list next tick
    setTimeout(() => {
      if (
        is.array(this.config.controls)
        && this.config.controls.includes('settings')
        && this.config.settings.includes('transcription')
      ) {
        // We'll need to update controls to set transcription menu
        // For now, just return
      }
    }, 0);
  },

  // Toggle transcription
  toggle(input, passive = true) {
    // If there's no full support
    if (!this.supported.ui) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const { active } = this.transcription; // Current state
    const activeClass = this.config.classNames.transcription.active || 'plyr--transcription-active';
    // Get the next state
    // If the method is called without parameter, toggle based on current value
    const transcriptionActive = is.nullOrUndefined(input) ? !active : input;

    // Update state and trigger event
    if (transcriptionActive !== active) {
      // When passive, don't override user preferences
      if (!passive) {
        this.transcription.active = transcriptionActive;
        this.storage.set({ transcriptionActive });
      }

      // Toggle button if it's enabled
      if (this.elements.buttons.transcription) {
        this.elements.buttons.transcription.pressed = transcriptionActive;
      }

      // Add class hook
      toggleClass(this.elements.container, activeClass, transcriptionActive);

      this.transcription.active = transcriptionActive;

      // Update settings menu
      controls.updateSetting.call(this, 'transcription');

      // Trigger event (not used internally)
      triggerEvent.call(this, this.media, transcriptionActive ? 'transcriptionenabled' : 'transcriptiondisabled');

      // Start or stop recognition
      if (transcriptionActive) {
        this.transcription.recognition.lang = this.transcription.language;
        this.transcription.recognition.start();
      }
      else {
        this.transcription.recognition.stop();
        this.transcription.transcript = '';
        this.transcription.updateContainer.call(this);
      }
    }
  },

  // Update transcription container with transcript and/or translation
  updateContainer() {
    // Requires UI
    if (!this.supported.ui) {
      return;
    }

    if (!is.element(this.elements.translation)) {
      this.debug.warn('No translation element to render to');
      return;
    }

    const content = this.transcription.transcript;

    // If translation is active, translate the transcript
    if (this.transcription.active && this.config.translation.active && content) {
      translate(content, this.config.translation.language)
        .then((translated) => {
          if (this.elements.translation) {
            this.elements.translation.innerHTML = translated;
          }
        })
        .catch((error) => {
          this.debug.warn('Translation failed:', error);
          if (this.elements.translation) {
            this.elements.translation.innerHTML = content; // Fallback to original transcript
          }
        });
    }
    else {
      // Show original transcript (or empty)
      if (this.elements.translation) {
        this.elements.translation.innerHTML = content;
      }
    }
  },

  // Set transcription language
  setLanguage(input, passive = true) {
    if (!is.string(input)) {
      this.debug.warn('Invalid language argument', input);
      return;
    }
    // Normalize
    const language = input.toLowerCase();
    this.transcription.language = language;

    // Update recognition language if active
    if (this.transcription.recognition) {
      this.transcription.recognition.lang = language;
    }

    // Store reference
    if (!passive) {
      this.storage.set({ transcriptionLanguage: language });
    }

    // Trigger event
    triggerEvent.call(this, this.media, 'transcriptionlanguagechange');

    // Update container to reflect possible translation of current transcript
    if (this.transcription.active) {
      this.transcription.updateContainer.call(this);
    }
  },
};

export default transcription;
