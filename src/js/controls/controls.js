// ==========================================================================
// Plyr controls: Orchestrator class
// ==========================================================================

import html5 from '../html5';
import support from '../support';
import { dedupe } from '../utils/arrays';
import browser from '../utils/browser';
import {
  createElement,
  getAttributesFromSelector,
  getElement,
  getElements,
  hasClass,
  toggleClass,
} from '../utils/elements';
import { on } from '../utils/events';
import i18n from '../utils/i18n';
import is from '../utils/is';
import loadSprite from '../utils/load-sprite';
import { extend } from '../utils/objects';
import { replaceAll } from '../utils/strings';

import DownloadMetadata from './download-metadata';
import ElementCreators from './element-creators';
import Icon from './icon';
import Markers from './markers';
import MenuItems from './menu-items';
import RangeProgress from './range-progress';
import SettingsMenu from './settings-menu';
import SubmenuBuilders from './submenu-builders';
import TimeDisplay from './time-display';

class Controls {
  static idCounter = 0;

  constructor(player) {
    this.player = player;

    // Compose sub-modules
    this.icon = new Icon(player);
    this.elementCreators = new ElementCreators(player);
    this.menuItems = new MenuItems(player);
    this.timeDisplay = new TimeDisplay(player);
    this.rangeProgress = new RangeProgress(player);
    this.settingsMenu = new SettingsMenu(player);
    this.submenuBuilders = new SubmenuBuilders(player);
    this.markers = new Markers(player);
    this.downloadMetadata = new DownloadMetadata(player);
  }

  // ===========================================================================
  // Delegated methods — thin wrappers to sub-modules
  // ===========================================================================

  getIconUrl() {
    return this.icon.getIconUrl();
  }

  createIcon(type, attributes) {
    return this.icon.createIcon(type, attributes);
  }

  createLabel(key, attr) {
    return this.elementCreators.createLabel(key, attr);
  }

  createBadge(text) {
    return this.elementCreators.createBadge(text);
  }

  createButton(buttonType, attr) {
    return this.elementCreators.createButton(buttonType, attr);
  }

  createRange(type, attributes) {
    return this.elementCreators.createRange(type, attributes);
  }

  createProgress(type, attributes) {
    return this.elementCreators.createProgress(type, attributes);
  }

  createTime(type, attrs) {
    return this.elementCreators.createTime(type, attrs);
  }

  bindMenuItemShortcuts(menuItem, type) {
    return this.menuItems.bindMenuItemShortcuts(menuItem, type);
  }

  createMenuItem(params) {
    return this.menuItems.createMenuItem(params);
  }

  formatTime(time, inverted) {
    return this.timeDisplay.formatTime(time, inverted);
  }

  updateTimeDisplay(target, time, inverted) {
    return this.timeDisplay.updateTimeDisplay(target, time, inverted);
  }

  timeUpdate(event) {
    return this.timeDisplay.timeUpdate(event);
  }

  durationUpdate() {
    return this.timeDisplay.durationUpdate();
  }

  updateVolume() {
    return this.rangeProgress.updateVolume();
  }

  setRange(target, value) {
    return this.rangeProgress.setRange(target, value);
  }

  updateProgress(event) {
    return this.rangeProgress.updateProgress(event);
  }

  updateRangeFill(target) {
    return this.rangeProgress.updateRangeFill(target);
  }

  updateSeekTooltip(event) {
    return this.rangeProgress.updateSeekTooltip(event);
  }

  toggleMenuButton(setting, toggle) {
    return this.settingsMenu.toggleMenuButton(setting, toggle);
  }

  updateSetting(setting, container, input) {
    return this.settingsMenu.updateSetting(setting, container, input);
  }

  getLabel(setting, value) {
    return this.settingsMenu.getLabel(setting, value);
  }

  checkMenu() {
    return this.settingsMenu.checkMenu();
  }

  focusFirstMenuItem(pane, focusVisible) {
    return this.settingsMenu.focusFirstMenuItem(pane, focusVisible);
  }

  toggleMenu(input) {
    return this.settingsMenu.toggleMenu(input);
  }

  getMenuSize(tab) {
    return this.settingsMenu.getMenuSize(tab);
  }

  showMenuPanel(type, focusVisible) {
    return this.settingsMenu.showMenuPanel(type, focusVisible);
  }

  setQualityMenu(options) {
    return this.submenuBuilders.setQualityMenu(options);
  }

