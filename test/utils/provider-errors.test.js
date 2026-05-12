import { describe, expect, it } from 'vitest';
import {
  createProviderError,
  errorCodes,
  getErrorSeverity,
  isRetryableError,
  mapProviderErrorCode,
  severity,
} from '../../src/js/utils/provider-errors';

describe('provider-errors', () => {
  describe('errorCodes', () => {
    it('should have expected error codes', () => {
      expect(errorCodes.NETWORK_ERROR).toBe(1);
      expect(errorCodes.TIMEOUT).toBe(2);
      expect(errorCodes.MEDIA_NOT_FOUND).toBe(11);
      expect(errorCodes.MEDIA_GEOBLOCKED).toBe(13);
      expect(errorCodes.PLAYER_INIT_FAILED).toBe(21);
      expect(errorCodes.UNKNOWN).toBe(99);
    });
  });

  describe('severity', () => {
    it('should have severity levels', () => {
      expect(severity.FATAL).toBe('fatal');
      expect(severity.ERROR).toBe('error');
      expect(severity.WARNING).toBe('warning');
    });
  });

  describe('createProviderError', () => {
    it('should create error with provider-specific message', () => {
      const error = createProviderError('rutube', errorCodes.MEDIA_NOT_FOUND);
      expect(error.code).toBe(errorCodes.MEDIA_NOT_FOUND);
      expect(error.message).toBe('Видео не найдено на Rutube');
      expect(error.severity).toBe(severity.FATAL);
      expect(error.provider).toBe('rutube');
    });

    it('should create error with default message for unknown provider', () => {
      const error = createProviderError('unknown', errorCodes.MEDIA_NOT_FOUND);
      expect(error.message).toBe('Media not found');
    });

    it('should use fallback message when no mapping exists', () => {
      const error = createProviderError('rutube', 999, 'Custom error');
      expect(error.message).toBe('Custom error');
    });

    it('should use unknown message as last resort', () => {
      const error = createProviderError('rutube', 999);
      expect(error.message).toBe('Unknown playback error');
    });
  });

  describe('getErrorSeverity', () => {
    it('should return FATAL for media errors', () => {
      expect(getErrorSeverity(errorCodes.MEDIA_NOT_FOUND)).toBe(severity.FATAL);
      expect(getErrorSeverity(errorCodes.MEDIA_GEOBLOCKED)).toBe(severity.FATAL);
    });

    it('should return WARNING for timeout', () => {
      expect(getErrorSeverity(errorCodes.TIMEOUT)).toBe(severity.WARNING);
    });

    it('should return ERROR for unknown codes', () => {
      expect(getErrorSeverity(999)).toBe(severity.ERROR);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      expect(isRetryableError(errorCodes.NETWORK_ERROR)).toBe(true);
    });

    it('should return true for timeout', () => {
      expect(isRetryableError(errorCodes.TIMEOUT)).toBe(true);
    });

    it('should return false for fatal errors', () => {
      expect(isRetryableError(errorCodes.MEDIA_NOT_FOUND)).toBe(false);
      expect(isRetryableError(errorCodes.PLAYER_INIT_FAILED)).toBe(false);
    });
  });

  describe('mapProviderErrorCode', () => {
    describe('rutube', () => {
      it('should map not_found to MEDIA_NOT_FOUND', () => {
        expect(mapProviderErrorCode('rutube', 1)).toBe(errorCodes.MEDIA_NOT_FOUND);
        expect(mapProviderErrorCode('rutube', 'not_found')).toBe(errorCodes.MEDIA_NOT_FOUND);
      });

      it('should map geoblocked to MEDIA_GEOBLOCKED', () => {
        expect(mapProviderErrorCode('rutube', 2)).toBe(errorCodes.MEDIA_GEOBLOCKED);
        expect(mapProviderErrorCode('rutube', 'geoblocked')).toBe(errorCodes.MEDIA_GEOBLOCKED);
      });

      it('should map removed to MEDIA_REMOVED', () => {
        expect(mapProviderErrorCode('rutube', 3)).toBe(errorCodes.MEDIA_REMOVED);
      });

      it('should map private to MEDIA_PRIVATE', () => {
        expect(mapProviderErrorCode('rutube', 4)).toBe(errorCodes.MEDIA_PRIVATE);
        expect(mapProviderErrorCode('rutube', 'private')).toBe(errorCodes.MEDIA_PRIVATE);
      });
    });

    describe('vK', () => {
      it('should map error codes correctly', () => {
        expect(mapProviderErrorCode('vk', 1)).toBe(errorCodes.MEDIA_NOT_FOUND);
        expect(mapProviderErrorCode('vk', 2)).toBe(errorCodes.MEDIA_PRIVATE);
        expect(mapProviderErrorCode('vk', 3)).toBe(errorCodes.MEDIA_REMOVED);
        expect(mapProviderErrorCode('vk', 4)).toBe(errorCodes.MEDIA_GEOBLOCKED);
      });
    });

    describe('mail.ru', () => {
      it('should map error codes correctly', () => {
        expect(mapProviderErrorCode('mailru', 1)).toBe(errorCodes.MEDIA_NOT_FOUND);
        expect(mapProviderErrorCode('mailru', 2)).toBe(errorCodes.MEDIA_REMOVED);
        expect(mapProviderErrorCode('mailru', 3)).toBe(errorCodes.MEDIA_PRIVATE);
      });
    });

    describe('mTS Link', () => {
      it('should map error codes correctly', () => {
        expect(mapProviderErrorCode('mtslink', 1)).toBe(errorCodes.MEDIA_NOT_FOUND);
        expect(mapProviderErrorCode('mtslink', 2)).toBe(errorCodes.MEDIA_PRIVATE);
        expect(mapProviderErrorCode('mtslink', 3)).toBe(errorCodes.PLAYER_INIT_FAILED);
      });
    });

    describe('unknown provider', () => {
      it('should return UNKNOWN for unknown providers', () => {
        expect(mapProviderErrorCode('unknown', 1)).toBe(errorCodes.UNKNOWN);
      });
    });
  });
});
