import { beforeEach, describe, expect, it, vi } from 'vitest';
import Analytics from '../../src/js/plugins/analytics';

function createMockPlayer(config = {}) {
  const player = {
    config: {
      analytics: {
        enabled: true,
        endpoint: '',
        sessionId: null,
        batchSize: 10,
        flushInterval: 30000,
        sendBeacon: true,
        heatmapGranularity: 5,
        ...config.analytics,
      },
      classNames: {
        darkMode: { enabled: 'plyr--dark-mode' },
      },
      selectors: {
        buttons: { darkMode: '[data-plyr="dark-mode"]' },
      },
    },
    source: 'https://example.com/video.mp4',
    provider: 'html5',
    duration: 120,
    currentTime: 0,
    playing: false,
    quality: 720,
    speed: 1,
    volume: 0.8,
    muted: false,
    elements: {
      container: document.createElement('div'),
    },
    storage: {
      get: vi.fn(),
      set: vi.fn(),
    },
    ...config.player,
  };

  player.elements.container.addEventListener = vi.fn();
  player.elements.container.removeEventListener = vi.fn();

  return player;
}

describe('Analytics', () => {
  describe('constructor', () => {
    it('should return early when analytics is disabled', () => {
      const player = createMockPlayer({ analytics: { enabled: false } });
      const analytics = new Analytics(player);
      expect(analytics.config).toBeDefined();
    });

    it('should initialize when analytics is enabled', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      expect(analytics.playCount).toBe(0);
      expect(analytics.sessionId).toBeDefined();
      expect(analytics.viewerId).toBeDefined();
      expect(analytics.source).toBe('https://example.com/video.mp4');
      expect(analytics.provider).toBe('html5');
    });

    it('should bind event listeners', () => {
      const player = createMockPlayer();
      const addEventListener = vi.spyOn(player.elements.container, 'addEventListener');
      new Analytics(player);
      expect(addEventListener).toHaveBeenCalledTimes(17);
    });

    it('should use provided sessionId', () => {
      const player = createMockPlayer({ analytics: { sessionId: 'test-session' } });
      const analytics = new Analytics(player);
      expect(analytics.sessionId).toBe('test-session');
    });
  });

  describe('_onPlay', () => {
    it('should increment playCount', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onPlay();
      expect(analytics.playCount).toBe(1);
    });

    it('should record first play latency', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._readyTime = Date.now() - 500;
      analytics._onPlay();
      expect(analytics._firstPlayLatency).toBeGreaterThanOrEqual(500);
    });

    it('should not overwrite firstPlayLatency on subsequent plays', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._readyTime = Date.now() - 500;
      analytics._onPlay();
      const latency = analytics._firstPlayLatency;
      analytics._onPlay();
      expect(analytics._firstPlayLatency).toBe(latency);
    });

    it('should start a watch segment', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onPlay();
      expect(analytics._currentSegment).toBeDefined();
      expect(analytics._currentSegment.start).toBe(0);
    });

    it('should track replay when returning near start', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics.playCount = 1;
      analytics._heatmapGranularity = 5;
      analytics._onPlay();
      expect(analytics.replayCount).toBe(1);
    });

    it('should not track replay after first play', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onPlay();
      expect(analytics.replayCount).toBe(0);
    });
  });

  describe('_onPause', () => {
    it('should close current segment', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._currentSegment = { start: 0 };
      player.currentTime = 50;
      analytics._onPause();
      expect(analytics._currentSegment).toBeNull();
    });
  });

  describe('_onEnded', () => {
    it('should close segment and set maxCurrentTime to duration', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._currentSegment = { start: 0 };
      player.currentTime = 120;
      analytics._onEnded();
      expect(analytics._currentSegment).toBeNull();
      expect(analytics.maxCurrentTime).toBe(120);
    });
  });

  describe('_onTimeupdate', () => {
    it('should update maxCurrentTime', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._lastTimeupdateTime = 0;
      player.currentTime = 30;
      analytics._onTimeupdate();
      expect(analytics.maxCurrentTime).toBe(30);
    });

    it('should throttle updates within 1 second', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      const now = Date.now();
      analytics._lastTimeupdateTime = now;
      analytics.maxCurrentTime = 0;
      player.currentTime = 50;
      analytics._onTimeupdate();
      expect(analytics.maxCurrentTime).toBe(0);
    });

    it('should update heatmap', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._heatmapBuckets = [0, 0, 0];
      analytics._heatmapGranularity = 5;
      analytics._lastTimeupdateTime = 0;
      player.currentTime = 6;
      analytics._onTimeupdate();
      expect(analytics._heatmapBuckets[1]).toBe(1);
    });

    it('should update current segment end time', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._currentSegment = { start: 0 };
      analytics._lastTimeupdateTime = 0;
      player.currentTime = 25;
      analytics._onTimeupdate();
      expect(analytics._currentSegment.end).toBe(25);
    });
  });

  describe('_onSeeking / _onSeeked', () => {
    it('should close current segment on seek', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._currentSegment = { start: 0 };
      player.currentTime = 30;
      analytics._onSeeking();
      expect(analytics._currentSegment.end).toBe(30);
    });

    it('should start new segment on seeked if playing', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      player.playing = true;
      player.currentTime = 45;
      analytics._onSeeked();
      expect(analytics._currentSegment).toBeDefined();
      expect(analytics._currentSegment.start).toBe(45);
    });

    it('should not start new segment on seeked if paused', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      player.playing = false;
      analytics._currentSegment = null;
      analytics._onSeeked();
      expect(analytics._currentSegment).toBeNull();
    });
  });

  describe('_onQualityChange', () => {
    it('should track quality change', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._lastQuality = 480;
      analytics._onQualityChange({ detail: { quality: 720 } });
      expect(analytics.qualityChanges).toHaveLength(1);
      expect(analytics.qualityChanges[0].from).toBe(480);
      expect(analytics.qualityChanges[0].to).toBe(720);
    });

    it('should not track initial quality', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onQualityChange({ detail: { quality: 720 } });
      expect(analytics.qualityChanges).toHaveLength(0);
      expect(analytics._lastQuality).toBe(720);
    });

    it('should not track duplicate quality', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._lastQuality = 720;
      analytics._onQualityChange({ detail: { quality: 720 } });
      expect(analytics.qualityChanges).toHaveLength(0);
    });
  });

  describe('_onRateChange', () => {
    it('should track speed change', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._lastSpeed = 1;
      analytics._onRateChange({ detail: { speed: 1.5 } });
      expect(analytics.speedChanges).toHaveLength(1);
      expect(analytics.speedChanges[0].from).toBe(1);
      expect(analytics.speedChanges[0].to).toBe(1.5);
    });

    it('should not track initial speed', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onRateChange({ detail: { speed: 1 } });
      expect(analytics.speedChanges).toHaveLength(0);
    });

    it('should not track duplicate speed', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._lastSpeed = 1;
      analytics._onRateChange({ detail: { speed: 1 } });
      expect(analytics.speedChanges).toHaveLength(0);
    });
  });

  describe('_onVolumeChange', () => {
    it('should increment volumeChanges counter', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onVolumeChange();
      expect(analytics.volumeChanges).toBe(1);
    });
  });

  describe('buffering tracking', () => {
    it('should count buffering events', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onWaiting();
      expect(analytics.bufferingEvents).toBe(1);
      expect(analytics._bufferingStart).toBeDefined();
    });

    it('should track buffering duration', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._bufferingStart = Date.now() - 2000;
      analytics._onCanPlay();
      expect(analytics.totalBufferingTime).toBeGreaterThanOrEqual(1.9);
      expect(analytics._bufferingStart).toBeNull();
    });

    it('should do nothing on canplay when not buffering', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._bufferingStart = null;
      analytics._onCanPlay();
      expect(analytics.totalBufferingTime).toBe(0);
    });
  });

  describe('_onError', () => {
    it('should record error', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onError({ detail: { code: 'MEDIA_NOT_FOUND', message: 'Video not found' } });
      expect(analytics.errors).toHaveLength(1);
      expect(analytics.errors[0].code).toBe('MEDIA_NOT_FOUND');
      expect(analytics.errors[0].message).toBe('Video not found');
    });

    it('should handle error without detail', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onError({});
      expect(analytics.errors).toHaveLength(1);
      expect(analytics.errors[0].code).toBe('unknown');
    });
  });

  describe('fullscreen tracking', () => {
    it('should increment on enter', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onFullscreenEnter();
      expect(analytics.fullscreenToggles).toBe(1);
    });

    it('should increment on exit', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onFullscreenExit();
      expect(analytics.fullscreenToggles).toBe(1);
    });
  });

  describe('controls tracking', () => {
    it('should count control hide', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onControlsHidden();
      expect(analytics.controlHideShowCount).toBe(1);
    });

    it('should count control show', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._onControlsShown();
      expect(analytics.controlHideShowCount).toBe(1);
    });
  });

  describe('heatmap', () => {
    it('should update heatmap buckets', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._heatmapBuckets = [0, 0, 0, 0, 0];
      analytics._heatmapGranularity = 5;
      analytics._lastHeatmapBucket = -1;
      analytics._updateHeatmap(7);
      expect(analytics._heatmapBuckets[1]).toBe(1);
      expect(analytics._lastHeatmapBucket).toBe(1);
    });

    it('should skip already-counted bucket', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._heatmapBuckets = [0, 0];
      analytics._lastHeatmapBucket = 1;
      analytics._updateHeatmap(7);
      expect(analytics._heatmapBuckets[1]).toBe(0);
    });

    it('should ignore negative bucket index', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._heatmapBuckets = [0, 0];
      analytics._lastHeatmapBucket = -1;
      analytics._updateHeatmap(-1);
      expect(analytics._heatmapBuckets[0]).toBe(0);
    });

    it('should ignore out-of-bounds bucket index', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._heatmapBuckets = [0, 0];
      analytics._lastHeatmapBucket = -1;
      analytics._updateHeatmap(100);
      expect(analytics._heatmapBuckets[1]).toBe(0);
    });
  });

  describe('watch segments', () => {
    it('should merge overlapping segments', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics.watchSegments = [{ start: 0, end: 30 }];
      analytics._mergeSegment({ start: 28, end: 60 });
      expect(analytics.watchSegments).toHaveLength(1);
      expect(analytics.watchSegments[0].end).toBe(60);
    });

    it('should merge adjacent segments within 2 seconds', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics.watchSegments = [{ start: 0, end: 30 }];
      analytics._mergeSegment({ start: 31, end: 60 });
      expect(analytics.watchSegments).toHaveLength(1);
      expect(analytics.watchSegments[0].end).toBe(60);
    });

    it('should not merge distant segments', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics.watchSegments = [{ start: 0, end: 30 }];
      analytics._mergeSegment({ start: 60, end: 90 });
      expect(analytics.watchSegments).toHaveLength(2);
    });

    it('should add first segment directly', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._mergeSegment({ start: 0, end: 30 });
      expect(analytics.watchSegments).toHaveLength(1);
      expect(analytics.watchSegments[0].start).toBe(0);
      expect(analytics.watchSegments[0].end).toBe(30);
    });
  });

  describe('getData', () => {
    it('should return complete analytics data', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics.playCount = 3;
      analytics.totalWatchTime = 150;
      analytics.maxCurrentTime = 100;
      analytics.replayCount = 1;
      const data = analytics.getData();
      expect(data.playCount).toBe(3);
      expect(data.totalWatchTime).toBe(150);
      expect(data.averageWatchTime).toBe(50);
      expect(data.completionRate).toBeCloseTo(0.83, 1);
      expect(data.replayCount).toBe(1);
      expect(data.sessionId).toBeDefined();
      expect(data.viewerId).toBeDefined();
      expect(data.heatmap).toBeDefined();
      expect(data.qualityChanges).toEqual([]);
      expect(data.errors).toEqual([]);
    });

    it('should handle zero duration', () => {
      const player = createMockPlayer();
      player.duration = 0;
      const analytics = new Analytics(player);
      const data = analytics.getData();
      expect(data.completionRate).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset all collected data', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics.playCount = 5;
      analytics.totalWatchTime = 300;
      analytics._firstPlayLatency = 1000;
      analytics.reset();
      expect(analytics.playCount).toBe(0);
      expect(analytics.totalWatchTime).toBe(0);
      expect(analytics._firstPlayLatency).toBeNull();
    });

    it('should reinitialize heatmap buckets', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._heatmapBuckets = [1, 2, 3];
      analytics.reset();
      expect(analytics._heatmapBuckets.length).toBeGreaterThan(0);
      expect(analytics._heatmapBuckets.every(b => b === 0)).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._closeCurrentSegment = vi.fn();
      analytics._flush = vi.fn();
      analytics._flushInterval = setInterval(() => {}, 1000);
      analytics._unloadHandler = () => {};
      vi.spyOn(window, 'removeEventListener');

      analytics.destroy();

      expect(analytics._closeCurrentSegment).toHaveBeenCalled();
      expect(analytics._flush).toHaveBeenCalled();
      expect(analytics.player).toBeNull();
      expect(analytics.config).toBeNull();
      expect(analytics._eventBatch).toEqual([]);
    });
  });

  describe('_flush', () => {
    it('should do nothing when batch is empty', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._eventBatch = [];
      const result = analytics._flush();
      expect(result).toBeUndefined();
    });

    it('should drain event batch and return data', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      analytics._track('play');
      analytics._track('pause');
      expect(analytics._eventBatch).toHaveLength(2);
      const result = analytics._flush();
      expect(analytics._eventBatch).toHaveLength(0);
      expect(result).toBeDefined();
      expect(result.playCount).toBeDefined();
    });

    it('should auto-flush when batch is full', () => {
      const player = createMockPlayer({ analytics: { batchSize: 3 } });
      const analytics = new Analytics(player);
      analytics._flush = vi.fn();
      analytics._track('play');
      analytics._track('pause');
      analytics._track('seeked');
      expect(analytics._flush).toHaveBeenCalledTimes(1);
    });
  });

  describe('_sendToEndpoint', () => {
    it('should do nothing without endpoint', () => {
      const player = createMockPlayer({ analytics: { endpoint: '' } });
      const analytics = new Analytics(player);
      global.fetch = vi.fn();
      analytics._sendToEndpoint([{ type: 'play' }]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should POST events to endpoint', () => {
      const player = createMockPlayer({ analytics: { endpoint: 'https://api.example.com/analytics' } });
      const analytics = new Analytics(player);
      global.fetch = vi.fn(() => Promise.resolve());
      analytics._sendToEndpoint([{ type: 'play' }]);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/analytics',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
          keepalive: true,
        }),
      );
    });

    it('should silently fail on fetch error', () => {
      const player = createMockPlayer({ analytics: { endpoint: 'https://api.example.com/analytics' } });
      const analytics = new Analytics(player);
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      expect(() => {
        analytics._sendToEndpoint([{ type: 'play' }]);
      }).not.toThrow();
    });
  });

  describe('_sendViaBeacon', () => {
    it('should do nothing without endpoint', () => {
      const player = createMockPlayer({ analytics: { endpoint: '' } });
      const analytics = new Analytics(player);
      navigator.sendBeacon = vi.fn();
      analytics._sendViaBeacon({});
      expect(navigator.sendBeacon).not.toHaveBeenCalled();
    });

    it('should use sendBeacon', () => {
      const player = createMockPlayer({ analytics: { endpoint: 'https://api.example.com/analytics' } });
      const analytics = new Analytics(player);
      navigator.sendBeacon = vi.fn();
      analytics._sendViaBeacon({ playCount: 1 });
      expect(navigator.sendBeacon).toHaveBeenCalled();
    });
  });

  describe('_generateUUID', () => {
    it('should generate a valid UUID format', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      const uuid = analytics._generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });
  });

  describe('_getViewerId', () => {
    it('should create and store a new viewer ID', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      localStorage.clear();
      const id = analytics._getViewerId();
      expect(id).toBeDefined();
      expect(localStorage.getItem('plyr_viewer_id')).toBe(id);
    });

    it('should return existing viewer ID', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      localStorage.setItem('plyr_viewer_id', 'existing-id');
      const id = analytics._getViewerId();
      expect(id).toBe('existing-id');
    });

    it('should handle localStorage unavailable', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      const id = analytics._getViewerId();
      expect(id).toBeDefined();
      getItem.mockRestore();
    });
  });

  describe('_onReady', () => {
    it('should initialize heatmap buckets based on duration', () => {
      const player = createMockPlayer();
      const analytics = new Analytics(player);
      player.duration = 120;
      analytics._heatmapGranularity = 5;
      analytics._onReady();
      expect(analytics._heatmapBuckets.length).toBe(24);
    });

    it('should handle zero duration gracefully', () => {
      const player = createMockPlayer();
      player.duration = 0;
      const analytics = new Analytics(player);
      analytics._onReady();
      expect(analytics._heatmapBuckets).toEqual([]);
    });
  });
});
