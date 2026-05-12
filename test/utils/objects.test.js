import { describe, expect, it } from 'vitest';
import { cloneDeep, extend, getDeep } from '../../src/js/utils/objects';

describe('object utils', () => {
  describe('cloneDeep', () => {
    it('should clone a simple object', () => {
      const obj = { a: 1, b: 'test', c: true };
      const clone = cloneDeep(obj);
      expect(clone).toEqual(obj);
      expect(clone).not.toBe(obj);
    });

    it('should clone nested objects', () => {
      const obj = { a: { b: { c: 1 } }, d: [1, 2, 3] };
      const clone = cloneDeep(obj);
      expect(clone).toEqual(obj);
      expect(clone.a).not.toBe(obj.a);
    });

    it('should clone arrays', () => {
      const arr = [1, [2, 3], { a: 4 }];
      const clone = cloneDeep(arr);
      expect(clone).toEqual(arr);
      expect(clone).not.toBe(arr);
    });
  });

  describe('getDeep', () => {
    it('should get a nested value from a path string', () => {
      const obj = { a: { b: { c: 42 } } };
      expect(getDeep(obj, 'a.b.c')).toBe(42);
    });

    it('should return undefined for missing paths', () => {
      const obj = { a: { b: 1 } };
      expect(getDeep(obj, 'a.c.d')).toBeUndefined();
    });

    it('should handle single-level paths', () => {
      const obj = { a: 1, b: 2 };
      expect(getDeep(obj, 'a')).toBe(1);
    });

    it('should return undefined for empty objects', () => {
      expect(getDeep({}, 'a.b')).toBeUndefined();
    });

    it('should return null for null nested values', () => {
      const obj = { a: null };
      expect(getDeep(obj, 'a.b')).toBeNull();
    });
  });

  describe('extend', () => {
    it('should merge two objects', () => {
      const target = { a: 1 };
      const source = { b: 2 };
      const result = extend(target, source);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should deep merge nested objects', () => {
      const target = { a: { b: 1 } };
      const source = { a: { c: 2 } };
      const result = extend(target, source);
      expect(result).toEqual({ a: { b: 1, c: 2 } });
    });

    it('should handle multiple sources', () => {
      const result = extend({}, { a: 1 }, { b: 2 }, { c: 3 });
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should not modify source objects', () => {
      const source = { a: 1 };
      extend({}, source);
      expect(source).toEqual({ a: 1 });
    });

    it('should return target if no sources provided', () => {
      const target = { a: 1 };
      const result = extend(target);
      expect(result).toBe(target);
    });

    it('should skip non-object sources but continue with valid ones', () => {
      // extend processes sources sequentially - null/undefined are skipped
      const result = extend({ a: 1 }, { b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should use default empty object if target is undefined', () => {
      const result = extend(undefined, { a: 1 });
      expect(result).toEqual({ a: 1 });
    });

    it('should overwrite primitive values with later sources', () => {
      const result = extend({ a: 1 }, { a: 2 });
      expect(result).toEqual({ a: 2 });
    });
  });
});
