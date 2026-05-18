import { describe, expect, it } from 'vitest';
import i18n from '../../src/js/utils/i18n';

describe('i18n utility', () => {
  describe('get', () => {
    it('should return empty string for empty key', () => {
      expect(i18n.get('', { i18n: {} })).toBe('');
      expect(i18n.get(null, { i18n: {} })).toBe('');
      expect(i18n.get(undefined, { i18n: {} })).toBe('');
    });

    it('should return empty string for empty config', () => {
      expect(i18n.get('play', null)).toBe('');
      expect(i18n.get('play', undefined)).toBe('');
      expect(i18n.get('play', {})).toBe('');
    });

    it('should return translation from config.i18n', () => {
      const config = { i18n: { play: 'Play' } };
      expect(i18n.get('play', config)).toBe('Play');
    });

    it('should return resource string for known brand/abbreviation keys', () => {
      const config = { i18n: {} };
      expect(i18n.get('pip', config)).toBe('PIP');
      expect(i18n.get('airplay', config)).toBe('AirPlay');
      expect(i18n.get('html5', config)).toBe('HTML5');
      expect(i18n.get('vimeo', config)).toBe('Vimeo');
      expect(i18n.get('youtube', config)).toBe('YouTube');
    });

    it('should return empty string for unknown key not in resources', () => {
      expect(i18n.get('nonexistent', { i18n: {} })).toBe('');
    });

    it('should replace {seektime} placeholder', () => {
      const config = { i18n: { rewind: 'Back {seektime}s' }, seekTime: 10 };
      expect(i18n.get('rewind', config)).toBe('Back 10s');
    });

    it('should replace {title} placeholder', () => {
      const config = { i18n: { frameTitle: 'Player for {title}' }, title: 'My Video' };
      expect(i18n.get('frameTitle', config)).toBe('Player for My Video');
    });

    it('should replace all placeholders simultaneously', () => {
      const config = {
        i18n: { seekLabel: '{currentTime} of {duration}' },
        seekTime: 30,
        title: 'Test',
      };
      expect(i18n.get('seekLabel', config)).toBe('{currentTime} of {duration}');
    });

    it('should use replacement values even when not strings', () => {
      const config = {
        i18n: { rewind: '-{seektime}s' },
        seekTime: 0,
      };
      expect(i18n.get('rewind', config)).toBe('-0s');
    });

    it('should prefer i18n translation over resources', () => {
      const config = { i18n: { pip: 'Picture in Picture' } };
      expect(i18n.get('pip', config)).toBe('Picture in Picture');
    });

    it('should handle deep nested keys via getDeep', () => {
      const config = { i18n: { qualityBadge: { '2160': '4K' } } };
      expect(i18n.get('qualityBadge.2160', config)).toBe('4K');
    });
  });
});