  setSpeedMenu() {
    return this.submenuBuilders.setSpeedMenu();
  }

  setCaptionsMenu() {
    return this.submenuBuilders.setCaptionsMenu();
  }

  setTranslationMenu() {
    return this.submenuBuilders.setTranslationMenu();
  }

  setTranscriptionMenu() {
    return this.submenuBuilders.setTranscriptionMenu();
  }

  updateTranscriptionMenu() {
    return this.submenuBuilders.updateTranscriptionMenu();
  }

  updateTranslationMenu() {
    return this.submenuBuilders.updateTranslationMenu();
  }

  setLoopMenu() {
    return this.submenuBuilders.setLoopMenu();
  }

  setMarkers() {
    return this.markers.setMarkers();
  }

  setDownloadUrl() {
    return this.downloadMetadata.setDownloadUrl();
  }

  setMediaMetadata() {
    return this.downloadMetadata.setMediaMetadata();
  }

  // ===========================================================================
  // Core methods
  // ===========================================================================

  // Find the UI controls
  findElements() {
    try {
      this.player.elements.controls = getElement.call(this.player, this.player.config.selectors.controls.wrapper);

      // Buttons
      this.player.elements.buttons = {
        play: getElements.call(this.player, this.player.config.selectors.buttons.play),
        pause: getElement.call(this.player, this.player.config.selectors.buttons.pause),
        restart: getElement.call(this.player, this.player.config.selectors.buttons.restart),
        rewind: getElement.call(this.player, this.player.config.selectors.buttons.rewind),
        fastForward: getElement.call(this.player, this.player.config.selectors.buttons.fastForward),
        mute: getElement.call(this.player, this.player.config.selectors.buttons.mute),
        pip: getElement.call(this.player, this.player.config.selectors.buttons.pip),
        airplay: getElement.call(this.player, this.player.config.selectors.buttons.airplay),
        settings: getElement.call(this.player, this.player.config.selectors.buttons.settings),
        captions: getElement.call(this.player, this.player.config.selectors.buttons.captions),
        fullscreen: getElement.call(this.player, this.player.config.selectors.buttons.fullscreen),
        darkMode: getElements.call(this.player, this.player.config.selectors.buttons.darkMode),
      };

      // Progress
      this.player.elements.progress = getElement.call(this.player, this.player.config.selectors.progress);

      // Inputs
      this.player.elements.inputs = {
        seek: getElement.call(this.player, this.player.config.selectors.inputs.seek),
        volume: getElement.call(this.player, this.player.config.selectors.inputs.volume),
      };

      // Display
      this.player.elements.display = {
        buffer: getElement.call(this.player, this.player.config.selectors.display.buffer),
        currentTime: getElement.call(this.player, this.player.config.selectors.display.currentTime),
        duration: getElement.call(this.player, this.player.config.selectors.display.duration),
      };

      // Seek tooltip
      if (is.element(this.player.elements.progress)) {
        this.player.elements.display.seekTooltip = this.player.elements.progress.querySelector(`.${this.player.config.classNames.tooltip}`);
      }

      return true;
    }
    catch (error) {
      // Log it
      this.player.debug.warn('It looks like there is a problem with your custom controls HTML', error);

      // Restore native video controls
      this.player.toggleNativeControls(true);

      return false;
    }
  }

