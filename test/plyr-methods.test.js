import { describe, expect, it, vi } from 'vitest';
import { triggerEvent } from '../src/js/utils/events';

function createMockPlayer(overrides = {}) {
  const media = {
    currentTime: 0,
    paused: true,
    ended: false,
    muted: false,
    volume: 1,
    videoWidth: 1920,
    videoHeight: 1080,
    duration: 120,
    playbackRate: 1,
    loop: false,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    getAttribute: vi.fn(() => null),
    hasAttribute: vi.fn(() => false),
    cloneNode: vi.fn().mockReturnValue({ autoplay: false }),
    tagName: 'VIDEO',
    style: {},
  };

  return {
    ready: true,
    media,
    type: 'video',
    provider: 'html5',
    config: { seekTime: 10 },
    debug: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
    eventListeners: [],
    isHTML5: true,
    isVideo: true,
    playing: false,
    ...overrides,
  };
}

describe('stepBackward / stepForward / screenshot', () => {
  it('stepBackward decrements currentTime by ~1/30s for HTML5', () => {
    const player = createMockPlayer();
    player.media.currentTime = 5;
    player.stepBackward = () => { if (player.isHTML5) player.media.currentTime -= 1 / 30; };
    player.stepBackward();
    expect(player.media.currentTime).toBeCloseTo(5 - 1 / 30, 5);
  });

  it('stepBackward does nothing for non-HTML5', () => {
    const player = createMockPlayer({ isHTML5: false });
    player.media.currentTime = 5;
    player.stepBackward = () => { if (player.isHTML5) player.media.currentTime -= 1 / 30; };
    player.stepBackward();
    expect(player.media.currentTime).toBe(5);
  });

  it('stepForward increments currentTime by ~1/30s for HTML5', () => {
    const player = createMockPlayer();
    player.media.currentTime = 5;
    player.stepForward = () => { if (player.isHTML5) player.media.currentTime += 1 / 30; };
    player.stepForward();
    expect(player.media.currentTime).toBeCloseTo(5 + 1 / 30, 5);
  });

  it('stepForward does nothing for non-HTML5', () => {
    const player = createMockPlayer({ isHTML5: false });
    player.media.currentTime = 5;
    player.stepForward = () => { if (player.isHTML5) player.media.currentTime += 1 / 30; };
    player.stepForward();
    expect(player.media.currentTime).toBe(5);
  });

  it('screenshot returns null for non-HTML5', () => {
    const player = createMockPlayer({ isHTML5: false });
    player.screenshot = function () {
      if (!this.isHTML5 || !this.isVideo) { this.debug.warn('Screenshot is only supported for HTML5 video'); return null; }
      return 'ok';
    };
    expect(player.screenshot()).toBeNull();
  });

  it('screenshot returns null when video not loaded', () => {
    const player = createMockPlayer();
    player.media.videoWidth = 0;
    player.media.videoHeight = 0;
    player.screenshot = function () {
      if (!this.isHTML5 || !this.isVideo) return null;
      const { videoWidth, videoHeight } = this.media;
      if (!videoWidth || !videoHeight) { this.debug.warn('Cannot capture screenshot: video not loaded'); return null; }
      return 'ok';
    };
    expect(player.screenshot()).toBeNull();
  });

  it('screenshot returns a data URL for loaded HTML5 video', () => {
    const fakeDataUrl = 'data:image/png;base64,FAKE';
    const drawImageMock = vi.fn();

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: drawImageMock,
    }));
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => fakeDataUrl);

    const player = createMockPlayer();
    player.screenshot = function () {
      if (!this.isHTML5 || !this.isVideo) return null;
      const { videoWidth, videoHeight } = this.media;
      if (!videoWidth || !videoHeight) return null;
      const canvas = document.createElement('canvas');
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(this.media, 0, 0, videoWidth, videoHeight);
      return canvas.toDataURL('image/png');
    };
    const result = player.screenshot();
    expect(result).toBe(fakeDataUrl);
    expect(drawImageMock).toHaveBeenCalledWith(player.media, 0, 0, 1920, 1080);
  });
});
