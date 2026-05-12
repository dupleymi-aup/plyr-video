import { describe, it, expect, beforeEach, vi } from 'vitest';
import { on, off, once, triggerEvent, unbindListeners } from '../../src/js/utils/events';

describe('events utils', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  describe('on', () => {
    it('binds event listener', () => {
      const callback = vi.fn();
      on(element, 'click', callback);
      element.click();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('binds multiple events', () => {
      const callback = vi.fn();
      on(element, 'click mouseover', callback);
      element.click();
      element.dispatchEvent(new MouseEvent('mouseover'));
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('does nothing without callback', () => {
      expect(() => on(element, 'click')).not.toThrow();
    });

    it('does nothing without element', () => {
      expect(() => on(null, 'click', vi.fn())).not.toThrow();
    });
  });

  describe('off', () => {
    it('removes event listener', () => {
      const callback = vi.fn();
      on(element, 'click', callback);
      off(element, 'click', callback);
      element.click();
      expect(callback).not.toHaveBeenCalled();
    });

    it('does nothing without element', () => {
      expect(() => off(null, 'click', vi.fn())).not.toThrow();
    });
  });

  describe('once', () => {
    it('fires callback only once', () => {
      const callback = vi.fn();
      once(element, 'click', callback);
      element.click();
      element.click();
      element.click();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('fires for multiple events once each', () => {
      const callback = vi.fn();
      once(element, 'click mouseover', callback);
      element.click(); // fires and removes both listeners
      expect(callback).toHaveBeenCalledTimes(1);
      // After first fire, listeners are removed
      element.click();
      element.dispatchEvent(new MouseEvent('mouseover'));
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('triggerEvent', () => {
    it('dispatches custom event', () => {
      const callback = vi.fn();
      element.addEventListener('custom', callback);
      triggerEvent.call({}, element, 'custom');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('includes detail with plyr reference', () => {
      const callback = vi.fn();
      element.addEventListener('custom', callback);
      const context = { foo: 'bar' };
      triggerEvent.call(context, element, 'custom', false, { extra: 'data' });
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        detail: { extra: 'data', plyr: context },
      }));
    });

    it('respects bubbles option', () => {
      const callback = vi.fn();
      const parent = document.createElement('div');
      parent.appendChild(element);
      parent.addEventListener('custom', callback);
      triggerEvent.call({}, element, 'custom', true);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does nothing for non-element', () => {
      expect(() => triggerEvent(null, 'test')).not.toThrow();
    });

    it('does nothing for empty type', () => {
      expect(() => triggerEvent(element, '')).not.toThrow();
    });
  });

  describe('unbindListeners', () => {
    it('removes all cached event listeners', () => {
      const callback = vi.fn();
      const context = { eventListeners: [] };
      on.call(context, element, 'click', callback);
      expect(context.eventListeners.length).toBeGreaterThan(0);
      unbindListeners.call(context);
      element.click();
      expect(callback).not.toHaveBeenCalled();
      expect(context.eventListeners).toEqual([]);
    });

    it('does nothing without context', () => {
      expect(() => unbindListeners.call(null)).not.toThrow();
    });

    it('does nothing without eventListeners array', () => {
      expect(() => unbindListeners.call({})).not.toThrow();
    });
  });
});
