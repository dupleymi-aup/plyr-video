// ==========================================================================
// Provider error codes and standardized error handling
// ==========================================================================

import { providers } from '../config/types';

// Standard error codes for embed providers
export const errorCodes = {
  // Network errors (1-10)
  NETWORK_ERROR: 1,
  TIMEOUT: 2,
  ABORT: 3,

  // Media errors (11-20)
  MEDIA_NOT_FOUND: 11,
  MEDIA_UNAVAILABLE: 12,
  MEDIA_GEOBLOCKED: 13,
  MEDIA_REMOVED: 14,
  MEDIA_PRIVATE: 15,

  // Player errors (21-30)
  PLAYER_INIT_FAILED: 21,
  PLAYER_NOT_READY: 22,
  EMBED_BLOCKED: 23,
  API_ERROR: 24,

  // DRM/Protection errors (31-40)
  DRM_NOT_SUPPORTED: 31,
  DRM_LICENSE_ERROR: 32,

  // Generic
  UNKNOWN: 99,
};

// Error severity levels
export const severity = {
  FATAL: 'fatal', // Player cannot recover — show error UI
  ERROR: 'error', // Feature failed but player still works
  WARNING: 'warning', // Non-critical issue
};

// Map error code to severity
const codeToSeverity = {
  [errorCodes.NETWORK_ERROR]: severity.ERROR,
  [errorCodes.TIMEOUT]: severity.WARNING,
  [errorCodes.ABORT]: severity.WARNING,
  [errorCodes.MEDIA_NOT_FOUND]: severity.FATAL,
  [errorCodes.MEDIA_UNAVAILABLE]: severity.FATAL,
  [errorCodes.MEDIA_GEOBLOCKED]: severity.FATAL,
  [errorCodes.MEDIA_REMOVED]: severity.FATAL,
  [errorCodes.MEDIA_PRIVATE]: severity.FATAL,
  [errorCodes.PLAYER_INIT_FAILED]: severity.FATAL,
  [errorCodes.PLAYER_NOT_READY]: severity.WARNING,
  [errorCodes.EMBED_BLOCKED]: severity.FATAL,
  [errorCodes.API_ERROR]: severity.ERROR,
  [errorCodes.DRM_NOT_SUPPORTED]: severity.FATAL,
  [errorCodes.DRM_LICENSE_ERROR]: severity.FATAL,
  [errorCodes.UNKNOWN]: severity.ERROR,
};

// Provider-specific error message overrides
const providerMessages = {
  rutube: {
    [errorCodes.MEDIA_NOT_FOUND]: 'Видео не найдено на Rutube',
    [errorCodes.MEDIA_REMOVED]: 'Видео удалено с Rutube',
    [errorCodes.MEDIA_GEOBLOCKED]: 'Видео недоступно в вашем регионе',
    [errorCodes.MEDIA_PRIVATE]: 'Видео является приватным',
  },
  yandex: {
    [errorCodes.MEDIA_NOT_FOUND]: 'Видео не найдено в Yandex Cloud Video',
    [errorCodes.MEDIA_UNAVAILABLE]: 'Видео временно недоступно',
  },
  vk: {
    [errorCodes.MEDIA_NOT_FOUND]: 'Видео не найдено во ВКонтакте',
    [errorCodes.MEDIA_REMOVED]: 'Видео удалено из ВКонтакте',
    [errorCodes.MEDIA_PRIVATE]: 'Доступ к видео ограничен',
  },
  mailru: {
    [errorCodes.MEDIA_NOT_FOUND]: 'Видео не найдено на Mail.ru',
    [errorCodes.MEDIA_REMOVED]: 'Видео удалено',
  },
  mtslink: {
    [errorCodes.MEDIA_NOT_FOUND]: 'Видео не найдено на МТС Линк',
    [errorCodes.MEDIA_PRIVATE]: 'Доступ к видео ограничен',
    [errorCodes.PLAYER_INIT_FAILED]: 'Не удалось инициализировать плеер МТС Линк',
  },
};

