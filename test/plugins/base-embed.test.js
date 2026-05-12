import { beforeEach, describe, expect, it, vi } from 'vitest';
import { baseSetup, isOriginAllowed } from '../../src/js/plugins/base-embed';

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
      // toggleClass uses classList.add when force=true
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
});
