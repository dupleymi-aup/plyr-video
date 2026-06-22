import { describe, expect, it } from 'vitest';
import {
  format,
  generateId,
  getPercentage,
  replaceAll,
  stripHTML,
  toCamelCase,
  toPascalCase,
  toTitleCase,
} from '../../src/js/utils/strings';

describe('string utils', () => {
  describe('generateId', () => {
    it('should generate an ID with the given prefix', () => {
      const id = generateId('test');
      expect(id.startsWith('test-')).toBe(true);
    });

    it('should generate a unique ID each time', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId('id'));
      }
      // With 10000 possible values, 100 should have very few collisions
      expect(ids.size).toBeGreaterThan(90);
    });
  });

  describe('format', () => {
    it('should replace placeholders with arguments', () => {
      expect(format('Hello {0}', 'World')).toBe('Hello World');
    });

    it('should replace multiple placeholders', () => {
      expect(format('{0} + {1} = {2}', 1, 2, 3)).toBe('1 + 2 = 3');
    });

    it('should return input if empty', () => {
      expect(format(null)).toBeNull();
      expect(format(undefined)).toBeUndefined();
      expect(format('')).toBe('');
    });

    it('should keep placeholder when arg is missing', () => {
      expect(format('Hello {0} {1}', 'World')).toBe('Hello World {1}');
    });
  });

  describe('getPercentage', () => {
    it('should calculate percentage', () => {
      expect(getPercentage(50, 100)).toBe('50.00');
      expect(getPercentage(25, 200)).toBe('12.50');
    });

    it('should return 0 for zero current', () => {
      expect(getPercentage(0, 100)).toBe(0);
    });

    it('should return 0 for zero max', () => {
      expect(getPercentage(50, 0)).toBe(0);
    });

    it('should return 0 for NaN inputs', () => {
      expect(getPercentage(Number.NaN, 100)).toBe(0);
      expect(getPercentage(50, Number.NaN)).toBe(0);
    });
  });

  describe('replaceAll', () => {
    it('should replace all occurrences', () => {
      expect(replaceAll('foo bar foo', 'foo', 'baz')).toBe('baz bar baz');
    });

    it('should escape special regex characters', () => {
      expect(replaceAll('a.b*c+d', '.', 'X')).toBe('aXb*c+d');
      expect(replaceAll('a.b*c+d', '*', 'X')).toBe('a.bXc+d');
    });

    it('should handle empty strings', () => {
      expect(replaceAll('', 'a', 'b')).toBe('');
    });

    it('should convert numbers to strings', () => {
      expect(replaceAll('123', 2, 'X')).toBe('1X3');
    });
  });

  describe('toTitleCase', () => {
    it('should convert to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('should handle mixed case input', () => {
      expect(toTitleCase('hElLo wOrLd')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(toTitleCase('')).toBe('');
    });
  });

  describe('toPascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(toPascalCase('hello-world')).toBe('HelloWorld');
    });

    it('should convert snake_case to PascalCase', () => {
      expect(toPascalCase('hello_world')).toBe('HelloWorld');
    });

    it('should convert space separated to PascalCase', () => {
      expect(toPascalCase('hello world')).toBe('HelloWorld');
    });
  });

  describe('toCamelCase', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld');
    });

    it('should convert snake_case to camelCase', () => {
      expect(toCamelCase('hello_world')).toBe('helloWorld');
    });

    it('should have lowercase first character', () => {
      expect(toCamelCase('Hello-World')).toBe('helloWorld');
    });
  });

  describe('stripHTML', () => {
    it('should remove HTML tags from a string', () => {
      expect(stripHTML('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    it('should handle string with no HTML', () => {
      expect(stripHTML('Hello World')).toBe('Hello World');
    });
  });
});
