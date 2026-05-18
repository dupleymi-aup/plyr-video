// ==========================================================================
// Plyr controls: Submenu builders
// ==========================================================================

import captions from '../captions';
import { dedupe } from '../utils/arrays';
import { emptyElement } from '../utils/elements';
import i18n from '../utils/i18n';
import is from '../utils/is';
import ElementCreators from './element-creators';
import MenuItems from './menu-items';
import SettingsMenu from './settings-menu';

class SubmenuBuilders {
  constructor(player) {
    this.player = player;
    this.settingsMenu = new SettingsMenu(player);
    this.elementCreators = new ElementCreators(player);
    this.menuItems = new MenuItems(player);
  }

  // Generic menu builder
  buildMenu({ type, panelKey, toggleCondition, optionsGenerator }) {
    const panel = this.player.elements.settings.panels[panelKey || type];
    if (!is.element(panel)) return;

    const list = panel.querySelector('[role="menu"]');
    const toggle = typeof toggleCondition === 'function'
      ? toggleCondition.call(this)
      : toggleCondition;

    this.settingsMenu.toggleMenuButton(type, toggle);
    emptyElement(list);
    this.settingsMenu.checkMenu();

    if (!toggle) return;

    const options = typeof optionsGenerator === 'function'
      ? optionsGenerator.call(this)
      : optionsGenerator;

    options.forEach((opt) => {
      this.menuItems.createMenuItem(opt);
    });

    this.settingsMenu.updateSetting(type, list);
  }

  // Set the quality menu
  setQualityMenu(options) {
    // Menu required
    if (!is.element(this.player.elements.settings.panels.quality)) {
      return;
    }

    const type = 'quality';

    // Set options if passed and filter based on uniqueness and config
    if (is.array(options)) {
      this.player.options.quality = dedupe(options).filter(quality => this.player.config.quality.options.includes(quality));
    }

    this.buildMenu({
      type,
      toggleCondition: () => !is.empty(this.player.options.quality) && this.player.options.quality.length > 1,
      optionsGenerator: () => {
        // Get the badge HTML for HD, 4K etc
        const getBadge = (quality) => {
          const label = i18n.get(`qualityBadge.${quality}`, this.player.config);

          if (!label.length) {
            return null;
          }

          return this.elementCreators.createBadge(label);
        };

        // Sort options by the config and then render options
        return this.player.options.quality
          .sort((a, b) => {
            const sorting = this.player.config.quality.options;
            return sorting.indexOf(a) > sorting.indexOf(b) ? 1 : -1;
          })
          .map(quality => ({
            value: quality,
            list: this.player.elements.settings.panels.quality.querySelector('[role="menu"]'),
            type,
            title: this.settingsMenu.getLabel('quality', quality),
            badge: getBadge(quality),
          }));
      },
    });
  }

  // Set the looping options (commented out in original)
  // setLoopMenu() { ... }

  // Get current selected caption language
  // TODO: rework this to use the getter in the API?

  // Set a list of available captions languages
  setCaptionsMenu() {
    // Menu required
    if (!is.element(this.player.elements.settings.panels.captions)) {
      return;
    }

    // TODO: Captions or language? Currently it's mixed
    const type = 'captions';
    const tracks = captions.getTracks.call(this.player);
    const toggle = Boolean(tracks.length);

    this.buildMenu({
      type,
      toggleCondition: toggle,
      optionsGenerator: () => {
        const list = this.player.elements.settings.panels.captions.querySelector('[role="menu"]');

        // Generate options data
        const options = tracks.map((track, value) => ({
          value,
          checked: this.player.captions?.toggled && this.player.currentTrack === value,
          title: captions.getLabel.call(this.player, track),
          badge: track.language && this.elementCreators.createBadge(track.language.toUpperCase()),
          list,
          type: 'language',
        }));

        // Add the "Off" option to turn off captions
        options.unshift({
          value: -1,
          checked: !this.player.captions?.toggled,
          title: i18n.get('captionsOff', this.player.config),
          list,
          type: 'language',
        });

        return options;
      },
    });
  }

