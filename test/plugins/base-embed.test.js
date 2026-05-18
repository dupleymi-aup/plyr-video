import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  baseSetup,
  isOriginAllowed,
  handleChangeState,
  handleCurrentTime,
  handleCaptionList,
  handleCueChange,
  handlePlayOptionsLoaded,
  handleQualityList,
  handleCurrentQuality,
  handleDefaultMessage,
} from '../../src/js/plugins/base-embed';

describe('base-embed', () => {
  describe('isOriginAllowed', () => {
    it('should return true when origin is in allowed list', () => {
      expect(isOriginAllowed('https://example.com', ['https://example.com', 'https://other.com'])).toBe(true);
    });

    it('should return false when origin is not in allowed list', () => {
      expect(isOriginAllowed('https://evil.com', ['https://example.com'])).toBe(false);
    });

    it('should return false when allowed is not an array', () => {
      expect(isOriginAllowed('https://example.com', 'https://example.com')).toBe(false);
      expect(isOriginAllowed('https://example.com', null)).toBe(false);
      expect(isOriginAllowed('https://example.com', undefined)).toBe(false);
    });

    it('should return false for empty allowed array', () => {
      expect(isOriginAllowed('https://example.com', [])).toBe(false);
    });
  });

  describe('baseSetup', () => {
    let mockPlayer;

    beforeEach(() => {
      mockPlayer = {
        elements: {
          wrapper: {
            nodeType: 1,
            style: {},
            ownerDocument: {},
            classList: { toggle: vi.fn(), add: vi.fn(), contains: vi.fn(() => false) },
          },
        },
        config: {
          classNames: { embed: 'plyr--embed' },
          speed: { options: [0.5, 1, 1.5, 2] },
          ratio: '16:9',
        },
        options: { speed: [] },
        embed: {},
      };
    });

    it('should add embed class to wrapper', () => {
      const mockProvider = { ready: vi.fn() };
      baseSetup.call(mockPlayer, mockProvider);
      expect(mockPlayer.elements.wrapper.classList.add).toHaveBeenCalledWith('plyr--embed');
    });

    it('should set speed options from config', () => {
      const mockProvider = { ready: vi.fn() };
      baseSetup.call(mockPlayer, mockProvider);
      expect(mockPlayer.options.speed).toEqual([0.5, 1, 1.5, 2]);
    });

    it('should call provider.ready', () => {
      const mockProvider = { ready: vi.fn() };
      baseSetup.call(mockPlayer, mockProvider);
      expect(mockProvider.ready).toHaveBeenCalled();
    });
  });

  describe('handleChangeState', () => {
    let mockPlayer;

    beforeEach(() => {
      mockPlayer = {
        embed: { state: 'paused' },
        media: { paused: true, seeking: false },
        config: { debug: false },
        debug: { log: vi.fn() },
      };
    });

    it('should handle playing state', () => {
      const assurePlaybackState = vi.fn();
      const triggerEvent = vi.fn();
      handleChangeState(mockPlayer, { state: 'playing' });
      expect(mockPlayer.media.paused).toBe(false);
    });

    it('should handle pause state', () => {
      mockPlayer.media.paused = false;
      handleChangeState(mockPlayer, { state: 'pause' });
      expect(mockPlayer.media.paused).toBe(true);
    });

    it('should handle seeking state', () => {
      handleChangeState(mockPlayer, { state: 'seeking' });
      expect(mockPlayer.media.seeking).toBe(true);
    });

    it('should handle seeked state', () => {
      mockPlayer.media.seeking = true;
      handleChangeState(mockPlayer, { state: 'seeked' });
      expect(mockPlayer.media.seeking).toBe(false);
    });

    it('should handle completed state', () => {
      handleChangeState(mockPlayer, { state: 'completed' });
      expect(mockPlayer.media.paused).toBe(true);
    });

    it('should do nothing for unknown state', () => {
      mockPlayer.media.paused = false;
      handleChangeState(mockPlayer, { state: 'unknown' });
      expect(mockPlayer.media.paused).toBe(false);
    });

    it('should do nothing when data is null', () => {
      mockPlayer.media.paused = false;
      handleChangeState(mockPlayer, null);
      expect(mockPlayer.media.paused).toBe(false);
    });

    it('should do nothing when data has no state', () => {
      mockPlayer.media.paused = false;
      handleChangeState(mockPlayer, { foo: 'bar' });
      expect(mockPlayer.media.paused).toBe(false);
    });
  });

  describe('handleCurrentTime', () => {
    let mockPlayer;

    beforeEach(() => {
      mockPlayer = {
        embed: { currentTime: 0 },
        media: { duration: 0 },
        config: { debug: false },
        debug: { log: vi.fn() },
      };
    });

    it('should update currentTime from data', () => {
      handleCurrentTime(mockPlayer, { time: 42 });
      expect(mockPlayer.embed.currentTime).toBe(42);
    });

    it('should update duration only when different', () => {
      mockPlayer.media.duration = 100;
      handleCurrentTime(mockPlayer, { time: 50, duration: 200 });
      expect(mockPlayer.media.duration).toBe(200);
    });

    it('should not update duration when same', () => {
      mockPlayer.media.duration = 100;
      handleCurrentTime(mockPlayer, { time: 50, duration: 100 });
      expect(mockPlayer.media.duration).toBe(100);
    });

    it('should do nothing when data is null', () => {
      handleCurrentTime(mockPlayer, null);
      expect(mockPlayer.embed.currentTime).toBe(0);
    });

    it('should do nothing when time is not a number', () => {
      handleCurrentTime(mockPlayer, { time: 'invalid' });
      expect(mockPlayer.embed.currentTime).toBe(0);
    });
  });

  describe('handleCaptionList', () => {
    let mockPlayer;

    beforeEach(() => {
      mockPlayer = {
        embed: { captionTracks: [] },
        media: { textTracks: [] },
        captions: { setup: vi.fn() },
        config: { debug: false },
        debug: { log: vi.fn() },
      };
    });

    it('should map caption tracks from data', () => {
      handleCaptionList(mockPlayer, {
        list: [
          { id: '1', language: 'ru', label: 'Russian' },
          { id: '2', language: 'en', label: 'English' },
        ],
      });
      expect(mockPlayer.embed.captionTracks).toHaveLength(2);
      expect(mockPlayer.embed.captionTracks[0].language).toBe('ru');
      expect(mockPlayer.embed.captionTracks[0].label).toBe('Russian');
    });

    it('should fallback id to index when missing', () => {
      handleCaptionList(mockPlayer, {
        list: [{ language: 'ru' }],
      });
      expect(mockPlayer.embed.captionTracks[0].id).toBe(0);
    });

    it('should fallback label to language when missing', () => {
      handleCaptionList(mockPlayer, {
        list: [{ id: '1', language: 'ru' }],
      });
      expect(mockPlayer.embed.captionTracks[0].label).toBe('ru');
    });

    it('should do nothing when list is not an array', () => {
      handleCaptionList(mockPlayer, { list: 'not-array' });
      expect(mockPlayer.embed.captionTracks).toEqual([]);
    });

    it('should do nothing when data is null', () => {
      handleCaptionList(mockPlayer, null);
      expect(mockPlayer.embed.captionTracks).toEqual([]);
    });

    it('should call captions.setup when tracks exist', () => {
      handleCaptionList(mockPlayer, { list: [{ language: 'ru' }] });
      expect(mockPlayer.captions.setup).toHaveBeenCalled();
    });
  });

  describe('handleCueChange', () => {
    let mockPlayer;

    beforeEach(() => {
      mockPlayer = {
        captions: { updateCues: vi.fn() },
        config: { debug: false },
        debug: { log: vi.fn() },
      };
    });

    it('should strip HTML tags from string cues', () => {
      handleCueChange(mockPlayer, { cues: ['Hello <b>world</b>', 'Second <i>cue</i>'] });
      expect(mockPlayer.captions.updateCues).toHaveBeenCalledWith(['Hello world', 'Second cue']);
    });

    it('should strip HTML tags from object cues with text', () => {
      handleCueChange(mockPlayer, { cues: [{ text: 'Hello <b>world</b>' }, { text: 'Second' }] });
      expect(mockPlayer.captions.updateCues).toHaveBeenCalledWith(['Hello world', 'Second']);
    });

    it('should do nothing when data is null', () => {
      handleCueChange(mockPlayer, null);
      expect(mockPlayer.captions.updateCues).not.toHaveBeenCalled();
    });

    it('should do nothing when cues is missing', () => {
      handleCueChange(mockPlayer, {});
      expect(mockPlayer.captions.updateCues).not.toHaveBeenCalled();
    });

    it('should handle null captions gracefully', () => {
      mockPlayer.captions = null;
      expect(() => {
        handleCueChange(mockPlayer, { cues: ['test'] });
      }).not.toThrow();
    });
  });

  describe('handlePlayOptionsLoaded', () => {
    let mockPlayer;

    beforeEach(() => {
      mockPlayer = {
        config: { title: '' },
        media: { duration: 0 },
        debug: { log: vi.fn() },
      };
    });

    it('should set duration when not already set', () => {
      handlePlayOptionsLoaded(mockPlayer, { duration: 120 });
      expect(mockPlayer.media.duration).toBe(120);
    });

    it('should not overwrite existing duration', () => {
      mockPlayer.media.duration = 100;
      handlePlayOptionsLoaded(mockPlayer, { duration: 120 });
      expect(mockPlayer.media.duration).toBe(100);
    });

    it('should not call ui.setTitle when title is not set', () => {
      mockPlayer.config.title = '';
      handlePlayOptionsLoaded(mockPlayer, { duration: 120 });
      expect(mockPlayer.config.title).toBe('');
    });

    it('should not overwrite existing title', () => {
      mockPlayer.config.title = 'Existing Title';
      handlePlayOptionsLoaded(mockPlayer, { title: 'New Title' });
      expect(mockPlayer.config.title).toBe('Existing Title');
    });

    it('should do nothing when data is null', () => {
      handlePlayOptionsLoaded(mockPlayer, null);
      expect(mockPlayer.media.duration).toBe(0);
    });
  });

  describe('handleQualityList', () => {
    let mockPlayer;

    beforeEach(() => {
      mockPlayer = {
        embed: { availableQualities: [] },
        config: { debug: false },
        debug: { log: vi.fn() },
      };
    });

    it('should set available qualities from data', () => {
      handleQualityList(mockPlayer, { list: ['1080', '720', '480'] });
      expect(mockPlayer.embed.availableQualities).toEqual([1080, 720, 480]);
    });

    it('should do nothing when data is null', () => {
      handleQualityList(mockPlayer, null);
      expect(mockPlayer.embed.availableQualities).toEqual([]);
    });

    it('should do nothing when list is not an array', () => {
      handleQualityList(mockPlayer, { list: 'not-array' });
      expect(mockPlayer.embed.availableQualities).toEqual([]);
    });
  });

  describe('handleCurrentQuality', () => {
    let mockPlayer;

    beforeEach(() => {
      mockPlayer = {
        embed: { currentQuality: null },
        config: { debug: false },
        debug: { log: vi.fn() },
      };
    });

    it('should set quality from data.quality', () => {
      handleCurrentQuality(mockPlayer, { quality: 720 });
      expect(mockPlayer.embed.currentQuality).toBe(720);
    });

    it('should set quality from direct number', () => {
      handleCurrentQuality(mockPlayer, 1080);
      expect(mockPlayer.embed.currentQuality).toBe(1080);
    });

    it('should do nothing for NaN quality', () => {
      handleCurrentQuality(mockPlayer, { quality: 'invalid' });
      expect(mockPlayer.embed.currentQuality).toBeNull();
    });

    it('should do nothing when data is null', () => {
      handleCurrentQuality(mockPlayer, null);
      expect(mockPlayer.embed.currentQuality).toBeNull();
    });
  });

  describe('handleDefaultMessage', () => {
    let mockPlayer;

    beforeEach(() => {
      mockPlayer = {
        embed: {
          currentTime: 0,
          currentQuality: null,
          availableQualities: [],
          captionTracks: [],
        },
        media: {
          paused: true,
          currentTime: 0,
          duration: 0,
          seeking: false,
          volume: 1,
          playbackRate: 1,
          textTracks: [],
        },
        captions: { setup: vi.fn(), updateCues: vi.fn() },
        config: {
          speed: { selected: 1 },
          volume: 1,
          muted: false,
          debug: false,
          title: 'Test',
        },
        debug: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
      };
    });

    it('should handle ready event', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:ready', data: {} }, 'Test', 'test');
      expect(mockPlayer.debug.log).toHaveBeenCalledWith('Test player ready');
    });

    it('should handle playing state via default message', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:changeState', data: { state: 'playing' } }, 'Test', 'test');
      expect(mockPlayer.media.paused).toBe(false);
    });

    it('should handle pause state via default message', () => {
      mockPlayer.media.paused = false;
      handleDefaultMessage.call(mockPlayer, { type: 'player:changeState', data: { state: 'pause' } }, 'Test', 'test');
      expect(mockPlayer.media.paused).toBe(true);
    });

    it('should handle duration change', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:durationChange', data: { duration: 300 } }, 'Test', 'test');
      expect(mockPlayer.media.duration).toBe(300);
    });

    it('should handle current time', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:currentTime', data: { time: 42, duration: 200 } }, 'Test', 'test');
      expect(mockPlayer.embed.currentTime).toBe(42);
      expect(mockPlayer.media.duration).toBe(200);
    });

    it('should handle volume change', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:volumeChange', data: { volume: 0.5 } }, 'Test', 'test');
      expect(mockPlayer.media.volume).toBe(0.5);
    });

    it('should handle quality list', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:qualityList', data: { list: ['720', '480'] } }, 'Test', 'test');
      expect(mockPlayer.embed.availableQualities).toEqual([720, 480]);
    });

    it('should handle current quality', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:currentQuality', data: { quality: 1080 } }, 'Test', 'test');
      expect(mockPlayer.embed.currentQuality).toBe(1080);
    });

    it('should handle playOptionsLoaded', () => {
      mockPlayer.config.title = '';
      handleDefaultMessage.call(mockPlayer, { type: 'player:playOptionsLoaded', data: { duration: 120 } }, 'Test', 'test');
      expect(mockPlayer.media.duration).toBe(120);
    });

    it('should handle caption list', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:captionList', data: { list: [{ language: 'ru', label: 'Russian' }] } }, 'Test', 'test');
      expect(mockPlayer.embed.captionTracks).toHaveLength(1);
    });

    it('should handle cue change', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:cueChange', data: { cues: ['Hello'] } }, 'Test', 'test');
      expect(mockPlayer.captions.updateCues).toHaveBeenCalledWith(['Hello']);
    });

    it('should handle error with provider name', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:error', data: { type: 'NOT_FOUND' } }, 'Test', 'test');
      expect(mockPlayer.media.error).toBeDefined();
    });

    it('should handle error without provider name', () => {
      mockPlayer.media.error = null;
      handleDefaultMessage.call(mockPlayer, { type: 'player:error', data: { type: 'NOT_FOUND' } }, 'Test');
      expect(mockPlayer.media.error).toBeDefined();
    });

    it('should handle playback speed changed', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:playbackSpeedChanged', data: { speed: 1.5 } }, 'Test', 'test');
      expect(mockPlayer.media.playbackRate).toBe(1.5);
    });

    it('should handle playComplete as ended', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:playComplete', data: {} }, 'Test', 'test');
      expect(mockPlayer.media.paused).toBe(true);
    });

    it('should log unknown events in debug mode', () => {
      mockPlayer.config.debug = true;
      handleDefaultMessage.call(mockPlayer, { type: 'player:unknown', data: {} }, 'Test', 'test');
      expect(mockPlayer.debug.log).toHaveBeenCalledWith('Test unknown event:', 'player:unknown', {});
    });

    it('should not log unknown events when debug is off', () => {
      mockPlayer.config.debug = false;
      handleDefaultMessage.call(mockPlayer, { type: 'player:unknown', data: {} }, 'Test', 'test');
      expect(mockPlayer.debug.log).not.toHaveBeenCalledWith('Test unknown event:', 'player:unknown', {});
    });

    it('should handle buffering state', () => {
      handleDefaultMessage.call(mockPlayer, { type: 'player:changeState', data: { state: 'buffering' } }, 'Test', 'test');
      expect(mockPlayer.media.paused).toBe(true);
    });
  });
});
