// ==========================================================================
// Plyr Analytics Plugin
// ==========================================================================

import { off, on } from '../utils/events';

const STORAGE_KEY = 'plyr_viewer_id';

class Analytics {
  constructor(player) {
    this.player = player;
    this.config = player.config.analytics || {};

    if (!this.config.enabled) {
      return;
    }

    // Session
    this.sessionId = this.config.sessionId || this._generateUUID();
    this.startedAt = Date.now();

    // Viewer ID (persistent across sessions)
    this.viewerId = this._getViewerId();

    // Source info
    this.source = player.source || '';
    this.provider = player.provider || '';

    // Engagement tracking
    this.playCount = 0;
    this.totalWatchTime = 0;
    this.maxCurrentTime = 0;
    this.replayCount = 0;
    this.watchSegments = [];
    this._currentSegment = null;
    this._lastTimeupdateTime = 0;
    this._firstPlayLatency = null;
    this._readyTime = Date.now();

    // Heatmap
    this._heatmapGranularity = this.config.heatmapGranularity || 5;
    this._heatmapBuckets = [];
    this._lastHeatmapBucket = -1;

    // Quality tracking
    this.qualityChanges = [];
    this._lastQuality = null;

    // Speed tracking
    this.speedChanges = [];
    this._lastSpeed = null;

    // Buffering
    this.bufferingEvents = 0;
    this.totalBufferingTime = 0;
    this._bufferingStart = null;

    // Errors
    this.errors = [];

    // Interaction counts
    this.fullscreenToggles = 0;
    this.volumeChanges = 0;
    this.controlHideShowCount = 0;

    // Event batch
    this._eventBatch = [];

    // Flush control
    this._flushInterval = null;

    this._bindListeners();
    this._startFlushInterval();
    this._bindUnloadHandler();
  }

  // ===========================
  // Event Handlers
  // ===========================

  _bindListeners() {
    const { player } = this;

    // Store bound handler references for cleanup in destroy()
    this._handlers = {
      ready: () => this._onReady(),
      play: () => this._onPlay(),
      pause: () => this._onPause(),
      ended: () => this._onEnded(),
      seeking: () => this._onSeeking(),
      seeked: () => this._onSeeked(),
      timeupdate: () => this._onTimeupdate(),
      qualitychange: e => this._onQualityChange(e),
      ratechange: e => this._onRateChange(e),
      volumechange: () => this._onVolumeChange(),
      waiting: () => this._onWaiting(),
      canplay: () => this._onCanPlay(),
      error: e => this._onError(e),
      enterfullscreen: () => this._onFullscreenEnter(),
      exitfullscreen: () => this._onFullscreenExit(),
      controlshidden: () => this._onControlsHidden(),
      controlsshown: () => this._onControlsShown(),
    };

    on.call(player, player.elements.container, 'ready', this._handlers.ready);
    on.call(player, player.elements.container, 'play', this._handlers.play);
    on.call(player, player.elements.container, 'pause', this._handlers.pause);
    on.call(player, player.elements.container, 'ended', this._handlers.ended);
    on.call(player, player.elements.container, 'seeking', this._handlers.seeking);
    on.call(player, player.elements.container, 'seeked', this._handlers.seeked);
    on.call(player, player.elements.container, 'timeupdate', this._handlers.timeupdate);
    on.call(player, player.elements.container, 'qualitychange', this._handlers.qualitychange);
    on.call(player, player.elements.container, 'ratechange', this._handlers.ratechange);
    on.call(player, player.elements.container, 'volumechange', this._handlers.volumechange);
    on.call(player, player.elements.container, 'waiting', this._handlers.waiting);
    on.call(player, player.elements.container, 'canplay', this._handlers.canplay);
    on.call(player, player.elements.container, 'error', this._handlers.error);
    on.call(player, player.elements.container, 'enterfullscreen', this._handlers.enterfullscreen);
    on.call(player, player.elements.container, 'exitfullscreen', this._handlers.exitfullscreen);
    on.call(player, player.elements.container, 'controlshidden', this._handlers.controlshidden);
    on.call(player, player.elements.container, 'controlsshown', this._handlers.controlsshown);
  }

