import { describe, expect, it } from 'vitest';
import { parseId } from '../../src/js/plugins/mts-link';

describe('mts-link Provider', () => {
  describe('parseId', () => {
    it('should extract video ID from player.mts-link.ru/player URL', () => {
      expect(parseId('https://player.mts-link.ru/player/abc123')).toBe('abc123');
    });

    it('should extract video ID from mts-link.ru/video URL', () => {
      expect(parseId('https://mts-link.ru/video/abc123')).toBe('abc123');
    });

    it('should extract video ID from mts-link.ru/recordings URL', () => {
      expect(parseId('https://mts-link.ru/recordings/abc123')).toBe('abc123');
    });

    it('should extract video ID from mts-link.ru/webinar URL', () => {
      expect(parseId('https://mts-link.ru/webinar/abc123')).toBe('abc123');
    });

    it('should extract video ID from mts.ru/video URL', () => {
      expect(parseId('https://mts.ru/video/abc123')).toBe('abc123');
    });

    it('should extract video ID from player.mts.ru/video URL', () => {
      expect(parseId('https://player.mts.ru/video/abc123')).toBe('abc123');
    });

    it('should extract video ID from player.mts.ru/recording URL', () => {
      expect(parseId('https://player.mts.ru/recording/abc123')).toBe('abc123');
    });

    it('should extract video ID from player.mts.ru/recordings URL', () => {
      expect(parseId('https://player.mts.ru/recordings/abc123')).toBe('abc123');
    });

    it('should extract video ID from player.mts.ru/player/video URL', () => {
      expect(parseId('https://player.mts.ru/player/video/abc123')).toBe('abc123');
    });

    it('should return null for empty URL', () => {
      expect(parseId('')).toBeNull();
      expect(parseId(null)).toBeNull();
      expect(parseId(undefined)).toBeNull();
    });

    it('should return null for non-MTS URL', () => {
      expect(parseId('https://example.com/video')).toBeNull();
    });

    it('should return null for plain ID without URL context', () => {
      expect(parseId('abc123')).toBeNull();
    });

    it('should return null for invalid URL format', () => {
      expect(parseId('https://player.mts-link.ru/')).toBeNull();
    });

    it('should handle UUID-style video IDs', () => {
      expect(parseId('https://player.mts-link.ru/player/550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should handle video IDs with hyphens', () => {
      expect(parseId('https://mts-link.ru/video/video-name-with-hyphens')).toBe('video-name-with-hyphens');
    });
  });
});
