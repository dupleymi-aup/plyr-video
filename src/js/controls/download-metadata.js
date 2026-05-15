// ==========================================================================
// Plyr controls: Download URL and media metadata
// ==========================================================================

import is from '../utils/is';

class DownloadMetadata {
  constructor(player) {
    this.player = player;
  }

  // Set the download URL
  setDownloadUrl() {
    const button = this.player.elements.buttons.download;

    // Bail if no button
    if (!is.element(button)) {
      return;
    }

    // Set attribute
    button.setAttribute('href', this.player.download);
  }

  // Set media metadata
  setMediaMetadata() {
    try {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: this.player.config.mediaMetadata.title,
          artist: this.player.config.mediaMetadata.artist,
          album: this.player.config.mediaMetadata.album,
          artwork: this.player.config.mediaMetadata.artwork,
        });
      }
    }
    catch {
      // Do nothing
    }
  }
}

export default DownloadMetadata;
