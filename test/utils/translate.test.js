import { afterEach, describe, expect, it, vi } from 'vitest';
import { translate, translateText } from '../../src/js/utils/translate';

describe('translate', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should return translated text on success', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ translatedText: 'Hola' }),
      }),
    );

    const result = await translate('Hello', 'es', 'en');
    expect(result).toBe('Hola');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('https://libretranslate.de/translate');
    expect(options.method).toBe('POST');
    expect(options.body.get('q')).toBe('Hello');
    expect(options.body.get('to')).toBe('es');
    expect(options.body.get('from')).toBe('en');
  });

  it('should include api_key when provided', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ translatedText: 'Bonjour' }),
      }),
    );

    await translate('Hello', 'fr', 'en', { apiUrl: 'https://example.com/translate', key: 'secret123' });

    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.body.get('api_key')).toBe('secret123');
  });

  it('should fallback to original text when response is not ok', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      }),
    );

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await translate('Hello', 'de');
    expect(result).toBe('Hello');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should fallback to original text on invalid JSON response', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await translate('Hello', 'it');
    expect(result).toBe('Hello');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should fallback to original text on network error', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await translate('Hello', 'pt');
    expect(result).toBe('Hello');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should use default target language "en"', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ translatedText: 'Hello' }),
      }),
    );

    await translate('Hola');

    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.body.get('to')).toBe('en');
  });
});

describe('translateText', () => {
  it('should delegate to translate for libretranslate service', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ translatedText: 'Ciao' }),
      }),
    );

    const result = await translateText('Hello', 'it', 'en', 'libretranslate');
    expect(result).toBe('Ciao');
  });

  it('should return original text for unsupported service', async () => {
    const result = await translateText('Hello', 'it', 'en', 'google');
    expect(result).toBe('Hello');
  });
});
