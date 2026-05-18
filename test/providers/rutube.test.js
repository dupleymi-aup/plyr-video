import { describe, expect, it } from 'vitest';
import { parseId, parsePlaylistId } from '../../src/js/plugins/rutube';

describe('rutube Provider', () => {
  describe('parseId', () => {
    it('should extract video ID from standard video URL', () => {
      expect(parseId('https://rutube.ru/video/91d051245c0cf5703957fe07f7b11b98/')).toBe('91d051245c0cf5703957fe07f7b11b98');
    });

    it('should extract video ID from embed URL', () => {
      expect(parseId('https://rutube.ru/play/embed/91d051245c0cf5703957fe07f7b11b98')).toBe('91d051245c0cf5703957fe07f7b11b98');
    });

    it('should extract video ID from embed URL with trailing slash', () => {
      expect(parseId('https://rutube.ru/play/embed/91d051245c0cf5703957fe07f7b11b98/')).toBe('91d051245c0cf5703957fe07f7b11b98');
    });

    it('should extract video ID from short rutube.ru/embed URL', () => {
      expect(parseId('https://rutube.ru/embed/91d051245c0cf5703957fe07f7b11b98')).toBe('91d051245c0cf5703957fe07f7b11b98');
    });

    it('should extract video ID from channel URL', () => {
      expect(parseId('https://rutube.ru/channel/12345/video/91d051245c0cf5703957fe07f7b11b98/')).toBe('91d051245c0cf5703957fe07f7b11b98');
    });

    it('should extract video ID from short link', () => {
      expect(parseId('https://rutube.ru/r/91d051245c0cf5703957fe07f7b11b98/')).toBe('91d051245c0cf5703957fe07f7b11b98');
    });

    it('should extract video ID from play.rutube.ru embed URL', () => {
      expect(parseId('https://play.rutube.ru/embed/91d051245c0cf5703957fe07f7b11b98')).toBe('91d051245c0cf5703957fe07f7b11b98');
    });

    it('should extract video ID from play.rutube.ru video URL', () => {
      expect(parseId('https://play.rutube.ru/video/91d051245c0cf5703957fe07f7b11b98')).toBe('91d051245c0cf5703957fe07f7b11b98');
    });

    it('should return null for empty URL', () => {
      expect(parseId('')).toBeNull();
      expect(parseId(null)).toBeNull();
      expect(parseId(undefined)).toBeNull();
    });

    it('should return the input if it looks like an ID', () => {
      expect(parseId('91d051245c0cf5703957fe07f7b11b98')).toBe('91d051245c0cf5703957fe07f7b11b98');
    });

    it('should return non-matching URL as fallback', () => {
      expect(parseId('https://example.com/video')).toBe('https://example.com/video');
    });

    it('should handle rutube.ru without www prefix', () => {
      expect(parseId('http://rutube.ru/video/91d051245c0cf5703957fe07f7b11b98')).toBe('91d051245c0cf5703957fe07f7b11b98');
    });
  });

  describe('parsePlaylistId', () => {
    it('should extract playlist ID from plst URL', () => {
      expect(parsePlaylistId('https://rutube.ru/plst/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4/')).toBe('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
    });

    it('should extract playlist ID from playlist query parameter', () => {
      expect(parsePlaylistId('https://rutube.ru/play/embed/91d051245c0cf5703957fe07f7b11b98?playlist=a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4')).toBe('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
    });

    it('should return null for empty URL', () => {
      expect(parsePlaylistId('')).toBeNull();
      expect(parsePlaylistId(null)).toBeNull();
      expect(parsePlaylistId(undefined)).toBeNull();
    });

    it('should return null for URL without playlist', () => {
      expect(parsePlaylistId('https://rutube.ru/video/91d051245c0cf5703957fe07f7b11b98/')).toBeNull();
    });

    it('should return null for URL with empty playlist', () => {
      expect(parsePlaylistId('https://rutube.ru/play/embed/id?playlist=')).toBeNull();
    });
  });
});
