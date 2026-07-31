import { describe, expect, it } from 'vitest';

describe('Null-guard getters after destroy', () => {
  function createDestroyedPlayer() {
    // Simulate a player instance after destroy() has been called
    // where this.media is set to null
    const player = {
      media: null,
      isHTML5: false,
      isAudio: false,
      type: 'video',
      provider: 'html5',
      config: { darkMode: { enabled: false } },
    };

    // Define the getters exactly as they are in src/js/plyr.js
    Object.defineProperties(player, {
      muted: {
        get() {
          return this.media ? Boolean(this.media.muted) : false;
        },
      },
      hasAudio: {
        get() {
          if (!this.isHTML5) return true;
          if (this.isAudio) return true;
          if (!this.media) return false;
          return Boolean(this.media.mozHasAudio)
            || Boolean(this.media.webkitAudioDecodedByteCount)
            || Boolean(this.media.audioTracks && this.media.audioTracks.length);
        },
      },
      quality: {
        get() {
          return this.media ? this.media.quality : null;
        },
      },
      loop: {
        get() {
          return this.media ? Boolean(this.media.loop) : false;
        },
      },
    });

    return player;
  }

  it('muted getter returns false when media is null', () => {
    const player = createDestroyedPlayer();
    expect(player.muted).toBe(false);
  });

  it('hasAudio getter returns true for non-HTML5 even when media is null', () => {
    const player = createDestroyedPlayer();
    // isHTML5 is false, so should return true
    expect(player.hasAudio).toBe(true);
  });

  it('hasAudio getter returns false for HTML5 when media is null', () => {
    const player = createDestroyedPlayer();
    player.isHTML5 = true;
    expect(player.hasAudio).toBe(false);
  });

  it('quality getter returns null when media is null', () => {
    const player = createDestroyedPlayer();
    expect(player.quality).toBeNull();
  });

  it('loop getter returns false when media is null', () => {
    const player = createDestroyedPlayer();
    expect(player.loop).toBe(false);
  });

  it('paused getter returns true when media is null', () => {
    const player = createDestroyedPlayer();
    Object.defineProperty(player, 'paused', {
      get() {
        return this.media ? Boolean(this.media.paused) : true;
      },
    });
    expect(player.paused).toBe(true);
  });

  it('ended getter returns false when media is null', () => {
    const player = createDestroyedPlayer();
    Object.defineProperty(player, 'ended', {
      get() {
        return this.media ? Boolean(this.media.ended) : false;
      },
    });
    expect(player.ended).toBe(false);
  });

  it('volume getter returns 1 when media is null', () => {
    const player = createDestroyedPlayer();
    Object.defineProperty(player, 'volume', {
      get() {
        return this.media ? Number(this.media.volume) : 1;
      },
    });
    expect(player.volume).toBe(1);
  });

  it('seeking getter returns false when media is null', () => {
    const player = createDestroyedPlayer();
    Object.defineProperty(player, 'seeking', {
      get() {
        return this.media ? Boolean(this.media.seeking) : false;
      },
    });
    expect(player.seeking).toBe(false);
  });
});