import { describe, it, expect, beforeEach, vi } from 'vitest';
import Storage from '../src/js/storage';

describe('Storage', () => {
  let mockPlayer;

  beforeEach(() => {
    localStorage.clear();
    mockPlayer = {
      config: {
        storage: {
          enabled: true,
          key: 'plyr-test',
        },
      },
    };
  });

  describe('supported', () => {
    it('returns true when localStorage is available', () => {
      expect(Storage.supported).toBe(true);
    });
  });

  describe('get', () => {
    it('returns null when storage is disabled', () => {
      mockPlayer.config.storage.enabled = false;
      const storage = new Storage(mockPlayer);
      expect(storage.get('volume')).toBeNull();
    });

    it('returns null for empty storage', () => {
      const storage = new Storage(mockPlayer);
      expect(storage.get('volume')).toBeNull();
    });

    it('returns stored value by key', () => {
      localStorage.setItem('plyr-test', JSON.stringify({ volume: 0.5, speed: 1.5 }));
      const storage = new Storage(mockPlayer);
      expect(storage.get('volume')).toBe(0.5);
      expect(storage.get('speed')).toBe(1.5);
    });

    it('returns full object when no key specified', () => {
      localStorage.setItem('plyr-test', JSON.stringify({ volume: 0.5, speed: 1.5 }));
      const storage = new Storage(mockPlayer);
      expect(storage.get()).toEqual({ volume: 0.5, speed: 1.5 });
    });
  });

  describe('set', () => {
    it('does nothing when storage is disabled', () => {
      mockPlayer.config.storage.enabled = false;
      const storage = new Storage(mockPlayer);
      storage.set({ volume: 0.5 });
      expect(localStorage.getItem('plyr-test')).toBeNull();
    });

    it('does nothing for non-object input', () => {
      const storage = new Storage(mockPlayer);
      storage.set('string');
      storage.set(123);
      storage.set(null);
      expect(localStorage.getItem('plyr-test')).toBeNull();
    });

    it('stores object in localStorage', () => {
      const storage = new Storage(mockPlayer);
      storage.set({ volume: 0.5 });
      expect(JSON.parse(localStorage.getItem('plyr-test'))).toEqual({ volume: 0.5 });
    });

    it('merges with existing storage', () => {
      localStorage.setItem('plyr-test', JSON.stringify({ volume: 0.5 }));
      const storage = new Storage(mockPlayer);
      storage.set({ speed: 1.5 });
      expect(JSON.parse(localStorage.getItem('plyr-test'))).toEqual({ volume: 0.5, speed: 1.5 });
    });

    it('overwrites existing values', () => {
      localStorage.setItem('plyr-test', JSON.stringify({ volume: 0.5 }));
      const storage = new Storage(mockPlayer);
      storage.set({ volume: 0.8 });
      expect(JSON.parse(localStorage.getItem('plyr-test'))).toEqual({ volume: 0.8 });
    });
  });

  describe('constructor', () => {
    it('reads enabled and key from player config', () => {
      const storage = new Storage(mockPlayer);
      expect(storage.enabled).toBe(true);
      expect(storage.key).toBe('plyr-test');
    });
  });
});
