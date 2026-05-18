import { describe, expect, it } from 'vitest';
import { parseId } from '../../src/js/plugins/yandex-video';

describe('yandex Provider', () => {
  describe('parseId', () => {
    it('should extract video ID from standard player URL', () => {
      expect(parseId('https://video.cloud.yandex.net/player/7c10a15d-1e87-4d6e-a0e7-8f0f5e5c5e5d')).toBe('7c10a15d-1e87-4d6e-a0e7-8f0f5e5c5e5d');
    });

    it('should extract video ID from cloud.yandex.ru video URL', () => {
      expect(parseId('https://cloud.yandex.ru/video/7c10a15d-1e87-4d6e-a0e7-8f0f5e5c5e5d')).toBe('7c10a15d-1e87-4d6e-a0e7-8f0f5e5c5e5d');
    });

    it('should extract video ID from cloud.yandex.ru with path prefix', () => {
      expect(parseId('https://cloud.yandex.ru/services/video/7c10a15d-1e87-4d6e-a0e7-8f0f5e5c5e5d')).toBe('7c10a15d-1e87-4d6e-a0e7-8f0f5e5c5e5d');
    });

    it('should return null for empty URL', () => {
      expect(parseId('')).toBeNull();
      expect(parseId(null)).toBeNull();
      expect(parseId(undefined)).toBeNull();
    });

    it('should return null for non-Yandex URL', () => {
      expect(parseId('https://example.com/video')).toBeNull();
    });

    it('should return null for Yandex URL without video path', () => {
      expect(parseId('https://cloud.yandex.ru/')).toBeNull();
    });

    it('should return null for Yandex URL with invalid video ID format', () => {
      expect(parseId('https://video.cloud.yandex.net/player/invalid-id-format')).toBeNull();
    });

    it('should handle trailing slash in URL', () => {
      expect(parseId('https://video.cloud.yandex.net/player/7c10a15d-1e87-4d6e-a0e7-8f0f5e5c5e5d/')).toBe('7c10a15d-1e87-4d6e-a0e7-8f0f5e5c5e5d');
    });
  });
});
