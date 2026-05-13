// ==========================================================================
// Plyr controls: Time display
// ==========================================================================

import { toggleHidden } from '../utils/elements';
import is from '../utils/is';
import { formatTime, getHours } from '../utils/time';
import Markers from './markers';
import RangeProgress from './range-progress';

class TimeDisplay {
  constructor(player) {
    this.player = player;
    this.markers = new Markers(player);
    this.rangeProgress = new RangeProgress(player);
  }

  // Format a time for display
  formatTime(time = 0, inverted = false) {
    // Bail if the value isn't a number
    if (!is.number(time)) {
      return time;
    }

    // Always display hours if duration is over an hour
    const forceHours = getHours(this.player.duration) > 0;

    return formatTime(time, forceHours, inverted);
  }

  // Update the displayed time
  updateTimeDisplay(target = null, time = 0, inverted = false) {
    // Bail if there's no element to display or the value isn't a number
    if (!is.element(target) || !is.number(time)) {
      return;
    }

    target.textContent = this.formatTime(time, inverted);
  }

  // Handle time change event
  timeUpdate(event) {
    // Only invert if only one time element is displayed and used for both duration and currentTime
    const invert = !is.element(this.player.elements.display.duration) && this.player.config.invertTime;

    // Duration
    this.updateTimeDisplay(
      this.player.elements.display.currentTime,
      invert ? this.player.duration - this.player.currentTime : this.player.currentTime,
      invert,
    );

    // Ignore updates while seeking
    if (event && event.type === 'timeupdate' && this.player.media.seeking) {
      return;
    }

    // Playing progress
    this.rangeProgress.updateProgress(event);
  }

  // Show the duration on metadataloaded or durationchange events
  durationUpdate() {
    // Bail if no UI or durationchange event triggered after playing/seek when invertTime is false
    if (!this.player.supported.ui || (!this.player.config.invertTime && this.player.currentTime)) {
      return;
    }

    // If duration is the 2**32 (shaka), Infinity (HLS), DASH-IF (Number.MAX_SAFE_INTEGER || Number.MAX_VALUE) indicating live we hide the currentTime and progressbar.
    // https://github.com/video-dev/hls.js/blob/5820d29d3c4c8a46e8b75f1e3afa3e68c1a9a2db/src/controller/buffer-controller.js#L415
    // https://github.com/google/shaka-player/blob/4d889054631f4e1cf0fbd80ddd2b71887c02e232/lib/media/streaming_engine.js#L1062
    // https://github.com/Dash-Industry-Forum/dash.js/blob/69859f51b969645b234666800d4cb596d89c602d/src/dash/models/DashManifestModel.js#L338
    if (this.player.duration >= 2 ** 32) {
      toggleHidden(this.player.elements.display.currentTime, true);
      toggleHidden(this.player.elements.progress, true);
      return;
    }

    // Update ARIA values
    if (is.element(this.player.elements.inputs.seek)) {
      this.player.elements.inputs.seek.setAttribute('aria-valuemax', this.player.duration);
    }

    // If there's a spot to display duration
    const hasDuration = is.element(this.player.elements.display.duration);

    // If there's only one time display, display duration there
    if (!hasDuration && this.player.config.displayDuration && this.player.paused) {
      this.updateTimeDisplay(this.player.elements.display.currentTime, this.player.duration);
    }

    // If there's a duration element, update content
    if (hasDuration) {
      this.updateTimeDisplay(this.player.elements.display.duration, this.player.duration);
    }

    if (this.player.config.markers.enabled) {
      this.markers.setMarkers();
    }

    // Update the tooltip (if visible)
    this.rangeProgress.updateSeekTooltip();
  }
}

export default TimeDisplay;
