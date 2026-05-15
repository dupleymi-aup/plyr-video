import { describe, it, expect, vi } from 'vitest';

// Mock TextTrack for jsdom environment (TextTrack is not available in jsdom)
if (typeof TextTrack === 'undefined') {
  globalThis.TextTrack = class TextTrack {};
}

import { getTracks, getLabel } from '../src/js/captions-utils';

describe('captions-utils', () => {
  describe('getTracks', () => {
    it('returns empty array when media is null', () => {
      const mockPlyr = { media: null, isHTML5: false };
      expect(getTracks(mockPlyr)).toEqual([]);
    });

    it('returns empty array when textTracks is null', () => {
      const mockPlyr = { media: { textTracks: null }, isHTML5: false };
      expect(getTracks(mockPlyr)).toEqual([]);
    });

    it('returns empty array when textTracks is empty', () => {
      const mockPlyr = { media: { textTracks: [] }, isHTML5: false };
      expect(getTracks(mockPlyr)).toEqual([]);
    });

    it('filters tracks by kind for non-HTML5', () => {
      const mockPlyr = {
        media: {
          textTracks: [
            { kind: 'captions' },
            { kind: 'subtitles' },
            { kind: 'metadata' },
            { kind: 'chapters' },
          ],
        },
        isHTML5: false,
      };
      const tracks = getTracks(mockPlyr);
      expect(tracks.length).toBe(2);
      expect(tracks.map(t => t.kind)).toEqual(['captions', 'subtitles']);
    });

    it('returns all matching tracks for HTML5 when update is true', () => {
      const mockPlyr = {
        media: {
          textTracks: [
            { kind: 'captions' },
            { kind: 'metadata' },
          ],
        },
        isHTML5: true,
        captions: { meta: new WeakMap() },
      };
      const tracks = getTracks(mockPlyr, true);
      expect(tracks.length).toBe(1);
      expect(tracks[0].kind).toBe('captions');
    });

    it('filters out tracks without meta for HTML5 when update is false', () => {
      const meta = new WeakMap();
      const trackWithMeta = { kind: 'captions' };
      const trackWithoutMeta = { kind: 'subtitles' };
      meta.set(trackWithMeta, {});

      const mockPlyr = {
        media: {
          textTracks: [trackWithMeta, trackWithoutMeta],
        },
        isHTML5: true,
        captions: { meta },
      };
      const tracks = getTracks(mockPlyr, false);
      expect(tracks.length).toBe(1);
      expect(tracks[0]).toBe(trackWithMeta);
    });
  });

  describe('getLabel', () => {
    it('returns disabled when track is not provided and captions not toggled', () => {
      const mockPlyr = {
        config: { i18n: { enabled: 'Enabled', disabled: 'Disabled' } },
        supported: { textTracks: true },
        captions: { toggled: false, currentTrack: 0 },
        media: { textTracks: [] },
        isHTML5: false,
      };
      const label = getLabel(mockPlyr);
      expect(label).toBe('Disabled');
    });

    it('returns track label when track has label property', () => {
      const mockTrack = { kind: 'captions', label: 'English CC', language: 'en' };
      const mockPlyr = {
        config: { i18n: { enabled: 'Enabled', disabled: 'Disabled' } },
        supported: { textTracks: true },
        captions: { toggled: false, currentTrack: 0 },
        media: { textTracks: [] },
        isHTML5: false,
      };
      expect(getLabel(mockPlyr, mockTrack)).toBe('English CC');
    });

    it('returns language uppercase when track has no label', () => {
      const mockTrack = { kind: 'captions', language: 'fr' };
      const mockPlyr = {
        config: { i18n: { enabled: 'Enabled', disabled: 'Disabled' } },
        supported: { textTracks: true },
        captions: { toggled: false, currentTrack: 0 },
        media: { textTracks: [] },
        isHTML5: false,
      };
      expect(getLabel(mockPlyr, mockTrack)).toBe('FR');
    });

    it('returns enabled when track is valid but has no label or language', () => {
      const mockTrack = { kind: 'captions' };
      const mockPlyr = {
        config: { i18n: { enabled: 'Enabled', disabled: 'Disabled' } },
        supported: { textTracks: true },
        captions: { toggled: false, currentTrack: 0 },
        media: { textTracks: [] },
        isHTML5: false,
      };
      expect(getLabel(mockPlyr, mockTrack)).toBe('Enabled');
    });
  });
});
