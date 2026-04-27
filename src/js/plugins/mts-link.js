// ==========================================================================
// MTS Link plugin — video player for MTS Link platform
// ==========================================================================
// MTS Link is a Russian business communications platform (webinars, VCS, etc.)
// Video player embed: https://player.mts-link.ru/player/{videoId}
// Uses postMessage API with { type, data } format (similar to Rutube/Yandex)
// ==========================================================================

import ui from '../ui';
import { triggerEvent } from '../utils/events';
import is from '../utils/is';
import sendCommand from '../utils/post-message';
import { createProviderError, errorCodes } from '../utils/provider-errors';
import {
  baseSetup,
  createEmbed,
  defineMediaControls,
  defineMediaProperties,
  destroy,
  fetchTitle,
  handleCaptionList,
  handleChangeState,
  handleCueChange,
  handleCurrentQuality,
  handleCurrentTime,
  handlePlayOptionsLoaded,
  handleQualityList,
} from './base-embed';

// Parse MTS Link Video ID from URL
function parseId(url) {
  if (is.empty(url)) {
    return null;
  }

  // Match: player.mts-link.ru/player/{videoId}
  const playerRegex = /player\.mts-link\.ru\/player\/([\w-]+)/i;
  const playerMatch = url.match(playerRegex);
  if (playerMatch) {
    return playerMatch[1];
  }

  // Match: mts-link.ru/video/{videoId} or mts-link.ru/recordings/{videoId}
  const siteRegex = /mts-link\.ru\/(?:video|recordings|webinar)\/([\w-]+)/i;
  const siteMatch = url.match(siteRegex);
  if (siteMatch) {
    return siteMatch[1];
  }

  // Match: mts.ru/video/{videoId} or player.mts.ru/{videoId}
  const mtsRegex = /(?:player\.)?mts\.ru\/(?:player\/)?(?:video|recordings?)\/([\w-]+)/i;
  const mtsMatch = url.match(mtsRegex);
  if (mtsMatch) {
    return mtsMatch[1];
  }

  // No valid MTS Link ID found in URL
  return null;
}

const mtslink = {
  setup() {
    baseSetup.call(this, mtslink);
  },

  getTitle(videoId) {
    fetchTitle.call(this, `https://player.mts-link.ru/api/v1/videos/${videoId}`, 'MTS Link', 'name');
  },

  ready() {
    const player = this;
    const config = player.config.mtslink;

    let source = player.media.getAttribute('src');
    if (is.empty(source)) {
      source = player.media.getAttribute(player.config.attributes.embed.id);
    }

    const videoId = parseId(source);
    if (is.empty(videoId)) {
      player.debug.error('MTS Link: No valid video ID found');
      return;
    }

    const embedUrl = `https://player.mts-link.ru/player/${videoId}`;
    const params = [];

    if (config.autoplay) params.push('autoplay=true');
    if (config.muted) params.push('muted=true');
    if (config.loop) params.push('loop=true');
    if (config.startTime) params.push(`startTime=${config.startTime}`);
    if (config.skinColor) params.push(`skinColor=${config.skinColor.replace('#', '')}`);
    if (config.token) params.push(`token=${config.token}`);

    createEmbed(mtslink, {
      player,
      videoId,
      embedUrl,
      params,
      allowedOrigins: ['https://player.mts-link.ru', 'https://mts-link.ru', 'https://player.mts.ru'],
      handleMessage: mtslink.handleMessage,
      label: 'MTS Link',
    });

    defineMediaControls(player);
    defineMediaProperties(player, videoId, embedUrl);

    // Get title
    mtslink.getTitle.call(player, videoId);

    // Request available qualities and captions
    player.embed.optionsTimeout = setTimeout(() => sendCommand(player, 'player:getQualityList'), 1000);
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
        player.debug.log('MTS Link player ready');
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

      case 'player:error':
        player.media.error = createProviderError(
          'mtslink',
          errorCodes.API_ERROR,
          (data && data.message) || undefined,
        );
        triggerEvent.call(player, player.media, 'error');
        break;

      case 'player:playComplete':
        player.media.paused = true;
        triggerEvent.call(player, player.media, 'ended');
        break;

      default:
        if (player.config.debug) {
          player.debug.log('MTS Link unknown event:', type, data);
        }
        break;
    }
  },

  destroy() {
    destroy.call(this);
  },
};

export default mtslink;
