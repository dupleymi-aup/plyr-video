import { describe, expect, it } from 'vitest';
import { parseId, parseVKMessage } from '../../src/js/plugins/vk-video';

describe('vk Provider', () => {
  describe('parseId', () => {
    it('should extract video ID from standard VK video URL', () => {
      expect(parseId('https://vk.com/video-40602947_456239058')).toBe('oid=-40602947&id=456239058');
    });

    it('should extract video ID from VK.ru URL', () => {
      expect(parseId('https://vk.ru/video-40602947_456239058')).toBe('oid=-40602947&id=456239058');
    });

    it('should extract video ID with oid/id query params', () => {
      expect(parseId('https://vk.com/video_ext.php?oid=-40602947&id=456239058')).toBe('oid=-40602947&id=456239058');
    });

    it('should extract video ID with oid/id/hash query params', () => {
      expect(parseId('https://vk.com/video_ext.php?oid=-40602947&id=456239058&hash=abc123')).toBe('oid=-40602947&id=456239058&hash=abc123');
    });

    it('should extract video ID from VK Clips format', () => {
      expect(parseId('https://vk.com/clip-40602947_456239058')).toBe('oid=-40602947&id=456239058&is_clip=1');
    });

    it('should extract video ID from z=video list format', () => {
      expect(parseId('https://vk.com/video?z=video-40602947_456239058')).toBe('oid=-40602947&id=456239058');
    });

    it('should return null for empty URL', () => {
      expect(parseId('')).toBeNull();
      expect(parseId(null)).toBeNull();
      expect(parseId(undefined)).toBeNull();
    });

    it('should return null for non-VK URL', () => {
      expect(parseId('https://example.com/video')).toBeNull();
    });

    it('should return null for invalid VK video URL without proper format', () => {
      expect(parseId('https://vk.com/page')).toBeNull();
    });
  });

  describe('parseVKMessage', () => {
    it('should parse object with event property', () => {
      const msg = parseVKMessage({ data: { event: 'started', currentTime: 10 } });
      expect(msg).toEqual({ type: 'started', data: { event: 'started', currentTime: 10 } });
    });

    it('should parse object with type property', () => {
      const msg = parseVKMessage({ data: { type: 'inited', quality: 3 } });
      expect(msg).toEqual({ type: 'inited', data: { type: 'inited', quality: 3 } });
    });

    it('should parse plain string events without prefix', () => {
      const msg = parseVKMessage({ data: 'started' });
      expect(msg).toEqual({ type: 'vk_video:started', data: {} });
    });

    it('should parse plain string events with prefix', () => {
      const msg = parseVKMessage({ data: 'vk_video:timeupdate' });
      expect(msg).toEqual({ type: 'vk_video:timeupdate', data: {} });
    });

    it('should parse paused and ended string events', () => {
      expect(parseVKMessage({ data: 'paused' })).toEqual({ type: 'vk_video:paused', data: {} });
      expect(parseVKMessage({ data: 'ended' })).toEqual({ type: 'vk_video:ended', data: {} });
    });

    it('should return null for non-object, non-string data', () => {
      expect(parseVKMessage({ data: 123 })).toBeNull();
    });

    it('should return null for object without event/type', () => {
      expect(parseVKMessage({ data: { foo: 'bar' } })).toBeNull();
    });

    it('should return null for empty data', () => {
      expect(parseVKMessage({ data: null })).toBeNull();
      expect(parseVKMessage({})).toBeNull();
    });

    it('should handle undefined event data gracefully', () => {
      expect(parseVKMessage({ data: undefined })).toBeNull();
    });
  });
});
