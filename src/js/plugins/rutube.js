// ==========================================================================
// Rutube plugin
// ==========================================================================

import ui from '../ui';
import { triggerEvent } from '../utils/events';
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
  handleCaptionList,
  handleChangeState,
  handleCueChange,
  handleCurrentQuality,
  handleCurrentTime,
  handlePlayOptionsLoaded,
  handleQualityList,
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
    if (is.empty(videoId)) {
      player.debug.error('Rutube: No valid video ID found');
      return;
    }

    const embedUrl = `https://rutube.ru/play/embed/${videoId}/`;
    const params = [];
    if (config.autoplay) params.push('autoplay=true');
    if (config.quality) params.push(`q=${config.quality}`);
    if (config.skinColor) params.push(`skinColor=${config.skinColor}`);
    if (config.stopTime) params.push(`stopTime=${config.stopTime}`);

    createEmbed(rutube, {
      player,
      videoId,
      embedUrl,
      params,
      allowedOrigins: ['https://rutube.ru', 'https://www.rutube.ru', 'https://play.rutube.ru'],
      handleMessage: rutube.handleMessage,
      label: 'Rutube',
    });

    defineMediaControls(player);
    defineMediaProperties(player, videoId, embedUrl);

    // Get title
    rutube.getTitle.call(player, videoId);

    // Fetch poster if custom controls
    if (config.customControls && player.poster) {
      fetchPoster(`https://rutube.ru/api/video/${videoId}/`, player);
    }

    // Request available qualities and captions
    player.embed.optionsTimeout = setTimeout(() => sendCommand(player, 'frame:checkOptions'), 1000);
    player.embed.captionTimeout = setTimeout(() => sendCommand(player, 'player:getCaptions'), 1500);

    // Rebuild UI
    if (config.customControls) {
      setTimeout(() => ui.build.call(player), 0);
    }
  },

  handleMessage(msg) {
    const player = this;
    const { type, data } = msg;

    switch (type) {
      case 'player:ready':
        player.debug.log('Rutube player ready');
        triggerEvent.call(player, player.media, 'timeupdate');
        break;

      case 'player:changeState':
        handleChangeState(player, data);
        break;

      case 'player:durationChange':
        if (data && is.number(data.duration)) {
          player.media.duration = data.duration;
          triggerEvent.call(player, player.media, 'durationchange');
        }
        break;

      case 'player:currentTime':
        handleCurrentTime(player, data);
        break;

      case 'player:volumeChange':
        if (data && is.number(data.volume)) {
          player.media.volume = data.volume;
          triggerEvent.call(player, player.media, 'volumechange');
        }
        break;

      case 'player:playbackSpeedChanged':
        if (data && is.number(data.speed)) {
          player.media.playbackRate = data.speed;
          triggerEvent.call(player, player.media, 'ratechange');
        }
        break;

      case 'player:qualityList':
        handleQualityList(player, data);
        break;

      case 'player:currentQuality':
        handleCurrentQuality(player, data);
        break;

      case 'player:playOptionsLoaded':
        handlePlayOptionsLoaded(player, data);
        break;

      case 'player:captionList':
        handleCaptionList(player, data);
        break;

      case 'player:cueChange':
        handleCueChange(player, data);
        break;

      case 'player:captionChange':
        player.debug.log('Rutube caption track changed');
        break;

      case 'player:error':
        player.media.error = {
          code: (data && data.type) ? data.type : 1,
          message: (data && data.message) || 'Rutube playback error',
        };
        triggerEvent.call(player, player.media, 'error');
        break;

      case 'player:playComplete':
        player.media.paused = true;
        triggerEvent.call(player, player.media, 'ended');
        break;

      default:
        if (player.config.debug) {
          player.debug.log('Rutube unknown event:', type, data);
        }
        break;
    }
  },

  destroy() {
    destroy.call(this);
  },
};

export default rutube;