  // Build the default HTML
  create(data) {
    this.player.elements.controls = null;

    // Larger overlaid play button
    if (is.array(this.player.config.controls) && this.player.config.controls.includes('play-large')) {
      this.player.elements.container.appendChild(this.createButton('play-large'));
    }

    // Create the container
    const container = createElement('div', getAttributesFromSelector(this.player.config.selectors.controls.wrapper));
    this.player.elements.controls = container;

    // Default item attributes
    const defaultAttributes = { class: 'plyr__controls__item' };

    // Loop through controls in order
    dedupe(is.array(this.player.config.controls) ? this.player.config.controls : []).forEach((control) => {
      // Restart button
      if (control === 'restart') {
        container.appendChild(this.createButton('restart', defaultAttributes));
      }

      // Rewind button
      if (control === 'rewind') {
        container.appendChild(this.createButton('rewind', defaultAttributes));
      }

      // Play/Pause button
      if (control === 'play') {
        container.appendChild(this.createButton('play', defaultAttributes));
      }

      // Fast forward button
      if (control === 'fast-forward') {
        container.appendChild(this.createButton('fast-forward', defaultAttributes));
      }

      // Progress
      if (control === 'progress') {
        const progressContainer = createElement('div', {
          class: `${defaultAttributes.class} plyr__progress__container`,
        });

        const progress = createElement('div', getAttributesFromSelector(this.player.config.selectors.progress));

        // Seek range slider
        progress.appendChild(
          this.createRange('seek', {
            id: `plyr-seek-${data.id}`,
          }),
        );

        // Buffer progress
        progress.appendChild(this.createProgress('buffer'));

        // Seek tooltip
        if (this.player.config.tooltips.seek) {
          const tooltip = createElement(
            'span',
            {
              class: this.player.config.classNames.tooltip,
            },
            '00:00',
          );

          progress.appendChild(tooltip);
          this.player.elements.display.seekTooltip = tooltip;
        }

        this.player.elements.progress = progress;
        progressContainer.appendChild(this.player.elements.progress);
        container.appendChild(progressContainer);
      }

      // Media current time display
      if (control === 'current-time') {
        container.appendChild(this.createTime('currentTime', defaultAttributes));
      }

      // Media duration display
      if (control === 'duration') {
        container.appendChild(this.createTime('duration', defaultAttributes));
      }

      // Volume controls
      if (control === 'mute' || control === 'volume') {
        let { volume } = this.player.elements;

        // Create the volume container if needed
        if (!is.element(volume) || !container.contains(volume)) {
          volume = createElement(
            'div',
            extend({}, defaultAttributes, {
              class: `${defaultAttributes.class} plyr__volume`.trim(),
            }),
          );

          this.player.elements.volume = volume;

          container.appendChild(volume);
        }

        // Toggle mute button
        if (control === 'mute') {
          volume.appendChild(this.createButton('mute'));
        }

        // Volume range control
        // Ignored on iOS as it's handled globally
        // https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html
        if (control === 'volume' && !browser.isIos && !browser.isIPadOS) {
          // Set the attributes
          const attributes = {
            max: 1,
            step: 0.05,
            value: this.player.config.volume,
          };

          // Create the volume range slider
          volume.appendChild(
            this.createRange(
              'volume',
              extend(attributes, {
                id: `plyr-volume-${data.id}`,
              }),
            ),
          );
        }
      }

      // Toggle captions button
      if (control === 'captions') {
        container.appendChild(this.createButton('captions', defaultAttributes));
      }

      // Toggle translation button
      if (control === 'translation') {
        container.appendChild(this.createButton('translation', defaultAttributes));
      }

      // Toggle transcription button
      if (control === 'transcription') {
        container.appendChild(this.createButton('transcription', defaultAttributes));
      }

      // Toggle dark mode button
      if (control === 'dark-mode') {
        container.appendChild(this.createButton('dark-mode', defaultAttributes));
      }

      // Screenshot button (HTML5 only)
      if (control === 'screenshot' && this.player.isHTML5) {
        container.appendChild(this.createButton('screenshot', defaultAttributes));
      }

      // Share button
      if (control === 'share') {
        container.appendChild(this.createButton('share', defaultAttributes));
      }

      // Settings button / menu
      if (control === 'settings' && !is.empty(this.player.config.settings)) {
        const wrapper = createElement(
          'div',
          extend({}, defaultAttributes, {
            class: `${defaultAttributes.class} plyr__menu`.trim(),
            hidden: '',
          }),
        );

        wrapper.appendChild(
          this.createButton('settings', {
            'aria-haspopup': true,
            'aria-controls': `plyr-settings-${data.id}`,
            'aria-expanded': false,
          }),
        );

        const popup = createElement('div', {
          class: 'plyr__menu__container',
          id: `plyr-settings-${data.id}`,
          hidden: '',
        });

        const inner = createElement('div');

        const home = createElement('div', {
          id: `plyr-settings-${data.id}-home`,
        });

        // Create the menu
        const menu = createElement('div', {
          role: 'menu',
        });

        home.appendChild(menu);
        inner.appendChild(home);
        this.player.elements.settings.panels.home = home;

        // Build the menu items
        this.player.config.settings.forEach((type) => {
          // Menu item for a settings category (separate from createMenuItem which handles selectable options)
          const menuItem = createElement(
            'button',
            extend(getAttributesFromSelector(this.player.config.selectors.buttons.settings), {
              'type': 'button',
              'class': `${this.player.config.classNames.control} ${this.player.config.classNames.control}--forward`,
              'role': 'menuitem',
              'aria-haspopup': true,
              'hidden': '',
            }),
          );

          // Bind menu shortcuts for keyboard users
          this.bindMenuItemShortcuts(menuItem, type);

          // Show menu on click
          on.call(this.player, menuItem, 'click', () => {
            this.showMenuPanel(type, false);
          });

          const flex = createElement('span', null, i18n.get(type, this.player.config));

          const value = createElement('span', {
            class: this.player.config.classNames.menu.value,
          }, String(data[type] ?? ''));

          flex.appendChild(value);
          menuItem.appendChild(flex);

          // Add educational description via title attribute
          const descriptionKey = `${type}Description`;
          const description = i18n.get(descriptionKey, this.player.config);
          if (description && description.length) {
            menuItem.setAttribute('title', description);
            menuItem.setAttribute('aria-describedby', `plyr-settings-desc-${type}`);

            // Add hidden description element for screen readers
            const descEl = createElement('span', {
              class: this.player.config.classNames.hidden,
              id: `plyr-settings-desc-${type}`,
            }, description);
            menuItem.appendChild(descEl);
          }

          menu.appendChild(menuItem);

          // Build the panes
          const pane = createElement('div', {
            id: `plyr-settings-${data.id}-${type}`,
            hidden: '',
          });

          // Back button
          const backButton = createElement('button', {
            type: 'button',
            class: `${this.player.config.classNames.control} ${this.player.config.classNames.control}--back`,
          });

          // Visible label
          backButton.appendChild(
            createElement(
              'span',
              {
                'aria-hidden': true,
              },
              i18n.get(type, this.player.config),
            ),
          );

          // Screen reader label
          backButton.appendChild(
            createElement(
              'span',
              {
                class: this.player.config.classNames.hidden,
              },
              i18n.get('menuBack', this.player.config),
            ),
          );

          // Go back via keyboard
          on.call(
            this.player,
            pane,
            'keydown',
            (event) => {
              if (event.key !== 'ArrowLeft') return;

              // Prevent seek
              event.preventDefault();
              event.stopPropagation();

              // Show the respective menu
              this.showMenuPanel('home', true);
            },
            false,
          );

          // Go back via button click
          on.call(this.player, backButton, 'click', () => {
            this.showMenuPanel('home', false);
          });

          // Add help text to the panel itself
          const helpText = i18n.get(`${type}Help`, this.player.config);
          if (helpText && helpText.length) {
            const helpElement = createElement('div', {
              class: 'plyr__menu__help',
            }, helpText);
            pane.appendChild(helpElement);
          }

          // Add to pane
          pane.appendChild(backButton);

          // Menu
          pane.appendChild(
            createElement('div', {
              role: 'menu',
            }),
          );

          inner.appendChild(pane);

          this.player.elements.settings.buttons[type] = menuItem;
          this.player.elements.settings.panels[type] = pane;
        });

        // Add keyboard shortcuts menu item
        const shortcutsMenuItem = createElement(
          'button',
          extend(getAttributesFromSelector(this.player.config.selectors.buttons.settings), {
            'type': 'button',
            'class': `${this.player.config.classNames.control} ${this.player.config.classNames.control}--forward`,
            'role': 'menuitem',
            'aria-haspopup': true,
          }),
        );

        const shortcutsFlex = createElement('span', null, i18n.get('keyboardShortcuts', this.player.config));
        shortcutsMenuItem.appendChild(shortcutsFlex);

        const shortcutsDescription = i18n.get('keyboardShortcutsHelp', this.player.config);
        if (shortcutsDescription && shortcutsDescription.length) {
          shortcutsMenuItem.setAttribute('title', shortcutsDescription);
        }

        // Show shortcuts on click
        on.call(this.player, shortcutsMenuItem, 'click', () => {
          this.showMenuPanel('shortcuts', false);
        });

        menu.appendChild(shortcutsMenuItem);

        // Build the shortcuts panel
        const shortcutsPane = createElement('div', {
          id: `plyr-settings-${data.id}-shortcuts`,
          hidden: '',
        });

        // Back button
        const shortcutsBackButton = createElement('button', {
          type: 'button',
          class: `${this.player.config.classNames.control} ${this.player.config.classNames.control}--back`,
        });

        shortcutsBackButton.appendChild(
          createElement(
            'span',
            { 'aria-hidden': true },
            i18n.get('keyboardShortcuts', this.player.config),
          ),
        );

        shortcutsBackButton.appendChild(
          createElement(
            'span',
            { class: this.player.config.classNames.hidden },
            i18n.get('menuBack', this.player.config),
          ),
        );

        on.call(this.player, shortcutsBackButton, 'click', () => {
          this.showMenuPanel('home', false);
        });

        shortcutsPane.appendChild(shortcutsBackButton);

        // Shortcuts list
        const shortcutsList = createElement('div', {
          role: 'menu',
          class: 'plyr__shortcuts-list',
        });

        const shortcuts = [
          { key: 'Space / k', i18n: 'shortcutPlayPause' },
          { key: '←', i18n: 'shortcutRewind' },
          { key: '→', i18n: 'shortcutForward' },
          { key: '0-9', i18n: 'shortcutSeek' },
          { key: '↑', i18n: 'shortcutVolumeUp' },
          { key: '↓', i18n: 'shortcutVolumeDown' },
          { key: 'm', i18n: 'shortcutMute' },
          { key: 'f', i18n: 'shortcutFullscreen' },
          { key: 'c', i18n: 'shortcutCaptions' },
          { key: 'l', i18n: 'shortcutLoop' },
          { key: 'd', i18n: 'shortcutDarkMode' },
          { key: 's', i18n: 'shortcutScreenshot' },
          { key: ',', i18n: 'shortcutStepBack' },
          { key: '.', i18n: 'shortcutStepForward' },
        ];

        shortcuts.forEach(({ key, i18n: i18nKey }) => {
          const shortcutItem = createElement('div', {
            class: 'plyr__shortcuts-item',
            role: 'menuitem',
          });

          const keyElement = createElement('kbd', { class: 'plyr__shortcuts-key' }, key);
          const descElement = createElement('span', { class: 'plyr__shortcuts-desc' }, i18n.get(i18nKey, this.player.config));

          shortcutItem.appendChild(keyElement);
          shortcutItem.appendChild(descElement);
          shortcutsList.appendChild(shortcutItem);
        });

        shortcutsPane.appendChild(shortcutsList);
        inner.appendChild(shortcutsPane);

        this.player.elements.settings.panels.shortcuts = shortcutsPane;

        popup.appendChild(inner);
        wrapper.appendChild(popup);
        container.appendChild(wrapper);

        this.player.elements.settings.popup = popup;
        this.player.elements.settings.menu = wrapper;
      }

      // Picture in picture button
      if (control === 'pip' && support.pip) {
        container.appendChild(this.createButton('pip', defaultAttributes));
      }

      // Airplay button
      if (control === 'airplay' && support.airplay) {
        container.appendChild(this.createButton('airplay', defaultAttributes));
      }

      // Download button
      if (control === 'download') {
        const attributes = extend({}, defaultAttributes, {
          element: 'a',
          href: this.player.download,
          target: '_blank',
        });

        // Set download attribute for HTML5 only
        if (this.player.isHTML5) {
          attributes.download = '';
        }

        const { download } = this.player.config.urls;

        if (!is.url(download) && this.player.isEmbed) {
          extend(attributes, {
            icon: `logo-${this.player.provider}`,
            label: this.player.provider,
          });
        }

        container.appendChild(this.createButton('download', attributes));
      }

      // Toggle fullscreen button
      if (control === 'fullscreen') {
        container.appendChild(this.createButton('fullscreen', defaultAttributes));
      }
    });

    // Set available quality levels
    if (this.player.isHTML5) {
      this.setQualityMenu(html5.getQualityOptions.call(this.player));
    }

    this.setSpeedMenu();
    this.setTranslationMenu();
    this.setTranscriptionMenu();
    this.setLoopMenu();

    return container;
  }

