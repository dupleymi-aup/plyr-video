import { describe, expect, it, vi } from 'vitest';
import Console from '../src/js/console';

describe('Console', () => {
  it('should not log when disabled', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const c = new Console(false);
    c.log('test');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should log when enabled', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const c = new Console(true);
    c.log('test message');
    expect(spy).toHaveBeenCalledWith('test message');
    spy.mockRestore();
  });

  it('should call console.warn when enabled', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const c = new Console(true);
    c.warn('warning');
    expect(spy).toHaveBeenCalledWith('warning');
    spy.mockRestore();
  });

  it('should call console.error when enabled', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const c = new Console(true);
    c.error('error');
    expect(spy).toHaveBeenCalledWith('error');
    spy.mockRestore();
  });

  it('should not warn when disabled', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const c = new Console(false);
    c.warn('warning');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should not error when disabled', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const c = new Console(false);
    c.error('error');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
