// ==========================================================================
// Plyr controls: Element creators
// ==========================================================================

import RangeTouch from 'rangetouch';

import browser from '../utils/browser';
import { createElement, getAttributesFromSelector, setAttributes } from '../utils/elements';
import i18n from '../utils/i18n';
import is from '../utils/is';
import { extend } from '../utils/objects';
import { toCamelCase } from '../utils/strings';
import { formatTime } from '../utils/time';
import Icon from './icon';

class ElementCreators {
  constructor(player) {
    this.player = player;
    this.icon = new Icon(player);
  }

  // Create hidden text label
  createLabel(key, attr = {}) {
    const text = i18n.get(key, this.player.config);
    const attributes = { ...attr, class: [attr.class, this.player.config.classNames.hidden].filter(Boolean).join(' ') };

    return createElement('span', attributes, text);
  }

  // Create a badge
  createBadge(text) {
    if (is.empty(text)) {
      return null;
    }

    const badge = createElement('span', {
      class: this.player.config.classNames.menu.value,
    });

    badge.appendChild(
      createElement(
        'span',
        {
          class: this.player.config.classNames.menu.badge,
        },
        text,
      ),
    );

    return badge;
  }

  // Create a <button>
  createButton(buttonType, attr) {
    const attributes = extend({}, attr);
    let type = toCamelCase(buttonType);

    const props = {
      element: 'button',
      toggle: false,
      label: null,
      icon: null,
      labelPressed: null,
      iconPressed: null,
    };

    ['element', 'icon', 'label'].forEach((key) => {
      if (Object.keys(attributes).includes(key)) {
        props[key] = attributes[key];
        delete attributes[key];
      }
    });

    // Default to 'button' type to prevent form submission
    if (props.element === 'button' && !Object.keys(attributes).includes('type')) {
      attributes.type = 'button';
    }

    // Set class name
    if (Object.keys(attributes).includes('class')) {
      if (!attributes.class.split(' ').includes(this.player.config.classNames.control)) {
        extend(attributes, {
          class: `${attributes.class} ${this.player.config.classNames.control}`,
        });
      }
    }
    else {
      attributes.class = this.player.config.classNames.control;
    }

    // Large play button
    switch (buttonType) {
      case 'play':
        props.toggle = true;
        props.label = 'play';
        props.labelPressed = 'pause';
        props.icon = 'play';
        props.iconPressed = 'pause';
        break;

      case 'mute':
        props.toggle = true;
        props.label = 'mute';
        props.labelPressed = 'unmute';
        props.icon = 'volume';
        props.iconPressed = 'muted';
        break;

      case 'captions':
        props.toggle = true;
        props.label = 'enableCaptions';
        props.labelPressed = 'disableCaptions';
        props.icon = 'captions-off';
        props.iconPressed = 'captions-on';
        break;

      case 'fullscreen':
        props.toggle = true;
        props.label = 'enterFullscreen';
        props.labelPressed = 'exitFullscreen';
        props.icon = 'enter-fullscreen';
        props.iconPressed = 'exit-fullscreen';
        break;

      case 'play-large':
        attributes.class += ` ${this.player.config.classNames.control}--overlaid`;
        type = 'play';
        props.label = 'play';
        props.icon = 'play';
        break;

      default:
        if (is.empty(props.label)) {
          props.label = type;
        }
        if (is.empty(props.icon)) {
          props.icon = buttonType;
        }
    }

    const button = createElement(props.element);

    // Setup toggle icon and labels
    if (props.toggle) {
      // Icon
      button.appendChild(
        this.icon.createIcon(props.iconPressed, {
          class: 'icon--pressed',
        }),
      );
      button.appendChild(
        this.icon.createIcon(props.icon, {
          class: 'icon--not-pressed',
        }),
      );

      // Label/Tooltip
      button.appendChild(
        this.createLabel(props.labelPressed, {
          class: 'label--pressed',
        }),
      );
      button.appendChild(
        this.createLabel(props.label, {
          class: 'label--not-pressed',
        }),
      );
    }
    else {
      button.appendChild(this.icon.createIcon(props.icon));
      button.appendChild(this.createLabel(props.label));
    }

    // Merge and set attributes
    extend(attributes, getAttributesFromSelector(this.player.config.selectors.buttons[type], attributes));
    setAttributes(button, attributes);

    // We have multiple play buttons
    if (type === 'play') {
      if (!is.array(this.player.elements.buttons[type])) {
        this.player.elements.buttons[type] = [];
      }

      this.player.elements.buttons[type].push(button);
    }
    else {
      this.player.elements.buttons[type] = button;
    }

    return button;
  }

