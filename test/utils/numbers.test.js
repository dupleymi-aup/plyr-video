import { describe, expect, it } from 'vitest';
import { clamp } from '../../src/js/utils/numbers';

describe('number utils', () => {
  describe('clamp', () => {
    it('should return the input when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should return min when input is below min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should return max when input is above max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should use default values when not provided', () => {
      expect(clamp()).toBe(0); // default input=0, min=0, max=255
      expect(clamp(300)).toBe(255); // clamped to default max
    });

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });

    it('should handle floating point numbers', () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(1.5, 0, 1)).toBe(1);
      expect(clamp(-0.5, 0, 1)).toBe(0);
    });

    it('should handle equal min and max', () => {
      expect(clamp(5, 10, 10)).toBe(10);
      expect(clamp(15, 10, 10)).toBe(10);
    });
  });
});