// Default English messages
const defaultMessages = {
  [errorCodes.NETWORK_ERROR]: 'Network error',
  [errorCodes.TIMEOUT]: 'Request timed out',
  [errorCodes.ABORT]: 'Request aborted',
  [errorCodes.MEDIA_NOT_FOUND]: 'Media not found',
  [errorCodes.MEDIA_UNAVAILABLE]: 'Media temporarily unavailable',
  [errorCodes.MEDIA_GEOBLOCKED]: 'Media not available in your region',
  [errorCodes.MEDIA_REMOVED]: 'Media has been removed',
  [errorCodes.MEDIA_PRIVATE]: 'Access to this media is restricted',
  [errorCodes.PLAYER_INIT_FAILED]: 'Player initialization failed',
  [errorCodes.PLAYER_NOT_READY]: 'Player not ready',
  [errorCodes.EMBED_BLOCKED]: 'Embed playback is blocked',
  [errorCodes.API_ERROR]: 'API error',
  [errorCodes.DRM_NOT_SUPPORTED]: 'DRM is not supported',
  [errorCodes.DRM_LICENSE_ERROR]: 'DRM license error',
  [errorCodes.UNKNOWN]: 'Unknown playback error',
};

/**
 * Create a standardized provider error object
 * @param {string} provider - Provider name
 * @param {number} code - Error code from errorCodes
 * @param {string} [fallbackMessage] - Fallback message if no mapping found
 * @returns {{ code: number, message: string, severity: string, provider: string }} Error object
 */
export function createProviderError(provider, code, fallbackMessage) {
  const message
    = (providerMessages[provider]?.[code])
      || defaultMessages[code]
      || fallbackMessage
      || defaultMessages[errorCodes.UNKNOWN];

  return {
    code: code || errorCodes.UNKNOWN,
    message,
    severity: codeToSeverity[code] || severity.ERROR,
    provider,
  };
}

/**
 * Get severity for an error code
 * @param {number} code
 * @returns {string} Severity level
 */
export function getErrorSeverity(code) {
  return codeToSeverity[code] || severity.ERROR;
}

/**
 * Check if an error is retryable (transient network issues)
 * @param {number} code
 * @returns {boolean} Whether the error is retryable
 */
export function isRetryableError(code) {
  return code === errorCodes.NETWORK_ERROR || code === errorCodes.TIMEOUT || code === errorCodes.ABORT;
}

/**
 * Map a provider-specific error code to a standard error code
 * @param {string} provider
 * @param {number|string} providerCode
 * @returns {number} Standard error code
 */
export function mapProviderErrorCode(provider, providerCode) {
  // Rutube error types
  if (provider === providers.rutube) {
    switch (providerCode) {
      case 1:
      case 'not_found':
        return errorCodes.MEDIA_NOT_FOUND;
      case 2:
      case 'geoblocked':
        return errorCodes.MEDIA_GEOBLOCKED;
      case 3:
      case 'removed':
        return errorCodes.MEDIA_REMOVED;
      case 4:
      case 'private':
        return errorCodes.MEDIA_PRIVATE;
      default:
        return errorCodes.UNKNOWN;
    }
  }

  // VK error codes
  if (provider === providers.vk) {
    switch (providerCode) {
      case 1:
        return errorCodes.MEDIA_NOT_FOUND;
      case 2:
        return errorCodes.MEDIA_PRIVATE;
      case 3:
        return errorCodes.MEDIA_REMOVED;
      case 4:
        return errorCodes.MEDIA_GEOBLOCKED;
      default:
        return errorCodes.UNKNOWN;
    }
  }

  // Mail.ru error codes
  if (provider === providers.mailru) {
    switch (providerCode) {
      case 1:
      case 'not_found':
        return errorCodes.MEDIA_NOT_FOUND;
      case 2:
      case 'removed':
        return errorCodes.MEDIA_REMOVED;
      case 3:
      case 'private':
        return errorCodes.MEDIA_PRIVATE;
      default:
        return errorCodes.UNKNOWN;
    }
  }

  // MTS Link error codes
  if (provider === providers.mtslink) {
    switch (providerCode) {
      case 1:
      case 'not_found':
        return errorCodes.MEDIA_NOT_FOUND;
      case 2:
      case 'private':
        return errorCodes.MEDIA_PRIVATE;
      case 3:
      case 'init_failed':
        return errorCodes.PLAYER_INIT_FAILED;
      default:
        return errorCodes.UNKNOWN;
    }
  }

  return errorCodes.UNKNOWN;
}

export default {
  codes: errorCodes,
  severity,
  create: createProviderError,
  getSeverity: getErrorSeverity,
  isRetryable: isRetryableError,
  mapCode: mapProviderErrorCode,
};
