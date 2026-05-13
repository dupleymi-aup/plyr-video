// ==========================================================================
// Plyr controls: Markers
// ==========================================================================

import { createElement, toggleClass } from '../utils/elements';

class Markers {
  constructor(player) {
    this.player = player;
  }

  // Add markers
  setMarkers() {
    if (!this.player.duration || this.player.elements.markers) return;

    // Get valid points
    const points = this.player.config.markers?.points?.filter(({ time }) => time > 0 && time < this.player.duration);
    if (!points?.length) return;

    const containerFragment = document.createDocumentFragment();
    const pointsFragment = document.createDocumentFragment();
    let tipElement = null;
    const tipVisible = `${this.player.config.classNames.tooltip}--visible`;
    const toggleTip = show => toggleClass(tipElement, tipVisible, show);

    // Inject markers to progress container
    points.forEach((point) => {
      const markerElement = createElement(
        'span',
        {
          class: this.player.config.classNames.marker,
        },
        '',
      );

      const left = `${(point.time / this.player.duration) * 100}%`;

      if (tipElement) {
        // Show on hover
        markerElement.addEventListener('mouseenter', () => {
          if (!point.label) return;
          tipElement.style.left = left;
          // Escape HTML to prevent XSS
          const escapedLabel = point.label
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
          tipElement.innerHTML = escapedLabel;
          toggleTip(true);
        });

        // Hide on leave
        markerElement.addEventListener('mouseleave', () => {
          toggleTip(false);
        });
      }

      markerElement.addEventListener('click', () => {
        this.player.currentTime = point.time;
      });

      markerElement.style.left = left;
      pointsFragment.appendChild(markerElement);
    });

    containerFragment.appendChild(pointsFragment);

    // Inject a tooltip if needed
    if (!this.player.config.tooltips.seek) {
      tipElement = createElement(
        'span',
        {
          class: this.player.config.classNames.tooltip,
        },
        '',
      );

      containerFragment.appendChild(tipElement);
    }

    this.player.elements.markers = {
      points: pointsFragment,
      tip: tipElement,
    };

    this.player.elements.progress.appendChild(containerFragment);
  }
}

export default Markers;
