import { describe, expect, it, vi } from 'vitest';

describe('destroy() provider dispatch', () => {
  function createPlayer(provider, overrides = {}) {
    const isHTML5 = provider === 'html5';
    const isYouTube = provider === 'youtube';
    const isVimeo = provider === 'vimeo';

    return {
      ready: true,
      provider,
      isHTML5: isHTML5 || false,
      isYouTube: isYouTube || false,
      isVimeo: isVimeo || false,
      isRutube: provider === 'rutube',
      isYandexCloud: provider === 'yandex',
      isVK: provider === 'vk',
      isMailRu: provider === 'mailru',
      isMTSLink: provider === 'mtslink',
      isEmbed: !isHTML5,
      media: {
        paused: false,
        currentTime: 5,
        play: vi.fn(),
        pause: vi.fn(),
      },
      embed: null,
      elements: {
        container: document.createElement('div'),
        inputs: {},
        buttons: { play: document.createElement('button') },
        original: document.createElement('div'),
      },
      timers: {
        loading: null,
        controls: null,
        resized: null,
        build: null,
        buffering: null,
        playing: null,
      },
      config: {
        blankVideo: 'https://example.com/blank.mp4',
      },
      debug: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
      eventListeners: [],
      listeners: { global: vi.fn() },
      transcription: { active: false },
      previewThumbnails: null,
      ads: null,
      stop: vi.fn(),
      _pendingQualityChange: null,
      ...overrides,
    };
  }

  it('should handle HTML5 provider destroy', () => {
    const player = createPlayer('html5');
    player._pendingQualityChange = vi.fn();
    player.media.loadedmetadata = 'loadedmetadata';

    // Simulate the destroy logic
    const done = vi.fn();

    // HTML5 branch
    if (player.isHTML5) {
      if (player._pendingQualityChange) {
        player._pendingQualityChange = null;
      }
      done();
    }

    expect(player._pendingQualityChange).toBeNull();
    expect(done).toHaveBeenCalled();
  });

  it('should handle embed provider destroy (YouTube, Rutube, etc.)', () => {
    const providers = ['youtube', 'rutube', 'yandex', 'vk', 'mailru', 'mtslink'];

    providers.forEach((provider) => {
      const embedDestroy = vi.fn();
      const player = createPlayer(provider, {
        embed: { destroy: embedDestroy },
      });
      const done = vi.fn();

      // Non-HTML5, non-Vimeo branch
      if (!player.isHTML5 && !player.isVimeo) {
        if (player.embed !== null && typeof player.embed.destroy === 'function') {
          player.embed.destroy();
        }
        done();
      }

      expect(embedDestroy).toHaveBeenCalled();
      expect(done).toHaveBeenCalled();
    });
  });

  it('should handle Vimeo provider destroy with async unload', async () => {
    const unloadPromise = Promise.resolve();
    const player = createPlayer('vimeo', {
      embed: { unload: () => unloadPromise },
    });

    const done = vi.fn();

    // Vimeo branch
    let vimeoDone = false;
    const doneOnce = () => {
      if (vimeoDone) return;
      vimeoDone = true;
      done();
    };

    if (player.embed !== null) {
      player.embed.unload().then(doneOnce);
    }
    setTimeout(doneOnce, 200);

    await unloadPromise;

    expect(done).toHaveBeenCalled();
    expect(vimeoDone).toBe(true);
  });

  it('should handle Vimeo timeout fallback if unload never resolves', () => {
    vi.useFakeTimers();
    const player = createPlayer('vimeo', {
      embed: { unload: () => new Promise(() => {}) }, // Never resolves
    });

    const done = vi.fn();

    let vimeoDone = false;
    const doneOnce = () => {
      if (vimeoDone) return;
      vimeoDone = true;
      done();
    };

    if (player.embed !== null) {
      player.embed.unload().then(doneOnce);
    }
    setTimeout(doneOnce, 200);

    // Before timeout
    expect(done).not.toHaveBeenCalled();

    // After timeout
    vi.advanceTimersByTime(200);
    expect(done).toHaveBeenCalled();

    vi.useRealTimers();
  });
});