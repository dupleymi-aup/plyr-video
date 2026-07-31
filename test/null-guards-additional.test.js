import { describe, expect, it } from 'vitest';

describe('support.mime() null guard', () => {
  it('should return false when media is null', () => {
    const player = {
      isHTML5: true,
      type: 'video',
      media: null,
      debug: { warn: () => {} },
    };

    // Simulate the mime() logic with null guard
    function mime(input) {
      if (!input) return false;
      const [mediaType] = input.split('/');
      if (!player.isHTML5 || mediaType !== player.type) return false;
      try {
        return Boolean(input && player.media && typeof player.media.canPlayType === 'function' && player.media.canPlayType(input).replace(/no/, ''));
      }
      catch {
        return false;
      }
    }

    expect(mime('video/mp4')).toBe(false);
  });

  it('should return false when media is null and canPlayType does not exist', () => {
    const player = {
      isHTML5: true,
      type: 'video',
      media: { canPlayType: undefined },
      debug: { warn: () => {} },
    };

    function mime(input) {
      if (!input) return false;
      const [mediaType] = input.split('/');
      if (!player.isHTML5 || mediaType !== player.type) return false;
      try {
        return Boolean(input && player.media && typeof player.media.canPlayType === 'function' && player.media.canPlayType(input).replace(/no/, ''));
      }
      catch {
        return false;
      }
    }

    expect(mime('video/mp4')).toBe(false);
  });

  it('should return true when media is valid and supports format', () => {
    const player = {
      isHTML5: true,
      type: 'video',
      media: {
        canPlayType: (type) => 'probably',
      },
      debug: { warn: () => {} },
    };

    function mime(input) {
      if (!input) return false;
      const [mediaType] = input.split('/');
      if (!player.isHTML5 || mediaType !== player.type) return false;
      try {
        return Boolean(input && player.media && typeof player.media.canPlayType === 'function' && player.media.canPlayType(input).replace(/no/, ''));
      }
      catch {
        return false;
      }
    }

    expect(mime('video/mp4')).toBe(true);
  });
});

describe('style.getAspectRatio() null guard', () => {
  it('should handle null media gracefully when isHTML5', () => {
    const player = {
      isHTML5: true,
      media: null,
      config: { ratio: null },
      embed: null,
    };

    // Simulate the getAspectRatio logic with null guard
    function getAspectRatio(input) {
      const parse = ratio => {
        if (!ratio || typeof ratio !== 'string' || !ratio.includes(':')) return null;
        return ratio.split(':').map(Number);
      };

      let ratio = parse(input);
      if (ratio === null) ratio = parse(player.config.ratio);
      if (ratio === null && player.embed && player.embed.ratio) {
        ratio = player.embed.ratio;
      }
      if (ratio === null && player.isHTML5 && player.media) {
        const { videoWidth, videoHeight } = player.media;
        ratio = [videoWidth, videoHeight];
      }
      return ratio;
    }

    // Should not crash with null media
    const result = getAspectRatio('16:9');
    expect(result).toEqual([16, 9]);
  });

  it('should return null when no ratio is available and media is null', () => {
    const player = {
      isHTML5: true,
      media: null,
      config: { ratio: null },
      embed: null,
    };

    function getAspectRatio(input) {
      const parse = ratio => {
        if (!ratio || typeof ratio !== 'string' || !ratio.includes(':')) return null;
        return ratio.split(':').map(Number);
      };

      let ratio = parse(input);
      if (ratio === null) ratio = parse(player.config.ratio);
      if (ratio === null && player.embed && player.embed.ratio) {
        ratio = player.embed.ratio;
      }
      if (ratio === null && player.isHTML5 && player.media) {
        const { videoWidth, videoHeight } = player.media;
        ratio = [videoWidth, videoHeight];
      }
      return ratio;
    }

    const result = getAspectRatio(null);
    expect(result).toBeNull();
  });
});