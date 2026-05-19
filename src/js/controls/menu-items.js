// ==========================================================================
// Plyr controls: Menu item creation and keyboard shortcuts
// ==========================================================================

import { createElement, getAttributesFromSelector, matches, setFocus } from '../utils/elements';
import { on } from '../utils/events';
import i18n from '../utils/i18n';
import is from '../utils/is';
import { extend } from '../utils/objects';
import SettingsMenu from './settings-menu';

class MenuItems {
  constructor(player) {
    this.player = player;
    this.settingsMenu = new SettingsMenu(player);
  }

  // Bind keyboard shortcuts for a menu item
  // We have to bind to keyup otherwise Firefox triggers a click when a keydown event handler shifts focus
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1220143
  bindMenuItemShortcuts(menuItem, type) {
    // Navigate through menus via arrow keys and space
    on.call(
      this.player,
      menuItem,
      'keydown keyup',
      (event) => {
        // We only care about space and ⬆️ ⬇️️ ➡️
        if (![' ', 'ArrowUp', 'ArrowDown', 'ArrowRight'].includes(event.key)) {
          return;
        }

        // Prevent play / seek
        event.preventDefault();
        event.stopPropagation();

        // We're just here to prevent the keydown bubbling
        if (event.type === 'keydown') {
          return;
        }

        const isRadioButton = matches(menuItem, '[role="menuitemradio"]');

        // Show the respective menu
        if (!isRadioButton && [' ', 'ArrowRight'].includes(event.key)) {
          this.settingsMenu.showMenuPanel(type, true);
        }
        else {
          let target;

          if (event.key !== ' ') {
            if (event.key === 'ArrowDown' || (isRadioButton && event.key === 'ArrowRight')) {
              target = menuItem.nextElementSibling;

              if (!is.element(target)) {
                target = menuItem.parentNode.firstElementChild;
              }
            }
            else {
              target = menuItem.previousElementSibling;

              if (!is.element(target)) {
                target = menuItem.parentNode.lastElementChild;
              }
            }

            setFocus.call(this.player, target, true);
          }
        }
      },
      false,
    );

    // Enter will fire a `click` event but we still need to manage focus
    // So we bind to keyup which fires after and set focus here
    on.call(this.player, menuItem, 'keyup', (event) => {
      if (event.key !== 'Return') return;

      this.settingsMenu.focusFirstMenuItem(null, true);
    });
  }

  // Create a settings menu item
  createMenuItem({ value, list, type, title, badge = null, checked = false }) {
    const attributes = getAttributesFromSelector(this.player.config.selectors.inputs[type]);

    const menuItem = createElement(
      'button',
      extend(attributes, {
        'type': 'button',
        'role': 'menuitemradio',
        'class': `${this.player.config.classNames.control} ${attributes.class ? attributes.class : ''}`.trim(),
        'aria-checked': checked,
        value,
      }),
    );

    const flex = createElement('span');

    // Use textContent for XSS safety - title comes from i18n which returns plain text
    flex.textContent = title;

    if (is.element(badge)) {
      flex.appendChild(badge);
    }

    menuItem.appendChild(flex);

    // Add educational description for quality and speed options
    if (type === 'quality' && is.number(value)) {
      const desc = i18n.get(`qualityDescriptions.${value}`, this.player.config);
      if (desc) {
        menuItem.setAttribute('title', desc);
        menuItem.appendChild(
          createElement('span', {
            class: this.player.config.classNames.hidden,
          }, desc),
        );
      }
    }
    else if (type === 'speed') {
      const speedValue = Number.parseFloat(value);
      const desc = i18n.get(`speedDescriptions.${speedValue}`, this.player.config);
      if (desc) {
        menuItem.setAttribute('title', desc);
        menuItem.appendChild(
          createElement('span', {
            class: this.player.config.classNames.hidden,
          }, desc),
        );
      }
    }

    // Replicate radio button behavior
    Object.defineProperty(menuItem, 'checked', {
      enumerable: true,
      get() {
        return menuItem.getAttribute('aria-checked') === 'true';
      },
      set(check) {
        // Ensure exclusivity
        if (check) {
          Array.from(menuItem.parentNode.children)
            .filter(node => matches(node, '[role="menuitemradio"]'))
            .forEach(node => node.setAttribute('aria-checked', 'false'));
        }

        menuItem.setAttribute('aria-checked', check ? 'true' : 'false');
      },
    });

    this.player.listeners.bind(
      menuItem,
      'click keyup',
      (event) => {
        if (is.keyboardEvent(event) && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        menuItem.checked = true;

        switch (type) {
          case 'language':
            this.player.currentTrack = Number(value);
            break;

          case 'quality':
            this.player.quality = value;
            break;

          case 'speed':
            this.player.speed = Number.parseFloat(value);
            break;

          case 'loop':
            if (value === false || value === 'false') {
              this.player.loop = false;
            }
            else if (value === true || value === 'true') {
              this.player.loop = true;
            }
            else {
              // Handle 'start', 'end', 'all'
              this.player.loop = value;
            }
            break;

          case 'translation':
            if (value === 'off') {
              this.player.captions.translation.active = false;
            }
            else {
              this.player.captions.translation.active = true;
              this.player.captions.translation.language = value;
            }
            break;

          case 'transcription':
            if (value === 'off') {
              this.player.transcription.active = false;
            }
            else {
              this.player.transcription.active = true;
              this.player.transcription.language = value;
            }
            break;

          default:
            break;
        }

        this.settingsMenu.showMenuPanel('home', is.keyboardEvent(event));
      },
      type,
      false,
    );

    this.bindMenuItemShortcuts(menuItem, type);

    list.appendChild(menuItem);
  }
}

export default MenuItems;
