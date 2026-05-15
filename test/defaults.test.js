// Tests for defaults config
import { describe, it, expect } from 'vitest';
import defaults from '../src/js/config/defaults.js';

describe('defaults config', () => {
  it('should have loop config with start and end', () => {
    expect(defaults.loop).toBeDefined();
    expect(defaults.loop.active).toBe(false);
    expect(defaults.loop.start).toBeNull();
    expect(defaults.loop.end).toBeNull();
  });

  it('should have loop in settings', () => {
    expect(defaults.settings).toContain('loop');
  });

  it('should have loop i18n strings', () => {
    expect(defaults.i18n.loop).toBe('Loop');
    expect(defaults.i18n.loopOn).toBe('On');
    expect(defaults.i18n.loopOff).toBe('Off');
    expect(defaults.i18n.loopAll).toBe('Loop all');
    expect(defaults.i18n.loopMarkStart).toBe('Mark start');
    expect(defaults.i18n.loopMarkEnd).toBe('Mark end');
  });

  it('should have transcription config', () => {
    expect(defaults.transcription).toBeDefined();
    expect(defaults.transcription.active).toBe(false);
    expect(defaults.transcription.language).toBe('en');
    expect(Array.isArray(defaults.transcription.languages)).toBe(true);
  });

  it('should have translation config', () => {
    expect(defaults.translation).toBeDefined();
    expect(defaults.translation.active).toBe(false);
    expect(defaults.translation.language).toBe('en');
  });

  it('should have Russian in transcription/translation languages', () => {
    expect(defaults.transcription.languages).toContain('ru');
    expect(defaults.translation.languages).toContain('ru');
  });

  it('should have all error messages', () => {
    const errorKeys = [
      'errorTitle', 'errorNetwork', 'errorMediaNotFound',
      'errorMediaUnavailable', 'errorGeoblocked', 'errorMediaRemoved',
      'errorMediaPrivate', 'errorPlayerInit', 'errorEmbedBlocked',
      'errorDRM', 'errorUnknown', 'errorRetry',
    ];
    for (const key of errorKeys) {
      expect(defaults.i18n[key]).toBeDefined();
      expect(defaults.i18n[key]).toBeTruthy();
    }
  });
});