  // Insert controls
  inject() {
    // Sprite
    if (this.player.config.loadSprite) {
      const icon = this.getIconUrl();

      // Only load external sprite using AJAX
      if (icon.cors) {
        loadSprite(icon.url, 'sprite-plyr');
      }
    }

    // Create a unique ID using incrementing counter to avoid collisions
    Controls.idCounter++;
    this.player.id = Controls.idCounter;

    // Null by default
    let container = null;
    this.player.elements.controls = null;

    // Set template properties
    const props = {
      id: this.player.id,
      seektime: this.player.config.seekTime,
      title: this.player.config.title,
    };
    let update = true;

    // If function, run it and use output
    if (is.function(this.player.config.controls)) {
      this.player.config.controls = this.player.config.controls.call(this.player, props);
    }

    // Convert falsy controls to empty array (primarily for empty strings)
    if (!this.player.config.controls) {
      this.player.config.controls = [];
    }

    if (is.element(this.player.config.controls) || is.string(this.player.config.controls)) {
      // HTMLElement or Non-empty string passed as the option
      container = this.player.config.controls;
    }
    else {
      // Create controls
      container = this.create({
        id: this.player.id,
        seektime: this.player.config.seekTime,
        speed: this.player.speed,
        quality: this.player.quality,
        captions: this.player.captions.getLabel(),
      });
      update = false;
    }

    // Replace props with their value
    const replace = (input) => {
      let result = input;

      Object.entries(props).forEach(([key, value]) => {
        result = replaceAll(result, `{${key}}`, value);
      });

      return result;
    };

    // Update markup
    if (update) {
      if (is.string(this.player.config.controls)) {
        container = replace(container);
      }
    }

    // Controls container
    let target;

    // Inject to custom location
    if (is.string(this.player.config.selectors.controls.container)) {
      target = document.querySelector(this.player.config.selectors.controls.container);
    }

    // Inject into the container by default
    if (!is.element(target)) {
      target = this.player.elements.container;
    }

    // Inject controls HTML (needs to be before captions, hence "afterbegin")
    const insertMethod = is.element(container) ? 'insertAdjacentElement' : 'insertAdjacentHTML';
    target[insertMethod]('afterbegin', container);

    // Find the elements if need be
    if (!is.element(this.player.elements.controls)) {
      this.findElements();
    }

    // Add pressed property to buttons
    if (!is.empty(this.player.elements.buttons)) {
      const addProperty = (button) => {
        const className = this.player.config.classNames.controlPressed;
        button.setAttribute('aria-pressed', 'false');

        Object.defineProperty(button, 'pressed', {
          configurable: true,
          enumerable: true,
          get() {
            return hasClass(button, className);
          },
          set(pressed = false) {
            toggleClass(button, className, pressed);
            button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
          },
        });
      };

      // Toggle classname when pressed property is set
      Object.values(this.player.elements.buttons)
        .filter(Boolean)
        .forEach((button) => {
          if (is.array(button) || is.nodeList(button)) {
            Array.from(button).filter(Boolean).forEach(addProperty);
          }
          else {
            addProperty(button);
          }
        });
    }

    // Setup tooltips
    if (this.player.config.tooltips.controls) {
      const { classNames, selectors } = this.player.config;

      // Map button data-plyr types to tooltip i18n keys
      const tooltipKeyMap = {
        'play': 'tooltipPlay',
        'restart': 'tooltipRewind',
        'rewind': 'tooltipRewind',
        'fast-forward': 'tooltipForward',
        'mute': 'tooltipMute',
        'captions': 'tooltipCaptions',
        'settings': 'tooltipSettings',
        'pip': 'tooltipPiP',
        'airplay': 'tooltipAirPlay',
        'fullscreen': 'tooltipFullscreen',
        'download': 'download',
        'volume': 'tooltipVolume',
      };

      // Find all control buttons by their data-plyr attribute
      const controlButtons = document.querySelectorAll('[data-plyr]');
      Array.from(controlButtons).forEach((button) => {
        const plyrType = button.getAttribute('data-plyr');
        const tooltipKey = tooltipKeyMap[plyrType];
        if (!tooltipKey) return;

        const label = button.querySelector('span[class*="label"]');
        if (!label) return;

        const tooltipText = i18n.get(tooltipKey, this.player.config);
        if (tooltipText && tooltipText.length) {
          label.textContent = tooltipText;
          toggleClass(label, classNames.hidden, false);
          toggleClass(label, classNames.tooltip, true);
        }
      });

      // Also handle seek tooltip
      const seekTooltip = this.player.elements.display?.seekTooltip;
      if (seekTooltip) {
        seekTooltip.textContent = i18n.get('tooltipSeek', this.player.config);
        toggleClass(seekTooltip, classNames.hidden, false);
        toggleClass(seekTooltip, classNames.tooltip, true);
      }
    }
  }
}

export default Controls;
