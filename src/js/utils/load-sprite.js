// ==========================================================================
// Sprite loader
// ==========================================================================

import Storage from '../storage';
import fetch from './fetch';
import is from './is';

// Load an external SVG sprite
export default function loadSprite(url, id, debug) {
  if (!is.string(url)) {
    return;
  }

  const prefix = 'cache';
  const hasId = is.string(id);
  let isCached = false;
  const exists = () => document.getElementById(id) !== null;

  const update = (container, data) => {
    container.innerHTML = data;

    // Check again incase of race condition
    if (hasId && exists()) {
      return;
    }

    // Inject the SVG to the body
    document.body.insertAdjacentElement('afterbegin', container);
  };

  // Only load once if ID set
  if (!hasId || !exists()) {
    const useStorage = Storage.supported;
    // Create container
    const container = document.createElement('div');
    container.setAttribute('hidden', '');

    if (hasId) {
      container.setAttribute('id', id);
    }

    // Check in cache
    if (useStorage) {
      const cached = window.localStorage.getItem(`${prefix}-${id}`);
      isCached = cached !== null;

      if (isCached) {
        const data = JSON.parse(cached);
        update(container, data.content);
      }
    }

    // Get the sprite
    fetch(url)
      .then((result) => {
        if (is.empty(result)) {
          return;
        }

        if (useStorage) {
          try {
            window.localStorage.setItem(
              `${prefix}-${id}`,
              JSON.stringify({
                content: result,
              }),
            );
          }
          catch (e) {
            // Storage quota exceeded or private browsing
            if (debug) debug.warn('Failed to cache sprite:', e.message);
          }
        }

        update(container, result);
      })
      .catch((e) => {
        if (debug) debug.warn('Failed to load sprite:', e.message);
      });
  }
}
