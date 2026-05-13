// ==========================================================================
// Rutube plugin
// ==========================================================================
import ui from '../ui';
import is from '../utils/is';
import sendCommand from '../utils/post-message';
import {
  baseSetup,
  createEmbed,
  defineMediaControls,
  defineMediaProperties,
  destroy,
  fetchPoster,
  fetchTitle,
  handleDefaultMessage,
} from './base-embed';

// Parse Rutube ID from URL
function parseId(url) {
  if (is.empty(url)) {
    return null;
  }

  // Standard embed/video URLs: rutube.ru/play/embed/{id}, rutube.ru/video/{id}
  const regex = /rutube\.ru\/(?:play\/embed\/|video\/|embed\/)([a-f0-9]+)\/?/i;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  // Channel/video format: rutube.ru/channel/{channelId}/video/{videoId}
  const channelRegex = /rutube\.ru\/channel\/\d+\/video\/([a-f0-9]+)\/?/i;
  const channelMatch = url.match(channelRegex);
  if (channelMatch && channelMatch[1]) {
    return channelMatch[1];
  }

  // Short links: rutube.ru/r/{videoId}
  const shortRegex = /rutube\.ru\/r\/([a-f0-9]+)\/?/i;
  const shortMatch = url.match(shortRegex);
  if (shortMatch && shortMatch[1]) {
    return shortMatch[1];
  }

  // Alternative domain: play.rutube.ru/embed/{id}
  const altRegex = /play\.rutube\.ru\/(?:embed|video)\/([a-f0-9]+)\/?/i;
  const altMatch = url.match(altRegex);
  if (altMatch && altMatch[1]) {
    return altMatch[1];
  }

  // Fallback: treat the URL itself as video ID
  return url;
}

// Parse Rutube playlist ID from URL
function parsePlaylistId(url) {
  if (is.empty(url)) {
    return null;
  }

  // Playlist URLs: rutube.ru/plst/{playlistId}/ or rutube.ru/play/embed/{videoId}?playlist={playlistId}
  const playlistRegex = /rutube\.ru\/plst\/([a-f0-9]+)\/?/i;
  const match = url.match(playlistRegex);
  if (match && match[1]) {
    return match[1];
  }

  // Check for playlist query parameter
  const queryRegex = /[?&]playlist=([a-f0-9]+)/i;
  const queryMatch = url.match(queryRegex);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  return null;
}

const rutube = {
  setup() {
    baseSetup.call(this, rutube);
  },

  getTitle(videoId) {
    fetchTitle.call(this, `https://rutube.ru/api/video/${videoId}/`, 'Rutube');
  },

  ready() {
    const player = this;
    const config = player.config.rutube;

    let source = player.media.getAttribute('src');
    if (is.empty(source)) {
      source = player.media.getAttribute(player.config.attributes.embed.id);
    }

    const videoId = parseId(source);
    const playlistId = parsePlaylistId(source) || config.playlistId;

    if (is.empty(videoId) && is.empty(playlistId)) {
      player.debug.error('Rutube: No valid video ID or playlist ID found');
      return;
    }

    // Build embed URL - for playlists, use playlist embed format
    const embedUrl = playlistId
      ? `https://rutube.ru/play/embed/${playlistId}/`
      : `https://rutube.ru/play/embed/${videoId}/`;

    const params = [];
    // If we have both videoId and playlistId, pass videoId as a parameter
    if (playlistId && videoId) {
      params.push(`p=${videoId}`);
    }
    if (config.autoplay) {
      params.push('autoplay=true');
    }
    if (config.quality) {
      params.push(`q=${config.quality}`);
    }
    if (config.skinColor) {
      params.push(`skinColor=${config.skinColor}`);
    }
    if (config.stopTime) {
      params.push(`stopTime=${config.stopTime}`);
    }

    createEmbed(rutube, {
      player,
      videoId: playlistId || videoId,
      embedUrl,
      params,
      allowedOrigins: ['https://rutube.ru', 'https://www.rutube.ru', 'https://play.rutube.ru'],
      handleMessage: rutube.handleMessage,
      label: 'Rutube',
    });

    defineMediaControls(player);
    defineMediaProperties(player, playlistId || videoId, embedUrl);

    // Get title
    if (videoId && !playlistId) {
      rutube.getTitle.call(player, videoId);
    }

    // Fetch poster if custom controls
    if (config.customControls && player.poster && videoId) {
      fetchPoster(`https://rutube.ru/api/video/${videoId}/`, player);
    }

    // Request available qualities and captions
    player.embed.optionsTimeout = setTimeout(
      () => sendCommand(player, 'frame:checkOptions'),
      1000,
    );
    player.embed.captionTimeout = setTimeout(
      () => sendCommand(player, 'player:getCaptions'),
      1500,
    );

    // Rebuild UI
    if (config.customControls) {
      setTimeout(() => ui.build.call(player), 0);
    }
  },

  handleMessage(msg) {
    handleDefaultMessage.call(this, msg, 'Rutube', 'rutube');
  },

  destroy() {
    destroy.call(this);
  },
};

export default rutube;
