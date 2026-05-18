import { describe, expect, it, vi } from 'vitest';
import { on, off, once, triggerEvent, unbindListeners, createEventBus } from '../../src/js/utils/events';

describe('events utils', () => {
  describe('on', () => {
    it('binds event listener', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      on.call({ eventListeners: [] }, element, 'click', callback);
      element.dispatchEvent(new Event('click'));
      expect(callback).toHaveBeenCalled();
    });

    it('binds multiple events', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      on.call({ eventListeners: [] }, element, 'click keydown', callback);
      element.dispatchEvent(new Event('click'));
      element.dispatchEvent(new Event('keydown'));
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('does nothing without callback', () => {
      const element = document.createElement('div');
      expect(() => on.call({ eventListeners: [] }, element, 'click', null)).not.toThrow();
    });

    it('does nothing without element', () => {
      const callback = vi.fn();
      expect(() => on.call({ eventListeners: [] }, null, 'click', callback)).not.toThrow();
    });
  });

  describe('off', () => {
    it('removes event listener', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      element.addEventListener('click', callback);
      off.call({ eventListeners: [] }, element, 'click', callback);
      element.dispatchEvent(new Event('click'));
      expect(callback).not.toHaveBeenCalled();
    });

    it('does nothing without element', () => {
      const callback = vi.fn();
      expect(() => off.call({ eventListeners: [] }, null, 'click', callback)).not.toThrow();
    });
  });

  describe('once', () => {
    it('fires callback only once', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      once.call({ eventListeners: [] }, element, 'click', callback);
      element.dispatchEvent(new Event('click'));
      element.dispatchEvent(new Event('click'));
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('fires only once for multiple events bound together', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      once.call({ eventListeners: [] }, element, 'click keydown', callback);
      element.dispatchEvent(new Event('click'));
      element.dispatchEvent(new Event('keydown'));
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('triggerEvent', () => {
    it('dispatches custom event', () => {
      const element = document.createElement('div');
      let triggered = false;
      element.addEventListener('custom', () => { triggered = true; });
      triggerEvent.call({}, element, 'custom');
      expect(triggered).toBe(true);
    });

    it('includes detail with plyr reference', () => {
      const element = document.createElement('div');
      let detail = null;
      element.addEventListener('custom', (e) => { detail = e.detail; });
      triggerEvent.call({ name: 'test' }, element, 'custom');
      expect(detail.plyr.name).toBe('test');
    });

    it('respects bubbles option', () => {
      const parent = document.createElement('div');
      const child = document.createElement('div');
      parent.appendChild(child);
      let triggered = false;
      parent.addEventListener('custom', () => { triggered = true; });
      triggerEvent.call({}, child, 'custom', false);
      expect(triggered).toBe(false);
    });

    it('does nothing for non-element', () => {
      expect(() => triggerEvent.call({}, null, 'custom')).not.toThrow();
    });

    it('does nothing for empty type', () => {
      const element = document.createElement('div');
      expect(() => triggerEvent.call({}, element, '')).not.toThrow();
    });
  });

  describe('unbindListeners', () => {
    it('removes all cached event listeners', () => {
      const element = document.createElement('div');
      const callback = vi.fn();
      const context = { eventListeners: [] };
      on.call(context, element, 'click', callback);
      element.dispatchEvent(new Event('click'));
      expect(callback).toHaveBeenCalledTimes(1);

      unbindListeners.call(context);
      element.dispatchEvent(new Event('click'));
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does nothing without context', () => {
      expect(() => unbindListeners.call(null)).not.toThrow();
    });

    it('does nothing without eventListeners array', () => {
      expect(() => unbindListeners.call({})).not.toThrow();
    });
  });

  describe('createEventBus', () => {
    it('should emit events to subscribed handlers', () => {
      const bus = createEventBus();
      const handler = vi.fn();
      bus.on('test', handler);
      bus.emit('test', 'arg1', 'arg2');
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should not call handler after unsubscribing', () => {
      const bus = createEventBus();
      const handler = vi.fn();
      const unsubscribe = bus.on('test', handler);
      unsubscribe();
      bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support off method for unsubscription', () => {
      const bus = createEventBus();
      const handler = vi.fn();
      bus.on('test', handler);
      bus.off('test', handler);
      bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple handlers for same event', () => {
      const bus = createEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on('test', handler1);
      bus.on('test', handler2);
      bus.emit('test');
      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it('should handle events with no subscribers gracefully', () => {
      const bus = createEventBus();
      expect(() => bus.emit('nonexistent')).not.toThrow();
    });

    it('should clear all handlers for a specific event', () => {
      const bus = createEventBus();
      const handler = vi.fn();
      bus.on('test', handler);
      bus.clear('test');
      bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should clear all handlers when no event specified', () => {
      const bus = createEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on('event1', handler1);
      bus.on('event2', handler2);
      bus.clear();
      bus.emit('event1');
      bus.emit('event2');
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function from on()', () => {
      const bus = createEventBus();
      const handler = vi.fn();
      const unsubscribe = bus.on('test', handler);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
      bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
