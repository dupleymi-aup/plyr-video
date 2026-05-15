// ==========================================================================
// Captions utility functions for track data retrieval
// These are pure data-retrieval functions used by both captions.js and controls.js
// ==========================================================================

import i18n from './utils/i18n';
import is from './utils/is';

// Get current valid caption tracks
// If update is false it will also ignore tracks without metadata
// This is used to "freeze" the language options when captions.update is false
export function getTracks(plyr, update = false) {
  const media = plyr.media;
  const meta = plyr.captions?.meta || new WeakMap();
  const isHTML5 = plyr.isHTML5;

  // Handle media or textTracks missing or null
  const tracks = Array.from((media || {}).textTracks || []);
  // For HTML5, use cache instead of current tracks when it exists (if captions.update is false)
  // Filter out removed tracks and tracks that aren't captions/subtitles (for example metadata)
  return tracks
    .filter(track => !isHTML5 || update || meta.has(track))
    .filter(track => ['captions', 'subtitles'].includes(track.kind));
}

// Get UI label for track
export function getLabel(plyr, track) {
  let currentTrack = track;
  const captions = plyr.captions;
  const config = plyr.config;
  const supported = plyr.supported;

  if (!is.track(currentTrack) && supported.textTracks && captions?.toggled) {
    const tracks = getTracks(plyr);
    currentTrack = tracks[captions.currentTrack];
  }

  if (is.track(currentTrack)) {
    if (!is.empty(currentTrack.label)) {
      return currentTrack.label;
    }

    if (!is.empty(currentTrack.language)) {
      return currentTrack.language.toUpperCase();
    }

    return i18n.get('enabled', config);
  }

  return i18n.get('disabled', config);
}
