// ==========================================================================
// Plyr controls: Settings menu management
// ==========================================================================

import captions from '../captions';
import support from '../support';
import { transitionEndEvent } from '../utils/animation';
import { removeElement, setFocus, toggleClass, toggleHidden } from '../utils/elements';
import { off, on } from '../utils/events';
import i18n from '../utils/i18n';
import is from '../utils/is';
import { toTitleCase } from '../utils/strings';

class SettingsMenu {
  constructor(player) {
    this.player = player;
  }

  // Hide/show a tab
  toggleMenuButton(setting, toggle) {
    toggleHidden(this.player.elements.settings.buttons[setting], !toggle);
  }

  // Update the selected setting
  updateSetting(setting, container, input) {
    const pane = this.player.elements.settings.panels[setting];
    let value = null;
    let list = container;

    if (setting === 'captions') {
      value = this.player.currentTrack;
    }
    else {
      value = !is.empty(input) ? input : this.player[setting];

      // Get default
      if (is.empty(value)) {
        value = this.player.config[setting].default;
      }

      // Unsupported value
      if (!is.empty(this.player.options[setting]) && !this.player.options[setting].includes(value)) {
        this.player.debug.warn(`Unsupported value of '${value}' for ${setting}`);
        return;
      }

      // Disabled value
      if (!this.player.config[setting].options.includes(value)) {
        this.player.debug.warn(`Disabled value of '${value}' for ${setting}`);
        return;
      }
    }

    // Get the list if we need to
    if (!is.element(list)) {
      list = pane && pane.querySelector('[role="menu"]');
    }

    // If there's no list it means it's not been rendered...
    if (!is.element(list)) {
      return;
    }

    // Update the label
    const button = this.player.elements.settings.buttons[setting];
    if (!is.element(button)) {
      return;
    }

    const label = button.querySelector(`.${this.player.config.classNames.menu.value}`);
    if (!is.element(label)) {
      return;
    }

    label.innerHTML = this.getLabel(setting, value);

    // Find the radio option and check it
    const target = list && list.querySelector(`[value="${value}"]`);

    if (is.element(target)) {
      target.checked = true;
    }
  }

  // Translate a value into a nice label
  getLabel(setting, value) {
    switch (setting) {
      case 'speed':
        return value === 1 ? i18n.get('normal', this.player.config) : `${value}&times;`;

      case 'quality':
        if (is.number(value)) {
          const label = i18n.get(`qualityLabel.${value}`, this.player.config);

          if (!label.length) {
            return `${value}p`;
          }

          return label;
        }

        return toTitleCase(value);

      case 'captions':
        return captions.getLabel.call(this.player);

      case 'translation':
        return this.player.captions.translation.active ? i18n.get('translateEnabled', this.player.config) : i18n.get('translateDisabled', this.player.config);

      case 'transcription':
        return this.player.transcription.active ? i18n.get('transcriptionEnabled', this.player.config) : i18n.get('transcriptionDisabled', this.player.config);

      default:
        return null;
    }
  }

  // Check if we need to hide/show the settings menu
  checkMenu() {
    const { buttons } = this.player.elements.settings;
    const visible = !is.empty(buttons) && Object.values(buttons).some(button => !button.hidden);

    toggleHidden(this.player.elements.settings.menu, !visible);
  }

  // Focus the first menu item in a given (or visible) menu
  focusFirstMenuItem(pane, focusVisible = false) {
    if (this.player.elements.settings.popup.hidden) {
      return;
    }

    let target = pane;

    if (!is.element(target)) {
      target = Object.values(this.player.elements.settings.panels).find(p => !p.hidden);
    }

    const firstItem = target.querySelector('[role^="menuitem"]');

    setFocus.call(this.player, firstItem, focusVisible);
  }

  // Show/hide menu
  toggleMenu(input) {
    const { popup } = this.player.elements.settings;
    const button = this.player.elements.buttons.settings;

    // Menu and button are required
    if (!is.element(popup) || !is.element(button)) {
      return;
    }

    // True toggle by default
    const { hidden } = popup;
    let show = hidden;

    if (is.boolean(input)) {
      show = input;
    }
    else if (is.keyboardEvent(input) && input.key === 'Escape') {
      show = false;
    }
    else if (is.event(input)) {
      // If Plyr is in a shadowDOM, the event target is set to the component, instead of the
      // Element in the shadowDOM. The path, if available, is complete.
      const target = is.function(input.composedPath) ? input.composedPath()[0] : input.target;
      const isMenuItem = popup.contains(target);

      // If the click was inside the menu or if the click
      // wasn't the button or menu item and we're trying to
      // show the menu (a doc click shouldn't show the menu)
      if (isMenuItem || (!isMenuItem && input.target !== button && show)) {
        return;
      }
    }

    // Set button attributes
    button.setAttribute('aria-expanded', show);

    // Show the actual popup
    toggleHidden(popup, !show);

    // Add class hook
    toggleClass(this.player.elements.container, this.player.config.classNames.menu.open, show);

    // Focus the first item if key interaction
    if (show && is.keyboardEvent(input)) {
      this.focusFirstMenuItem(null, true);
    }
    else if (!show && !hidden) {
      // If closing, re-focus the button
      setFocus.call(this.player, button, is.keyboardEvent(input));
    }
  }

  // Get the natural size of a menu panel
  getMenuSize(tab) {
    const clone = tab.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.opacity = 0;
    clone.removeAttribute('hidden');

    // Append to parent so we get the "real" size
    tab.parentNode.appendChild(clone);

    // Get the sizes before we remove
    const width = clone.scrollWidth;
    const height = clone.scrollHeight;

    // Remove from the DOM
    removeElement(clone);

    return {
      width,
      height,
    };
  }

  // Show a panel in the menu
  showMenuPanel(type = '', focusVisible = false) {
    const target = this.player.elements.container.querySelector(`#plyr-settings-${this.player.id}-${type}`);

    // Nothing to show, bail
    if (!is.element(target)) {
      return;
    }

    // Hide all other panels
    const container = target.parentNode;
    const current = Array.from(container.children).find(node => !node.hidden);

    // If we can do fancy animations, we'll animate the height/width
    if (support.transitions && !support.reducedMotion) {
      // Set the current width as a base
      container.style.width = `${current.scrollWidth}px`;
      container.style.height = `${current.scrollHeight}px`;

      // Get potential sizes
      const size = this.getMenuSize(target);

      // Restore auto height/width
      const restore = (event) => {
        // We're only bothered about height and width on the container
        if (event.target !== container || !['width', 'height'].includes(event.propertyName)) {
          return;
        }

        // Revert back to auto
        container.style.width = '';
        container.style.height = '';

        // Only listen once
        off.call(this.player, container, transitionEndEvent, restore);
      };

      // Listen for the transition finishing and restore auto height/width
      on.call(this.player, container, transitionEndEvent, restore);

      // Set dimensions to target
      container.style.width = `${size.width}px`;
      container.style.height = `${size.height}px`;
    }

    // Set attributes on current tab
    toggleHidden(current, true);

    // Set attributes on target
    toggleHidden(target, false);

    // Focus the first item
    this.focusFirstMenuItem(target, focusVisible);
  }
}

export default SettingsMenu;
