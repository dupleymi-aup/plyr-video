import { describe, expect, it } from 'vitest';
import is from '../../src/js/utils/is';

describe('is utils', () => {
  describe('nullOrUndefined', () => {
    it('should return true for null', () => {
      expect(is.nullOrUndefined(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(is.nullOrUndefined(undefined)).toBe(true);
    });

    it('should return false for other values', () => {
      expect(is.nullOrUndefined(0)).toBe(false);
      expect(is.nullOrUndefined('')).toBe(false);
      expect(is.nullOrUndefined(false)).toBe(false);
    });
  });

  describe('object', () => {
    it('should return true for plain objects', () => {
      expect(is.object({})).toBe(true);
      expect(is.object({ a: 1 })).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(is.object(null)).toBe(false);
      expect(is.object([])).toBe(false);
      expect(is.object(1)).toBe(false);
    });
  });

  describe('number', () => {
    it('should return true for numbers', () => {
      expect(is.number(0)).toBe(true);
      expect(is.number(1.5)).toBe(true);
      expect(is.number(-10)).toBe(true);
    });

    it('should return false for non-numbers', () => {
      expect(is.number('1')).toBe(false);
      expect(is.number(null)).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(is.number(Number.NaN)).toBe(false);
    });
  });

  describe('string', () => {
    it('should return true for strings', () => {
      expect(is.string('')).toBe(true);
      expect(is.string('hello')).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(is.string(123)).toBe(false);
      expect(is.string(null)).toBe(false);
    });
  });

  describe('boolean', () => {
    it('should return true for booleans', () => {
      expect(is.boolean(true)).toBe(true);
      expect(is.boolean(false)).toBe(true);
    });

    it('should return false for non-booleans', () => {
      expect(is.boolean(1)).toBe(false);
      expect(is.boolean('true')).toBe(false);
    });
  });

  describe('function', () => {
    it('should return true for functions', () => {
      expect(is.function(() => {})).toBe(true);
      expect(is.function(() => {})).toBe(true);
    });

    it('should return false for non-functions', () => {
      expect(is.function(1)).toBe(false);
      expect(is.function({})).toBe(false);
    });
  });

  describe('array', () => {
    it('should return true for arrays', () => {
      expect(is.array([])).toBe(true);
      expect(is.array([1, 2, 3])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(is.array({})).toBe(false);
      expect(is.array('array')).toBe(false);
    });
  });

  describe('element', () => {
    it('should return true for DOM elements', () => {
      const div = document.createElement('div');
      expect(is.element(div)).toBe(true);
    });

    it('should return false for non-elements', () => {
      expect(is.element({})).toBe(false);
      expect(is.element(null)).toBe(false);
      expect(is.element('div')).toBe(false);
    });
  });

  describe('url', () => {
    it('should return true for valid URLs', () => {
      expect(is.url('https://example.com')).toBe(true);
      expect(is.url('http://example.com')).toBe(true);
    });

    it('should return true for URL objects', () => {
      expect(is.url(new URL('https://example.com'))).toBe(true);
    });

    it('should add http:// if no protocol', () => {
      expect(is.url('example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(is.url('')).toBe(false);
      expect(is.url(123)).toBe(false);
    });
  });

  describe('empty', () => {
    it('should return true for null/undefined', () => {
      expect(is.empty(null)).toBe(true);
      expect(is.empty(undefined)).toBe(true);
    });

    it('should return true for empty strings', () => {
      expect(is.empty('')).toBe(true);
    });

    it('should return true for empty arrays', () => {
      expect(is.empty([])).toBe(true);
    });

    it('should return true for empty objects', () => {
      expect(is.empty({})).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(is.empty('hello')).toBe(false);
      expect(is.empty([1])).toBe(false);
      expect(is.empty({ a: 1 })).toBe(false);
      expect(is.empty(0)).toBe(false);
    });
  });
});
