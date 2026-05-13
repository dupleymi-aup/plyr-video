// ==========================================================================
// Plyr controls: Range, progress, and seek tooltip
// ==========================================================================

import browser from '../utils/browser';
import { matches, toggleClass } from '../utils/elements';
import i18n from '../utils/i18n';
import is from '../utils/is';
import { getPercentage } from '../utils/strings';
import { formatTime } from '../utils/time';

class RangeProgress {
  constructor(player) {
    this.player = player;
  }

  // Update volume UI and storage
  updateVolume() {
    if (!this.player.supported.ui) {
      return;
    }

    // Update range
    if (is.element(this.player.elements.inputs.volume)) {
      this.setRange(this.player.elements.inputs.volume, this.player.muted ? 0 : this.player.volume);
    }

    // Update mute state
    if (is.element(this.player.elements.buttons.mute)) {
      this.player.elements.buttons.mute.pressed = this.player.muted || this.player.volume === 0;
    }
  }

  // Update seek value and lower fill
  setRange(target, value = 0) {
    if (!is.element(target)) {
      return;
    }

    target.value = value;

    // Webkit range fill
    this.updateRangeFill(target);
  }

  // Update <progress> elements
  updateProgress(event) {
    if (!this.player.supported.ui || !is.event(event)) {
      return;
    }

    let value = 0;

    const setProgress = (target, input) => {
      const val = is.number(input) ? input : 0;
      const progress = is.element(target) ? target : this.player.elements.display.buffer;

      // Update value and label
      if (is.element(progress)) {
        progress.value = val;

        // Update text label inside
        const label = progress.getElementsByTagName('span')[0];
        if (is.element(label)) {
          label.childNodes[0].nodeValue = val;
        }
      }
    };

    if (event) {
      switch (event.type) {
        // Video playing
        case 'timeupdate':
        case 'seeking':
        case 'seeked':
          value = getPercentage(this.player.currentTime, this.player.duration);

          // Set seek range value only if it's a 'natural' time event
          if (event.type === 'timeupdate') {
            this.setRange(this.player.elements.inputs.seek, value);
          }

          break;

        // Check buffer status
        case 'playing':
        case 'progress':
          setProgress(this.player.elements.display.buffer, this.player.buffered * 100);

          break;

        default:
          break;
      }
    }
  }

  // Webkit polyfill for lower fill range
  updateRangeFill(target) {
    // Get range from event if event passed
    const range = is.event(target) ? target.target : target;

    // Needs to be a valid <input type='range'>
    if (!is.element(range) || range.getAttribute('type') !== 'range') {
      return;
    }

    // Set aria values for https://github.com/QuadDarv1ne/plyr-video/issues/905
    if (matches(range, this.player.config.selectors.inputs.seek)) {
      range.setAttribute('aria-valuenow', this.player.currentTime);
      const currentTime = formatTime(this.player.currentTime);
      const duration = formatTime(this.player.duration);
      const format = i18n.get('seekLabel', this.player.config);
      range.setAttribute(
        'aria-valuetext',
        format.replace('{currentTime}', currentTime).replace('{duration}', duration),
      );
    }
    else if (matches(range, this.player.config.selectors.inputs.volume)) {
      const percent = range.value * 100;
      range.setAttribute('aria-valuenow', percent);
      range.setAttribute('aria-valuetext', `${percent.toFixed(1)}%`);
    }
    else {
      range.setAttribute('aria-valuenow', range.value);
    }

    // WebKit only
    if (!browser.isWebKit && !browser.isIPadOS) {
      return;
    }

    // Set CSS custom property
    range.style.setProperty('--value', `${(range.value / range.max) * 100}%`);
  }

  // Update hover tooltip for seeking
  updateSeekTooltip(event) {
    // Bail if setting not true
    if (
      !this.player.config.tooltips.seek
      || !is.element(this.player.elements.inputs.seek)
      || !is.element(this.player.elements.display.seekTooltip)
      || this.player.duration === 0
    ) {
      return;
    }

    const tipElement = this.player.elements.display.seekTooltip;
    const visible = `${this.player.config.classNames.tooltip}--visible`;
    const toggle = show => toggleClass(tipElement, visible, show);

    // Hide on touch
    if (this.player.touch) {
      toggle(false);
      return;
    }

    // Determine percentage, if already visible
    let percent = 0;
    const clientRect = this.player.elements.progress.getBoundingClientRect();

    if (is.event(event)) {
      const scrollLeft = event.pageX - event.clientX;
      percent = (100 / clientRect.width) * (event.pageX - clientRect.left - scrollLeft);
    }
    else if (tipElement.classList.contains(visible)) {
      percent = Number.parseFloat(tipElement.style.left, 10);
    }
    else {
      return;
    }

    // Set bounds
    if (percent < 0) {
      percent = 0;
    }
    else if (percent > 100) {
      percent = 100;
    }

    const time = (this.player.duration / 100) * percent;

    // Display the time a click would seek to
    let text = formatTime(time);

    // Get marker point for time
    const point = this.player.config.markers?.points?.find(({ time: t }) => t === Math.round(time));

    // Append the point label to the tooltip (escape HTML to prevent XSS)
    if (point) {
      const escapedLabel = point.label
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      text = `${escapedLabel}<br>${text}`;
    }

    tipElement.innerHTML = text;

    // Set position
    tipElement.style.left = `${percent}%`;

    // Show/hide the tooltip
    // If the event is a moues in/out and percentage is inside bounds
    if (is.event(event) && ['mouseenter', 'mouseleave'].includes(event.type)) {
      toggle(event.type === 'mouseenter');
    }
  }
}

export default RangeProgress;