  _onReady() {
    this._readyTime = Date.now();
    this._track('ready');

    // Initialize heatmap buckets based on duration
    const duration = this.player.duration || 0;
    if (duration > 0) {
      const bucketCount = Math.ceil(duration / this._heatmapGranularity);
      this._heatmapBuckets = Array.from({ length: bucketCount }, () => 0);
    }
  }

  _onPlay() {
    this.playCount++;

    // First play latency
    if (this._firstPlayLatency === null) {
      this._firstPlayLatency = Date.now() - this._readyTime;
    }

    // Track replay (returning near start)
    const currentTime = this.player.currentTime || 0;
    if (this.playCount > 1 && currentTime < this._heatmapGranularity) {
      this.replayCount++;
    }

    // Start watch segment
    this._currentSegment = { start: currentTime };

    this._track('play', { currentTime });
  }

  _onPause() {
    this._closeCurrentSegment();
    this._track('pause', { currentTime: this.player.currentTime });
  }

  _onEnded() {
    this._closeCurrentSegment();

    // Mark completion
    if (this.player.duration) {
      this.maxCurrentTime = Math.max(this.maxCurrentTime, this.player.duration);
    }

    this._track('ended');
  }

  _onSeeking() {
    // Close current segment at seek-from position
    if (this._currentSegment) {
      this._currentSegment.end = this.player.currentTime;
    }
    this._track('seeking', { from: this.player.currentTime });
  }

  _onSeeked() {
    // Start new segment at seek-to position if playing
    if (this.player.playing) {
      this._currentSegment = { start: this.player.currentTime };
    }
    this._track('seeked', { to: this.player.currentTime });
  }

  _onTimeupdate() {
    const currentTime = this.player.currentTime || 0;
    const now = Date.now();

    // Throttle to avoid excessive tracking
    if (now - this._lastTimeupdateTime < 1000) {
      return;
    }
    this._lastTimeupdateTime = now;

    // Track max position
    this.maxCurrentTime = Math.max(this.maxCurrentTime, currentTime);

    // Update heatmap
    this._updateHeatmap(currentTime);

    // Track watch time for current segment
    if (this._currentSegment) {
      this._currentSegment.end = currentTime;
    }
  }

  _onQualityChange(event) {
    const detail = event.detail || {};
    const newQuality = detail.quality || this.player.quality;
    const oldQuality = this._lastQuality;

    if (oldQuality !== null && oldQuality !== newQuality) {
      this.qualityChanges.push({
        from: oldQuality,
        to: newQuality,
        at: this.player.currentTime,
      });
      this._track('qualitychange', { from: oldQuality, to: newQuality });
    }

    this._lastQuality = newQuality;
  }

  _onRateChange(event) {
    const detail = event.detail || {};
    const newSpeed = detail.speed || this.player.speed;
    const oldSpeed = this._lastSpeed;

    if (oldSpeed !== null && oldSpeed !== newSpeed) {
      this.speedChanges.push({
        from: oldSpeed,
        to: newSpeed,
        at: this.player.currentTime,
      });
      this._track('ratechange', { from: oldSpeed, to: newSpeed });
    }

    this._lastSpeed = newSpeed;
  }

  _onVolumeChange() {
    this.volumeChanges++;
    this._track('volumechange', {
      volume: this.player.volume,
      muted: this.player.muted,
    });
  }

  _onWaiting() {
    this.bufferingEvents++;
    this._bufferingStart = Date.now();
    this._track('waiting');
  }

  _onCanPlay() {
    if (this._bufferingStart) {
      this.totalBufferingTime += (Date.now() - this._bufferingStart) / 1000;
      this._bufferingStart = null;
    }
    this._track('canplay');
  }

  _onError(event) {
    const detail = event.detail || {};
    this.errors.push({
      code: detail.code || 'unknown',
      at: this.player.currentTime,
      message: detail.message || '',
    });
    this._track('error', { code: detail.code, message: detail.message });
  }

  _onFullscreenEnter() {
    this.fullscreenToggles++;
    this._track('enterfullscreen');
  }

  _onFullscreenExit() {
    this.fullscreenToggles++;
    this._track('exitfullscreen');
  }

  _onControlsHidden() {
    this.controlHideShowCount++;
    this._track('controlshidden');
  }

  _onControlsShown() {
    this.controlHideShowCount++;
    this._track('controlsshown');
  }

