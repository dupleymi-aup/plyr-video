// ==========================================================================
// Captions utility functions for track data retrieval
// These are pure data-retrieval functions used by both captions.js and controls.js
// ==========================================================================

import i18n from './utils/i18n';
import is from './utils/is';

export function getTracks(plyr, update = false) {
  if (!plyr.media || !plyr.media.textTracks) {
    return [];
  }

  const tracks = Array.from(plyr.media.textTracks);
  const isHTML5 = plyr.isHTML5;

  return tracks
    .filter(track => !isHTML5 || update || (plyr.captions?.meta?.has(track)))
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
    currentTrack = tracks[captions.currentTrack] || tracks[tracks.length - 1];
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
