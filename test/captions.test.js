import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the controls module before importing Captions
vi.mock('../src/js/controls', () => ({
  default: {
    setCaptionsMenu: vi.fn(),
    updateSetting: vi.fn(),
  },
}));

// Mock fetch
vi.mock('../src/js/utils/fetch', () => ({
  default: vi.fn(),
}));

// Mock translate
vi.mock('../src/js/utils/translate', () => ({
  translate: vi.fn(() => Promise.resolve('translated')),
}));

import Captions from '../src/js/captions';

describe('Captions', () => {
  let mockPlyr;

  beforeEach(() => {
    vi.useFakeTimers();
    mockPlyr = {
      storage: {
        get: vi.fn(),
        set: vi.fn(),
      },
      debug: {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      config: {
        captions: {
          active: false,
          language: 'auto',
          update: false,
        },
        translation: {
          active: false,
          language: 'en',
        },
        controls: ['settings'],
        settings: ['captions'],
        selectors: {
          captions: '.plyr__captions',
          translation: '.plyr__translation',
          caption: '.plyr__caption',
        },
        classNames: {
          captions: {
            enabled: 'plyr--captions-enabled',
            active: 'plyr--captions-active',
          },
          translation: {
            active: 'plyr--translation-active',
          },
        },
        events: [],
      },
      supported: {
        ui: true,
        textTracks: true,
      },
      isVideo: true,
      isHTML5: true,
      isYouTube: false,
      isVimeo: false,
      isRutube: false,
      isYandexCloud: false,
      media: {
        textTracks: {
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      },
      elements: {
        container: document.createElement('div'),
        wrapper: document.createElement('div'),
      },
    };
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('initializes with default state', () => {
      const captions = new Captions(mockPlyr);
      expect(captions.toggled).toBe(false);
      expect(captions.active).toBe(false);
      expect(captions.language).toBe('');
      expect(captions.languages).toEqual([]);
      expect(captions.currentTrack).toBe(-1);
      expect(captions.currentTrackNode).toBeNull();
      expect(captions.translation).toEqual({ active: false, language: 'en' });
    });

    it('stores plyr references', () => {
      const captions = new Captions(mockPlyr);
      expect(captions.plyr).toBe(mockPlyr);
      expect(captions.storage).toBe(mockPlyr.storage);
      expect(captions.debug).toBe(mockPlyr.debug);
      expect(captions.config).toBe(mockPlyr.config);
    });
  });

  describe('setup', () => {
    it('returns early if UI not supported', () => {
      mockPlyr.supported.ui = false;
      const captions = new Captions(mockPlyr);
      captions.setup();
      expect(captions.elements.captions).toBeUndefined();
    });

    it('returns early for YouTube', () => {
      mockPlyr.isYouTube = true;
      const captions = new Captions(mockPlyr);
      captions.setup();
      expect(captions.elements.captions).toBeUndefined();
    });

    it('returns early for HTML5 without textTrack support', () => {
      mockPlyr.supported.textTracks = false;
      const captions = new Captions(mockPlyr);
      captions.setup();
      expect(captions.elements.captions).toBeUndefined();
    });
  });

  describe('getTracks', () => {
    it('returns empty array when no text tracks', () => {
      mockPlyr.media.textTracks = [];
      const captions = new Captions(mockPlyr);
      expect(captions.getTracks()).toEqual([]);
    });

    it('filters tracks by kind', () => {
      mockPlyr.media.textTracks = [
        { kind: 'captions', language: 'en' },
        { kind: 'subtitles', language: 'fr' },
        { kind: 'metadata', language: 'en' },
      ];
      const captions = new Captions(mockPlyr);
      // HTML5 tracks need metadata in meta WeakMap
      const tracks = captions.getTracks(true);
      expect(tracks.length).toBe(2);
      expect(tracks.map(t => t.kind)).not.toContain('metadata');
    });
  });

  describe('findTrack', () => {
    it('finds track by language', () => {
      const mockTrack = { kind: 'captions', language: 'fr' };
      mockPlyr.media.textTracks = [mockTrack];
      const captions = new Captions(mockPlyr);
      // Manually add to meta for HTML5 tracks
      captions.meta.set(mockTrack, {});
      const track = captions.findTrack(['fr'], false);
      expect(track).toBeDefined();
      expect(track.language).toBe('fr');
    });

    it('returns first track when force is true', () => {
      const mockTrack = { kind: 'captions', language: 'en' };
      mockPlyr.media.textTracks = [mockTrack];
      const captions = new Captions(mockPlyr);
      captions.meta.set(mockTrack, {});
      const track = captions.findTrack(['de'], true);
      expect(track).toBeDefined();
      expect(track.language).toBe('en');
    });

    it('returns undefined when no match and force is false', () => {
      const mockTrack = { kind: 'captions', language: 'en' };
      mockPlyr.media.textTracks = [mockTrack];
      const captions = new Captions(mockPlyr);
      captions.meta.set(mockTrack, {});
      const track = captions.findTrack(['de'], false);
      expect(track).toBeUndefined();
    });
  });

  describe('setLanguage', () => {
    it('warns for invalid input', () => {
      const captions = new Captions(mockPlyr);
      captions.setLanguage(null);
      expect(captions.debug.warn).toHaveBeenCalled();
    });

    it('normalizes language to lowercase', () => {
      mockPlyr.media.textTracks = [
        { kind: 'captions', language: 'en' },
      ];
      const captions = new Captions(mockPlyr);
      captions.setLanguage('EN');
      expect(captions.language).toBe('en');
    });
  });

  describe('set', () => {
    it('disables captions when index is -1', () => {
      const captions = new Captions(mockPlyr);
      captions.toggle = vi.fn();
      captions.set(-1);
      expect(captions.toggle).toHaveBeenCalledWith(false, true);
    });

    it('warns for non-number index', () => {
      const captions = new Captions(mockPlyr);
      captions.set('invalid');
      expect(captions.debug.warn).toHaveBeenCalled();
    });

    it('warns for invalid track index', () => {
      mockPlyr.media.textTracks = [];
      const captions = new Captions(mockPlyr);
      captions.set(5);
      expect(captions.debug.warn).toHaveBeenCalled();
    });
  });

  describe('toggle', () => {
    it('returns early if UI not supported', () => {
      mockPlyr.supported.ui = false;
      const captions = new Captions(mockPlyr);
      expect(captions.toggle()).toBeUndefined();
    });

    it('toggles state when called without argument', () => {
      const captions = new Captions(mockPlyr);
      captions.elements.buttons = {};
      captions.currentTrackNode = { mode: 'hidden' };
      expect(captions.toggled).toBe(false);
      captions.toggle();
      expect(captions.toggled).toBe(true);
    });

    it('sets specific state when called with argument', () => {
      const captions = new Captions(mockPlyr);
      captions.elements.buttons = {};
      captions.currentTrackNode = { mode: 'hidden' };
      captions.toggle(true);
      expect(captions.toggled).toBe(true);
      captions.toggle(false);
      expect(captions.toggled).toBe(false);
    });
  });

  describe('getCurrentTrack', () => {
    it('returns undefined when no tracks', () => {
      mockPlyr.media.textTracks = [];
      const captions = new Captions(mockPlyr);
      expect(captions.getCurrentTrack()).toBeUndefined();
    });
  });

  // Note: getLabel tests skipped - requires TextTrack global not available in jsdom
});
