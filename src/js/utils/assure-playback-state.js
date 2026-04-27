// ==========================================================================
// Shared playback state helper
// ==========================================================================
import { triggerEvent } from './events';

/**
 * Set playback state and trigger change event (only on actual change)
 * @param {boolean} play - Whether the media should be playing
 */
export function assurePlaybackState(play) {
  if (play && !this.embed.hasPlayed) {
    this.embed.hasPlayed = true;
  }

  if (this.media.paused === play) {
    this.media.paused = !play;
    triggerEvent.call(this, this.media, play ? 'play' : 'pause');
  }
}

export default assurePlaybackState;