  // ===========================
  // Heatmap
  // ===========================

  _updateHeatmap(currentTime) {
    const bucketIndex = Math.floor(currentTime / this._heatmapGranularity);

    // Skip if already counted this bucket (avoid double-counting on same second)
    if (bucketIndex === this._lastHeatmapBucket) {
      return;
    }

    if (bucketIndex >= 0 && bucketIndex < this._heatmapBuckets.length) {
      this._heatmapBuckets[bucketIndex]++;
      this._lastHeatmapBucket = bucketIndex;
    }
  }

  // ===========================
  // Watch Segments
  // ===========================

  _closeCurrentSegment() {
    if (this._currentSegment) {
      const segment = this._currentSegment;
      if (!segment.end) {
        segment.end = this.player.currentTime || 0;
      }

      // Only keep segments with positive duration
      if (segment.end > segment.start) {
        // Calculate total watch time
        this.totalWatchTime += segment.end - segment.start;

        // Merge overlapping segments
        this._mergeSegment(segment);
      }

      this._currentSegment = null;
    }
  }

  _mergeSegment(newSegment) {
    if (this.watchSegments.length === 0) {
      this.watchSegments.push({ ...newSegment });
      return;
    }

    const last = this.watchSegments[this.watchSegments.length - 1];

    // Merge if overlapping or adjacent (within 2 seconds)
    if (newSegment.start <= last.end + 2) {
      last.end = Math.max(last.end, newSegment.end);
    }
    else {
      this.watchSegments.push({ ...newSegment });
    }
  }

  // ===========================
  // Event Batching & Flushing
  // ===========================

  _track(type, detail = {}) {
    const event = {
      type,
      timestamp: Date.now(),
      detail,
    };

    this._eventBatch.push(event);

    // Auto-flush if batch is full
    const batchSize = this.config.batchSize || 10;
    if (this._eventBatch.length >= batchSize) {
      this._flush();
    }
  }

  _flush() {
    if (this._eventBatch.length === 0) {
      return;
    }

    const data = this.getData();
    const events = this._eventBatch.splice(0);

    if (this.config.endpoint) {
      this._sendToEndpoint(events);
    }

    return data;
  }

