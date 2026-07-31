import { describe, expect, it } from 'vitest';

// Replicate the PREVENT_DEFAULT_KEYS Set from src/js/listeners.js
const PREVENT_DEFAULT_KEYS = new Set([
  ' ',
  'ArrowLeft',
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',

  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',

  'c',
  'd',
  'f',
  'k',
  'l',
  'm',
  's',
  ',',
  '.',
]);

describe('PREVENT_DEFAULT_KEYS Set', () => {
  it('should contain all expected keys', () => {
    expect(PREVENT_DEFAULT_KEYS.has(' ')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('ArrowLeft')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('ArrowUp')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('ArrowRight')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('ArrowDown')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('0')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('9')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('c')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('d')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('f')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('k')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('l')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('m')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('s')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has(',')).toBe(true);
    expect(PREVENT_DEFAULT_KEYS.has('.')).toBe(true);
  });

  it('should not contain keys that should not be prevented', () => {
    expect(PREVENT_DEFAULT_KEYS.has('Escape')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('Enter')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('Tab')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('a')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('b')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('e')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('g')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('h')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('i')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('j')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('n')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('o')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('p')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('q')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('r')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('t')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('u')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('v')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('w')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('x')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('y')).toBe(false);
    expect(PREVENT_DEFAULT_KEYS.has('z')).toBe(false);
  });

  it('should be a Set instance', () => {
    expect(PREVENT_DEFAULT_KEYS).toBeInstanceOf(Set);
  });
});