  // Set a list of available speed options
  setSpeedMenu() {
    // Menu required
    if (!is.element(this.player.elements.settings.panels.speed)) {
      return;
    }

    const type = 'speed';

    // Filter out invalid speeds
    this.player.options.speed = this.player.options.speed.filter(o => o >= this.player.minimumSpeed && o <= this.player.maximumSpeed);

    this.buildMenu({
      type,
      toggleCondition: () => !is.empty(this.player.options.speed) && this.player.options.speed.length > 1,
      optionsGenerator: () => {
        const list = this.player.elements.settings.panels.speed.querySelector('[role="menu"]');

        return this.player.options.speed.map(speed => ({
          value: speed,
          list,
          type,
          title: this.settingsMenu.getLabel('speed', speed),
        }));
      },
    });
  }

  // Set a list of available translation languages
  setTranslationMenu() {
    // Menu required
    if (!is.element(this.player.elements.settings.panels.translation)) {
      return;
    }

    const type = 'translation';
    const languages = this.player.config.translation.languages;

    this.buildMenu({
      type,
      toggleCondition: () => !is.empty(languages) && languages.length > 0,
      optionsGenerator: () => {
        const list = this.player.elements.settings.panels.translation.querySelector('[role="menu"]');

        // Generate options data
        const options = languages.map(language => ({
          value: language,
          checked: this.player.captions?.translation?.active && this.player.captions.translation.language === language,
          title: language.toUpperCase(),
          badge: language.toUpperCase() && this.elementCreators.createBadge(language.toUpperCase()),
          list,
          type: 'translation',
        }));

        // Add the "Off" option to turn off translation
        options.unshift({
          value: 'off',
          checked: !this.player.captions?.translation?.active,
          title: i18n.get('translationOff', this.player.config),
          list,
          type: 'translation',
        });

        return options;
      },
    });
  }

  // Set a list of available transcription languages
  setTranscriptionMenu() {
    // Menu required
    if (!is.element(this.player.elements.settings.panels.transcription)) {
      return;
    }

    const type = 'transcription';
    const languages = this.player.config.translation.languages;

    this.buildMenu({
      type,
      toggleCondition: () => !is.empty(languages) && languages.length > 0,
      optionsGenerator: () => {
        const list = this.player.elements.settings.panels.transcription.querySelector('[role="menu"]');

        // Generate options data
        const options = languages.map(language => ({
          value: language,
          checked: this.player.transcription?.active && this.player.transcription.language === language,
          title: language.toUpperCase(),
          badge: language.toUpperCase() && this.elementCreators.createBadge(language.toUpperCase()),
          list,
          type: 'transcription',
        }));

        // Add the "Off" option to turn off transcription
        options.unshift({
          value: 'off',
          checked: !this.player.transcription?.active,
          title: i18n.get('transcriptionOff', this.player.config),
          list,
          type: 'transcription',
        });

        return options;
      },
    });
  }

  // Update transcription menu when language changes
  updateTranscriptionMenu() {
    if (is.element(this.player.elements.settings.panels.transcription)) {
      this.setTranscriptionMenu();
    }
  }

  // Update translation menu when language changes
  updateTranslationMenu() {
    if (is.element(this.player.elements.settings.panels.translation)) {
      this.setTranslationMenu();
    }
  }

  // Set loop menu
  setLoopMenu() {
    if (!is.element(this.player.elements.settings.panels.loop)) {
      return;
    }

    const type = 'loop';

    this.buildMenu({
      type,
      toggleCondition: true,
      optionsGenerator: () => {
        const list = this.player.elements.settings.panels.loop.querySelector('[role="menu"]');
        const { loop } = this.player.config;

        return [
          {
            value: false,
            checked: !loop.active,
            title: i18n.get('loopOff', this.player.config),
            list,
            type: 'loop',
          },
          {
            value: 'all',
            checked: loop.active && loop.start === 0 && !is.number(loop.end),
            title: i18n.get('loopAll', this.player.config),
            list,
            type: 'loop',
          },
          {
            value: 'start',
            checked: false,
            title: i18n.get('loopMarkStart', this.player.config),
            list,
            type: 'loop',
          },
          {
            value: 'end',
            checked: false,
            title: i18n.get('loopMarkEnd', this.player.config),
            list,
            type: 'loop',
          },
        ];
      },
    });
  }
}

export default SubmenuBuilders;
