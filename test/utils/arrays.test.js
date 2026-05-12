import { describe, expect, it } from 'vitest';
import { closest, dedupe } from '../../src/js/utils/arrays';

describe('array utils', () => {
  describe('dedupe', () => {
    it('should remove duplicates from an array', () => {
      expect(dedupe([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should handle arrays with all same values', () => {
      expect(dedupe(['a', 'a', 'a'])).toEqual(['a']);
    });

    it('should return the same array if no duplicates', () => {
      expect(dedupe([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should handle empty arrays', () => {
      expect(dedupe([])).toEqual([]);
    });

    it('should return non-array input as-is', () => {
      expect(dedupe(null)).toBeNull();
      expect(dedupe(undefined)).toBeUndefined();
      expect(dedupe('not an array')).toBe('not an array');
    });
  });

  describe('closest', () => {
    it('should find the closest value in an array', () => {
      expect(closest([1, 5, 10, 15], 7)).toBe(5);
      expect(closest([1, 5, 10, 15], 12)).toBe(10);
    });

    it('should return exact match if value exists', () => {
      expect(closest([1, 5, 10, 15], 10)).toBe(10);
    });

    it('should return first value when equally close', () => {
      expect(closest([5, 15], 10)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(closest([-10, -5, 0, 5], -3)).toBe(-5);
    });

    it('should handle floating point numbers', () => {
      expect(closest([1.1, 2.2, 3.3], 2.5)).toBe(2.2);
    });

    it('should return null for empty arrays', () => {
      expect(closest([], 5)).toBeNull();
    });

    it('should return null for non-array input', () => {
      expect(closest(null, 5)).toBeNull();
      expect(closest(undefined, 5)).toBeNull();
    });
  });
});
