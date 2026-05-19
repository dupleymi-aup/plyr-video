import { describe, expect, it, vi } from 'vitest';
import RangeProgress from '../../src/js/controls/range-progress';

function createMockPlayer() {
  return {
    config: {
      tooltips: { seek: false },
      selectors: {
        inputs: { seek: '[data-plyr="seek"]', volume: '[data-plyr="volume"]' },
      },
      classNames: { tooltip: 'plyr__tooltip' },
      markers: { points: [] },
    },
    supported: { ui: true },
    touch: false,
    duration: 120,
    currentTime: 30,
    muted: false,
    volume: 0.8,
    buffered: 0.5,
    elements: {
      inputs: { seek: null, volume: null },
      display: { buffer: null, seekTooltip: null },
      buttons: { mute: null },
      progress: null,
    },
  };
}

describe('RangeProgress', () => {
  describe('setRange', () => {
    it('should set the value on a target element', () => {
      const player = createMockPlayer();
      const rp = new RangeProgress(player);
      const target = document.createElement('input');
      target.type = 'range';
      target.min = 0;
      target.max = 100;
      rp.setRange(target, 50);
      expect(target.value).toBe('50');
    });

    it('should do nothing if target is not an element', () => {
      const player = createMockPlayer();
      const rp = new RangeProgress(player);
      expect(() => rp.setRange(null, 50)).not.toThrow();
    });

    it('should update CSS custom property for WebKit browsers', () => {
      const player = createMockPlayer();
      const rp = new RangeProgress(player);
      const target = document.createElement('input');
      target.type = 'range';
      target.min = 0;
      target.max = 100;
      target.value = 50;
      rp.setRange(target, 75);
      expect(target.value).toBe('75');
    });
  });

  describe('updateRangeFill', () => {
    it('should do nothing for non-range input', () => {
      const player = createMockPlayer();
      const rp = new RangeProgress(player);
      const target = document.createElement('input');
      target.type = 'text';
      expect(() => rp.updateRangeFill(target)).not.toThrow();
    });

    it('should do nothing for non-element', () => {
      const player = createMockPlayer();
      const rp = new RangeProgress(player);
      expect(() => rp.updateRangeFill(null)).not.toThrow();
    });
  });
});
