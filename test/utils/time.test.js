import { describe, expect, it } from 'vitest';
import { formatTime, getHours, getMinutes, getSeconds } from '../../src/js/utils/time';

describe('time utils', () => {
  describe('getHours', () => {
    it('should return 0 for values less than 1 hour', () => {
      expect(getHours(3599)).toBe(0);
    });

    it('should return 1 for 3600 seconds', () => {
      expect(getHours(3600)).toBe(1);
    });

    it('should return correct hours for large values', () => {
      expect(getHours(7200)).toBe(2);
      expect(getHours(90061)).toBe(25); // 25h 1m 1s
    });
  });

  describe('getMinutes', () => {
    it('should return 0 for values less than 1 minute', () => {
      expect(getMinutes(59)).toBe(0);
    });

    it('should return 1 for 60 seconds', () => {
      expect(getMinutes(60)).toBe(1);
    });

    it('should return correct minutes modulo 60', () => {
      expect(getMinutes(3661)).toBe(1); // 1h 1m 1s
      expect(getMinutes(7200)).toBe(0); // 2h 0m
    });
  });

  describe('getSeconds', () => {
    it('should return the seconds value for values less than 60', () => {
      expect(getSeconds(30)).toBe(30);
    });

    it('should return 0 for exact minutes', () => {
      expect(getSeconds(120)).toBe(0);
      expect(getSeconds(60)).toBe(0);
    });

    it('should return correct seconds modulo 60', () => {
      expect(getSeconds(125)).toBe(5);
      expect(getSeconds(3661)).toBe(1);
    });
  });

  describe('formatTime', () => {
    it('should format seconds correctly', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(5)).toBe('00:05');
      expect(formatTime(30)).toBe('00:30');
      expect(formatTime(59)).toBe('00:59');
    });

    it('should format minutes and seconds correctly', () => {
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(3599)).toBe('59:59');
    });

    it('should format hours when displayHours is true', () => {
      expect(formatTime(3600, true)).toBe('1:00:00');
      expect(formatTime(3661, true)).toBe('1:01:01');
    });

    it('should format hours when time exceeds 1 hour even without displayHours', () => {
      expect(formatTime(3600)).toBe('1:00:00');
      expect(formatTime(7200)).toBe('2:00:00');
    });

    it('should handle inverted format', () => {
      expect(formatTime(10, false, true)).toBe('-00:10');
      expect(formatTime(60, false, true)).toBe('-01:00');
    });

    it('should not show minus for zero time with inverted', () => {
      expect(formatTime(0, false, true)).toBe('00:00');
    });

    it('should handle non-number input by returning 00:00', () => {
      expect(formatTime(null)).toBe('00:00');
      expect(formatTime(undefined)).toBe('00:00');
      expect(formatTime('invalid')).toBe('00:00');
    });

    it('should default to 0 when no argument provided', () => {
      expect(formatTime()).toBe('00:00');
    });
  });
});