  // Create an <input type='range'>
  createRange(type, attributes) {
    // Seek input
    const input = createElement(
      'input',
      extend(
        getAttributesFromSelector(this.player.config.selectors.inputs[type]),
        {
          'type': 'range',
          'min': 0,
          'max': 100,
          'step': 0.01,
          'value': 0,
          'autocomplete': 'off',
          // A11y fixes for https://github.com/QuadDarv1ne/plyr-video/issues/905
          'role': 'slider',
          'aria-label': i18n.get(type, this.player.config),
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': 0,
        },
        attributes,
      ),
    );

    this.player.elements.inputs[type] = input;

    // Set the fill for webkit now
    this.updateRangeFill(input);

    // Improve support on touch devices
    RangeTouch.setup(input);

    return input;
  }

  // Create a <progress>
  createProgress(type, attributes) {
    const progress = createElement(
      'progress',
      extend(
        getAttributesFromSelector(this.player.config.selectors.display[type]),
        {
          'min': 0,
          'max': 100,
          'value': 0,
          'role': 'progressbar',
          'aria-hidden': true,
        },
        attributes,
      ),
    );

    // Create the label inside: <span>0</span>% played
    if (type !== 'volume') {
      const span = createElement('span', null, '0');
      progress.appendChild(span);

      const suffixKey = {
        played: 'played',
        buffer: 'buffered',
      }[type];
      const suffix = suffixKey ? i18n.get(suffixKey, this.player.config) : '';

      progress.appendChild(document.createTextNode(`% ${suffix.toLowerCase()}`));
    }

    this.player.elements.display[type] = progress;

    return progress;
  }

  // Create time display
  createTime(type, attrs) {
    const attributes = getAttributesFromSelector(this.player.config.selectors.display[type], attrs);

    const container = createElement(
      'div',
      extend(attributes, {
        'class': `${attributes.class ? attributes.class : ''} ${this.player.config.classNames.display.time} `.trim(),
        'aria-label': i18n.get(type, this.player.config),
        'role': 'timer',
      }),
      '00:00',
    );

    // Reference for updates
    this.player.elements.display[type] = container;

    return container;
  }

  // Webkit polyfill for lower fill range
  updateRangeFill(target) {
    // Get range from event if event passed
    const range = is.event(target) ? target.target : target;

    // Needs to be a valid <input type='range'>
    if (!is.element(range) || range.getAttribute('type') !== 'range') {
      return;
    }

    // Set aria values for https://github.com/QuadDarv1ne/plyr-video/issues/905
    if (range.matches(this.player.config.selectors.inputs.seek)) {
      range.setAttribute('aria-valuenow', this.player.currentTime);
      const currentTime = formatTime(this.player.currentTime);
      const duration = formatTime(this.player.duration);
      const format = i18n.get('seekLabel', this.player.config);
      range.setAttribute(
        'aria-valuetext',
        format.replace('{currentTime}', currentTime).replace('{duration}', duration),
      );
    }
    else if (range.matches(this.player.config.selectors.inputs.volume)) {
      const percent = range.value * 100;
      range.setAttribute('aria-valuenow', percent);
      range.setAttribute('aria-valuetext', `${percent.toFixed(1)}%`);
    }
    else {
      range.setAttribute('aria-valuenow', range.value);
    }

    // WebKit only
    if (!browser.isWebKit && !browser.isIPadOS) {
      return;
    }

    // Set CSS custom property
    range.style.setProperty('--value', `${(range.value / range.max) * 100}%`);
  }
}

export default ElementCreators;
