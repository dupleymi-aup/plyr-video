// ==========================================================================
// Plyr controls: Icon operations
// ==========================================================================

import browser from '../utils/browser';
import { setAttributes } from '../utils/elements';
import { extend } from '../utils/objects';

class Icon {
  constructor(player) {
    this.player = player;
  }

  // Get icon URL
  getIconUrl() {
    const url = new URL(this.player.config.iconUrl, window.location);
    const host = window.location.host ? window.location.host : window.top.location.host;
    const cors = url.host !== host || (browser.isIE && !window.svg4everybody);

    return {
      url: this.player.config.iconUrl,
      cors,
    };
  }

  // Create <svg> icon
  createIcon(type, attributes) {
    const namespace = 'http://www.w3.org/2000/svg';
    const iconUrl = this.getIconUrl();
    const iconPath = `${!iconUrl.cors ? iconUrl.url : ''}#${this.player.config.iconPrefix}`;
    // Create <svg>
    const icon = document.createElementNS(namespace, 'svg');
    setAttributes(
      icon,
      extend(attributes, {
        'aria-hidden': 'true',
        'focusable': 'false',
      }),
    );

    // Create the <use> to reference sprite
    const use = document.createElementNS(namespace, 'use');
    const path = `${iconPath}-${type}`;

    // Set `href` attributes
    // https://github.com/QuadDarv1ne/plyr-video/issues/460
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/xlink:href
    if ('href' in use) {
      use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', path);
    }

    // Always set the older attribute even though it's "deprecated" (it'll be around for ages)
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', path);

    // Add <use> to <svg>
    icon.appendChild(use);

    return icon;
  }
}

export default Icon;