  _sendToEndpoint(events) {
    if (!this.config.endpoint) {
      return;
    }

    const payload = {
      sessionId: this.sessionId,
      viewerId: this.viewerId,
      source: this.source,
      provider: this.provider,
      events,
    };

    // Use fetch for non-critical batch sends
    if (typeof fetch === 'function') {
      fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Silently fail — analytics shouldn't break the player
      });
    }
  }

  _sendViaBeacon(data) {
    if (!this.config.endpoint || !navigator.sendBeacon) {
      return;
    }

    const payload = JSON.stringify({
      sessionId: this.sessionId,
      viewerId: this.viewerId,
      source: this.source,
      provider: this.provider,
      data,
    });

    navigator.sendBeacon(this.config.endpoint, payload);
  }

  _startFlushInterval() {
    const interval = this.config.flushInterval || 30000;

    if (interval > 0) {
      this._flushInterval = setInterval(() => this._flush(), interval);
    }
  }

  _bindUnloadHandler() {
    if (!this.config.sendBeacon) {
      return;
    }

    this._unloadHandler = () => {
      this._closeCurrentSegment();
      const data = this.getData();
      this._sendViaBeacon(data);
    };

    window.addEventListener('beforeunload', this._unloadHandler);
    window.addEventListener('pagehide', this._unloadHandler);
  }

  // ===========================
  // Public API
  // ===========================

  /**
   * Get all collected analytics data
   * @returns {object} Complete analytics data
   */
  getData() {
    const duration = this.player.duration || 0;

    return {
      // Session info
      sessionId: this.sessionId,
      viewerId: this.viewerId,
      source: this.source,
      provider: this.provider,
      startedAt: this.startedAt,

      // Views
      playCount: this.playCount,
      firstPlayLatency: this._firstPlayLatency,

      // Engagement
      totalWatchTime: Math.round(this.totalWatchTime * 100) / 100,
      averageWatchTime: this.playCount > 0
        ? Math.round((this.totalWatchTime / this.playCount) * 100) / 100
        : 0,
      completionRate: duration > 0
        ? Math.round((this.maxCurrentTime / duration) * 100) / 100
        : 0,
      replayCount: this.replayCount,
      watchSegments: this.watchSegments.map(s => ({ ...s })),

      // Heatmap
      heatmap: {
        granularity: this._heatmapGranularity,
        buckets: [...this._heatmapBuckets],
      },

      // Quality
      qualityChanges: [...this.qualityChanges],

      // Buffering
      bufferingEvents: this.bufferingEvents,
      totalBufferingTime: Math.round(this.totalBufferingTime * 100) / 100,

      // Errors
      errors: [...this.errors],

      // Interactions
      fullscreenToggles: this.fullscreenToggles,
      volumeChanges: this.volumeChanges,
      speedChanges: [...this.speedChanges],
      controlHideShowCount: this.controlHideShowCount,
    };
  }

  /**
   * Reset collected data (keeps listeners active)
   */
  reset() {
    this.playCount = 0;
    this.totalWatchTime = 0;
    this.maxCurrentTime = 0;
    this.replayCount = 0;
    this.watchSegments = [];
    this._currentSegment = null;
    this._firstPlayLatency = null;
    this.qualityChanges = [];
    this.speedChanges = [];
    this.bufferingEvents = 0;
    this.totalBufferingTime = 0;
    this._bufferingStart = null;
    this.errors = [];
    this.fullscreenToggles = 0;
    this.volumeChanges = 0;
    this.controlHideShowCount = 0;
    this._eventBatch = [];
    this._lastHeatmapBucket = -1;

    // Reinitialize heatmap buckets
    const duration = this.player.duration || 0;
    if (duration > 0) {
      const bucketCount = Math.ceil(duration / this._heatmapGranularity);
      this._heatmapBuckets = Array.from({ length: bucketCount }, () => 0);
    }
  }

  /**
   * Destroy analytics instance and clean up
   */
  destroy() {
    // Close any open segment
    this._closeCurrentSegment();

    // Final flush
    this._flush();

    // Clear interval
    if (this._flushInterval) {
      clearInterval(this._flushInterval);
      this._flushInterval = null;
    }

    // Remove unload handlers
    if (this._unloadHandler) {
      window.removeEventListener('beforeunload', this._unloadHandler);
      window.removeEventListener('pagehide', this._unloadHandler);
      this._unloadHandler = null;
    }

    // Remove all bound event listeners
    if (this._handlers && this.player) {
      const { player } = this;
      off.call(player, player.elements.container, 'ready', this._handlers.ready);
      off.call(player, player.elements.container, 'play', this._handlers.play);
      off.call(player, player.elements.container, 'pause', this._handlers.pause);
      off.call(player, player.elements.container, 'ended', this._handlers.ended);
      off.call(player, player.elements.container, 'seeking', this._handlers.seeking);
      off.call(player, player.elements.container, 'seeked', this._handlers.seeked);
      off.call(player, player.elements.container, 'timeupdate', this._handlers.timeupdate);
      off.call(player, player.elements.container, 'qualitychange', this._handlers.qualitychange);
      off.call(player, player.elements.container, 'ratechange', this._handlers.ratechange);
      off.call(player, player.elements.container, 'volumechange', this._handlers.volumechange);
      off.call(player, player.elements.container, 'waiting', this._handlers.waiting);
      off.call(player, player.elements.container, 'canplay', this._handlers.canplay);
      off.call(player, player.elements.container, 'error', this._handlers.error);
      off.call(player, player.elements.container, 'enterfullscreen', this._handlers.enterfullscreen);
      off.call(player, player.elements.container, 'exitfullscreen', this._handlers.exitfullscreen);
      off.call(player, player.elements.container, 'controlshidden', this._handlers.controlshidden);
      off.call(player, player.elements.container, 'controlsshown', this._handlers.controlsshown);
    }

    // Clear references
    this.player = null;
    this.config = null;
    this._eventBatch = [];
    this.watchSegments = [];
    this.qualityChanges = [];
    this.speedChanges = [];
    this.errors = [];
    this._heatmapBuckets = [];
    this._handlers = null;
  }

  // ===========================
  // Helpers
  // ===========================

  _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  _getViewerId() {
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = this._generateUUID();
        localStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    }
    catch {
      // localStorage not available
      return this._generateUUID();
    }
  }
}

export default Analytics;
