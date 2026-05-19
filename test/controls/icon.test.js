import { describe, expect, it } from 'vitest';
import Icon from '../../src/js/controls/icon';

function createMockPlayer(config = {}) {
  return {
    config: {
      iconUrl: '/path/to/sprite.svg',
      iconPrefix: 'plyr',
      ...config,
    },
  };
}

describe('Icon', () => {
  describe('createIcon', () => {
    it('should create an SVG element', () => {
      const player = createMockPlayer();
      const icon = new Icon(player);
      const svg = icon.createIcon('play');
      expect(svg.tagName).toBe('svg');
      expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });

    it('should set aria-hidden attribute', () => {
      const player = createMockPlayer();
      const icon = new Icon(player);
      const svg = icon.createIcon('play');
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });

    it('should set focusable attribute', () => {
      const player = createMockPlayer();
      const icon = new Icon(player);
      const svg = icon.createIcon('play');
      expect(svg.getAttribute('focusable')).toBe('false');
    });

    it('should create a use element inside svg', () => {
      const player = createMockPlayer();
      const icon = new Icon(player);
      const svg = icon.createIcon('play');
      const use = svg.querySelector('use');
      expect(use).not.toBeNull();
      expect(use.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });

    it('should set href on use element', () => {
      const player = createMockPlayer();
      const icon = new Icon(player);
      const svg = icon.createIcon('play');
      const use = svg.querySelector('use');
      const href = use.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      expect(href).toContain('/path/to/sprite.svg#plyr-play');
    });

    it('should merge custom attributes', () => {
      const player = createMockPlayer();
      const icon = new Icon(player);
      const svg = icon.createIcon('play', { class: 'custom-class', 'data-test': 'value' });
      expect(svg.getAttribute('class')).toBe('custom-class');
      expect(svg.getAttribute('data-test')).toBe('value');
    });

    it('should handle CORS-disabled icon URL with same host', () => {
      const player = createMockPlayer({ iconUrl: '/sprite.svg' });
      const icon = new Icon(player);
      const svg = icon.createIcon('pause');
      const use = svg.querySelector('use');
      const href = use.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      expect(href).toBe('/sprite.svg#plyr-pause');
    });
  });
});
