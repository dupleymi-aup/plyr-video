import { describe, expect, it } from 'vitest';
import { parseId, parseMailruMessage, getEmbedUrl } from '../../src/js/plugins/mailru-video';

describe('mailru Provider', () => {
  describe('parseId', () => {
    it('should extract video ID from embed URL', () => {
      expect(parseId('https://my.mail.ru/video/embed/6353406850491756603')).toBe('6353406850491756603');
    });

    it('should extract video ID from API URL', () => {
      expect(parseId('https://api.video.mail.ru/videos/embed/6353406850491756603')).toBe('6353406850491756603');
    });

    it('should extract video ID from old format URL', () => {
      expect(parseId('https://my.mail.ru/mail/user/_myvideo/123')).toBe('mail/user/_myvideo/123');
    });

    it('should extract video ID from mail user video URL', () => {
      expect(parseId('https://my.mail.ru/mail/user/video/abc123')).toBe('user/abc123');
    });

    it('should extract video ID from community video URL', () => {
      expect(parseId('https://my.mail.ru/community/group/video/abc123')).toBe('group/abc123');
    });

    it('should extract video ID from bk.ru video URL', () => {
      expect(parseId('https://my.mail.ru/bk/user/video/abc123')).toBe('user/abc123');
    });

    it('should extract video ID from list.ru video URL', () => {
      expect(parseId('https://my.mail.ru/list.ru/user/video/abc123')).toBe('user/abc123');
    });

    it('should return null for empty URL', () => {
      expect(parseId('')).toBeNull();
      expect(parseId(null)).toBeNull();
      expect(parseId(undefined)).toBeNull();
    });

    it('should return non-matching URL as fallback', () => {
      expect(parseId('https://example.com/video')).toBe('https://example.com/video');
    });
  });

  describe('getEmbedUrl', () => {
    it('should return my.mail.ru URL for simple video IDs', () => {
      expect(getEmbedUrl('6353406850491756603')).toBe('https://my.mail.ru/video/embed/6353406850491756603');
    });

    it('should return api.video.mail.ru URL for mail/ prefix IDs', () => {
      expect(getEmbedUrl('mail/user/_myvideo/123')).toBe('https://api.video.mail.ru/videos/embed/mail/user/_myvideo/123');
    });

    it('should return api.video.mail.ru URL for bk/ prefix IDs', () => {
      expect(getEmbedUrl('bk/user/video/abc123')).toBe('https://api.video.mail.ru/videos/embed/bk/user/video/abc123');
    });

    it('should return api.video.mail.ru URL for inbox/ prefix IDs', () => {
      expect(getEmbedUrl('inbox/user/video/abc123')).toBe('https://api.video.mail.ru/videos/embed/inbox/user/video/abc123');
    });

    it('should return api.video.mail.ru URL for list.ru/ prefix IDs', () => {
      expect(getEmbedUrl('list.ru/user/video/abc123')).toBe('https://api.video.mail.ru/videos/embed/list.ru/user/video/abc123');
    });
  });

  describe('parseMailruMessage', () => {
    it('should parse JSON messages with type', () => {
      const msg = parseMailruMessage({ data: JSON.stringify({ type: 'playing', data: { currentTime: 10 } }) });
      expect(msg).toEqual({ type: 'playing', data: { currentTime: 10 } });
    });

    it('should parse JSON messages without data field', () => {
      const msg = parseMailruMessage({ data: JSON.stringify({ type: 'ended' }) });
      expect(msg).toEqual({ type: 'ended', data: {} });
    });

    it('should parse JSON messages with event instead of type', () => {
      const msg = parseMailruMessage({ data: JSON.stringify({ event: 'pause' }) });
      expect(msg).toEqual({ type: 'pause', data: {} });
    });

    it('should parse plain string play/started as playing', () => {
      expect(parseMailruMessage({ data: 'play' })).toEqual({ type: 'playing', data: {} });
      expect(parseMailruMessage({ data: 'started' })).toEqual({ type: 'playing', data: {} });
    });

    it('should parse plain string pause/paused as pause', () => {
      expect(parseMailruMessage({ data: 'pause' })).toEqual({ type: 'pause', data: {} });
      expect(parseMailruMessage({ data: 'paused' })).toEqual({ type: 'pause', data: {} });
    });

    it('should parse plain string end/complete/finished as ended', () => {
      expect(parseMailruMessage({ data: 'end' })).toEqual({ type: 'ended', data: {} });
      expect(parseMailruMessage({ data: 'complete' })).toEqual({ type: 'ended', data: {} });
      expect(parseMailruMessage({ data: 'finished' })).toEqual({ type: 'ended', data: {} });
    });

    it('should parse object format messages', () => {
      const msg = parseMailruMessage({ data: { type: 'timeupdate', data: { currentTime: 5 } } });
      expect(msg).toEqual({ type: 'timeupdate', data: { currentTime: 5 } });
    });

    it('should parse object format with event instead of type', () => {
      const msg = parseMailruMessage({ data: { event: 'volumechange', volume: 0.5 } });
      expect(msg).toEqual({ type: 'volumechange', data: { event: 'volumechange', volume: 0.5 } });
    });

    it('should return null for non-matching plain strings', () => {
      expect(parseMailruMessage({ data: 'some_random_string' })).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      expect(parseMailruMessage({ data: '{invalid json}' })).toBeNull();
    });

    it('should return null for non-object, non-string data', () => {
      expect(parseMailruMessage({ data: 123 })).toBeNull();
    });

    it('should return null for object without type/event', () => {
      expect(parseMailruMessage({ data: { foo: 'bar' } })).toBeNull();
    });

    it('should handle null data gracefully', () => {
      expect(parseMailruMessage({ data: null })).toBeNull();
    });
  });
});
