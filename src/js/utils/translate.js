// ==========================================================================
// Plyr translation utility
// Uses LibreTranslate API for translating text
// ==========================================================================

import is from './is';

// Uses native fetch (required for POST requests)
// Custom XHR-based fetch only supports GET

/**
 * Translate text using LibreTranslate API
 * @param {string} text - The text to translate
 * @param {string} to - Target language code (e.g., 'en', 'es', 'fr')
 * @param {string} from - Source language code (optional, default: 'auto')
 * @param {object} config - Translation service configuration
 * @returns {Promise<string>} - Translated text
 */
export function translate(text, to = 'en', from = 'auto', config = {}) {
  // Default configuration for LibreTranslate
  const defaultConfig = {
    apiUrl: 'https://libretranslate.de/translate', // Public instance, consider self-hosted for production
    key: null, // Optional API key for private instances
  };

  const settings = { ...defaultConfig, ...config };

  // Prepare request body
  const body = new URLSearchParams({
    q: text,
    to,
    from,
    ...(settings.key && { api_key: settings.key }),
  });

  return fetch(settings.apiUrl, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Translation service error: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (is.string(data.translatedText)) {
        return data.translatedText;
      }
      throw new Error('Invalid response from translation service');
    })
    .catch((error) => {
      // Log error and return original text as fallback
      console.warn('Translation failed:', error);
      return text; // Fallback to original text
    });
}

export function translateText(text, to, from, service) {
  if (service === 'libretranslate') {
    return translate(text, to, from);
  }

  return Promise.resolve(text);
}
