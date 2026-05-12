import { describe, expect, it } from 'vitest';
import { buildUrlParams, parseUrl } from '../../src/js/utils/urls';

describe('uRL utils', () => {
  describe('parseUrl', () => {
    it('should parse a valid URL', () => {
      const url = parseUrl('https://example.com/path?query=value');
      expect(url).not.toBeNull();
      expect(url?.hostname).toBe('example.com');
      expect(url?.pathname).toBe('/path');
      expect(url?.search).toBe('?query=value');
    });

    it('should parse relative URLs using safe mode', () => {
      // In jsdom, 'not-a-url' becomes a relative path on current origin
      const url = parseUrl('not-a-url');
      expect(url).not.toBeNull();
      expect(url?.pathname).toContain('not-a-url');
    });

    it('should parse URLs with ports', () => {
      const url = parseUrl('https://example.com:3000/path');
      expect(url?.port).toBe('3000');
    });

    it('should handle empty string as current origin', () => {
      // jsdom resolves '' to the current origin URL
      const url = parseUrl('');
      expect(url).not.toBeNull();
    });

    it('should parse YouTube URLs', () => {
      const url = parseUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(url?.hostname).toContain('youtube');
      expect(url?.searchParams.get('v')).toBe('dQw4w9WgXcQ');
    });
  });

  describe('buildUrlParams', () => {
    it('should convert object to URLSearchParams', () => {
      const params = buildUrlParams({ key: 'value', foo: 'bar' });
      expect(params.get('key')).toBe('value');
      expect(params.get('foo')).toBe('bar');
    });

    it('should return empty params for empty object', () => {
      const params = buildUrlParams({});
      expect(params.toString()).toBe('');
    });

    it('should handle non-object input', () => {
      const params = buildUrlParams(null);
      expect(params).toBeInstanceOf(URLSearchParams);
      expect(params.toString()).toBe('');
    });

    it('should handle undefined input', () => {
      const params = buildUrlParams(undefined);
      expect(params).toBeInstanceOf(URLSearchParams);
      expect(params.toString()).toBe('');
    });

    it('should convert values to strings', () => {
      const params = buildUrlParams({ count: 42, flag: true });
      expect(params.get('count')).toBe('42');
      expect(params.get('flag')).toBe('true');
    });
  });
});
