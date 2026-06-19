import { describe, expect, it } from 'vitest';
import { clamp } from '../../src/js/utils/numbers';
import is from '../../src/js/utils/is';

function setCurrentTime(player, input) {
  const { media, debug } = player;
  if (!player.duration) {
    return;
  }

  const inputIsValid = is.number(input) && input >= 0;
  media.currentTime = inputIsValid ? Math.min(input, player.duration) : 0;
  debug.log(`Seeking to ${media.currentTime} seconds`);
}

function createMock(overrides = {}) {
  return {
    ready: true,
    media: { currentTime: 0 },
    duration: overrides.duration ?? 120,
    debug: { log: () => {} },
  };
}

describe('currentTime setter logic', () => {
  it('should allow seeking to 0 (start of video)', () => {
    const player = createMock();
    player.media.currentTime = 60;
    setCurrentTime(player, 0);
    expect(player.media.currentTime).toBe(0);
  });

  it('should clamp negative values to 0', () => {
    const player = createMock();
    setCurrentTime(player, -5);
    expect(player.media.currentTime).toBe(0);
  });

  it('should clamp values beyond duration to duration', () => {
    const player = createMock();
    setCurrentTime(player, 200);
    expect(player.media.currentTime).toBe(120);
  });

  it('should set exact time within range', () => {
    const player = createMock();
    setCurrentTime(player, 45);
    expect(player.media.currentTime).toBe(45);
  });

  it('should handle NaN input by setting 0', () => {
    const player = createMock();
    setCurrentTime(player, NaN);
    expect(player.media.currentTime).toBe(0);
  });

  it('should handle Infinity input by clamping to duration', () => {
    const player = createMock();
    setCurrentTime(player, Infinity);
    expect(player.media.currentTime).toBe(120);
  });

  it('should bail if duration is 0', () => {
    const player = createMock({ duration: 0 });
    player.media.currentTime = 60;
    setCurrentTime(player, 30);
    expect(player.media.currentTime).toBe(60);
  });
});
