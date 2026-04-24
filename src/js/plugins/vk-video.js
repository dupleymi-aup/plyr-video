// ==========================================================================
// VK Video plugin
// ==========================================================================

import ui from '../ui';
import { triggerEvent } from '../utils/events';
import is from '../utils/is';
import sendCommand from '../utils/post-message';
import {
  assurePlaybackState,
  baseSetup,
  createEmbed,
  defineMediaControls,
  defineMediaProperties,
  destroy,
  fetchTitle,
  handleCaptionList,
  handleCueChange,
  handleCurrentTime,
} from './base-embed';

// VK quality HD values mapping
const VK_HD_TO_RESOLUTION = { 1: 360, 2: 480, 3: 720, 4: 1080 };
const VK_RESOLUTION_TO_HD = { 360: 1, 480: 2, 720: 3, 1080: 4 };

// Parse VK Video ID from URL
function parseId(url) {
  if (is.empty(url)) {
    return null;
  }

  // Match: vk.com/video?oid=-123&id=456 or vk.ru/video_ext.php?oid=...&id=...
  const oidMatch = url.match(/[?&]oid=([^&]+)/i);
  const idMatch = url.match(/[?&]id=([^&]+)/i);
  if (oidMatch && idMatch) {
    const hashMatch = url.match(/[?&]hash=([^&]+)/i);
    const hash = hashMatch ? `&hash=${hashMatch[1]}` : '';
    return `oid=${oidMatch[1]}&id=${idMatch[1]}${hash}`;
  }

  // Match: video-123_456 (standard format)
  const videoMatch = url.match(/video(-?\d+)_(\d+)/i);
  if (videoMatch) {
    return `oid=${videoMatch[1]}&id=${videoMatch[2]}`;
  }

  // Match: clip-123_456 (VK Clips format)
  const clipMatch = url.match(/clip(-?\d+)_(\d+)/i);
  if (clipMatch) {
    return `oid=${clipMatch[1]}&id=${clipMatch[2]}&is_clip=1`;
  }

  // Match: z=video-123_456 (video list format)
  const zMatch = url.match(/[?&]z=video(-?\d+)_(\d+)/i);
  if (zMatch) {
    return `oid=${zMatch[1]}&id=${zMatch[2]}`;
  }

  return url;
}

// Parse VK postMessage format (objects/strings, not JSON { type, data })
function parseVKMessage(event) {
  const { data } = event;

  // VK sends objects or strings directly (not JSON-encoded)
  if (is.object(data) && (data.event || data.type)) {
    return { type: data.event || data.type, data };
  }

  // String events: "started", "paused", "ended", "vk_video:started"
  if (is.string(data)) {
    const eventType = data.includes(':') ? data : `vk_video:${data}`;
    return { type: eventType, data: {} };
  }

  return null;
}

const vk = {
  setup() {
    baseSetup.call(this, vk);
  },

  getTitle(oid, videoId) {
    fetchTitle.call(this, `https://vk.ru/al_video.php?act=show&al=1&video=${oid}_${videoId}`, 'VK Video');
  },

  ready() {
    const player = this;
    const config = player.config.vk;

    let source = player.media.getAttribute('src');
    if (is.empty(source)) {
      source = player.media.getAttribute(player.config.attributes.embed.id);
    }

    const videoParams = parseId(source);
    if (is.empty(videoParams)) {
      player.debug.error('VK Video: No valid video ID found');
      return;
    }

    const oidMatch = videoParams.match(/oid=([^&]+)/);
    const idMatch = videoParams.match(/id=([^&]+)/);
    const oid = oidMatch ? oidMatch[1] : '';
    const videoId = idMatch ? idMatch[1] : '';

    const embedUrl = `https://vk.ru/video_ext.php?${videoParams}&js_api=1`;
    const params = [];
    if (config.autoplay) params.push('autoplay=1');
    if (config.hd) params.push(`hd=${config.hd}`);
    if (config.startTime) params.push(`t=${config.startTime}`);

    createEmbed(vk, {
      player,
      videoId: videoParams,
      embedUrl,
      params,
      allowedOrigins: ['https://vk.com', 'https://vk.ru', 'https://userapi.com'],
      handleMessage: vk.handleMessage,
      parseMessage: parseVKMessage,
      label: 'VK Video',
    });

    // VK uses { method, params } format for commands
    defineMediaControls(player, {
      play: () => {
        assurePlaybackState.call(player, true);
        sendCommand(player, { method: 'play', params: [] });
      },
      pause: () => {
        assurePlaybackState.call(player, false);
        sendCommand(player, { method: 'pause', params: [] });
      },
      stop: () => {
        player.pause();
        player.currentTime = 0;
        sendCommand(player, { method: 'stop', params: [] });
      },
    });

    // VK-specific property overrides
    let speed = player.config.speed.selected;
    let { volume } = player.config;
    let { muted } = player.config;

    defineMediaProperties(player, videoParams, embedUrl, {
      currentTime: {
        get() {
          return player.embed.currentTime || 0;
        },
        set(time) {
          const { media } = player;
          media.seeking = true;
          triggerEvent.call(player, media, 'seeking');
          sendCommand(player, { method: 'seek', params: [time] });
        },
      },
      playbackRate: {
        get() {
          return speed;
        },
        set(input) {
          // VK doesn't support speed control via API
          speed = input;
          triggerEvent.call(player, player.media, 'ratechange');
        },
      },
      volume: {
        get() {
          return volume;
        },
        set(input) {
          volume = input;
          sendCommand(player, { method: 'setVolume', params: [input] });
          triggerEvent.call(player, player.media, 'volumechange');
        },
      },
      muted: {
        get() {
          return muted;
        },
        set(input) {
          const toggle = is.boolean(input) ? input : false;
          muted = toggle;
          sendCommand(player, { method: toggle ? 'mute' : 'unmute', params: [] });
          triggerEvent.call(player, player.media, 'volumechange');
        },
      },
      currentSrc: {
        get() {
          return `https://vk.ru/video_ext.php?${videoParams}`;
        },
      },
      quality: {
        get() {
          return player.embed.currentQuality || null;
        },
        set(input) {
          if (input) {
            const hd = VK_RESOLUTION_TO_HD[input];
            if (hd) {
              sendCommand(player, { method: 'setQuality', params: [hd] });
            }
          }
        },
      },
    });

    // Get title
    if (oid && videoId) {
      vk.getTitle.call(player, oid, videoId);
    }

    // Request captions after delay
    player.embed.captionTimeout = setTimeout(() => {
      sendCommand(player, { method: 'getCaptions', params: [] });
    }, 1500);

    // Rebuild UI
    if (config.customControls) {
      setTimeout(() => ui.build.call(player), 0);
    }
  },

  handleMessage(msg) {
    const player = this;
    const { type, data } = msg;

    switch (type) {
      case 'vk_video:inited':
      case 'inited':
        player.debug.log('VK Video player inited');
        player.embed.state = 'inited';
        break;

      case 'vk_video:started':
      case 'vk_video:resumed':
      case 'started':
      case 'resumed':
        assurePlaybackState.call(player, true);
        triggerEvent.call(player, player.media, 'playing');
        player.embed.state = 'playing';
        break;

      case 'vk_video:paused':
      case 'paused':
        assurePlaybackState.call(player, false);
        player.embed.state = 'paused';
        break;

      case 'vk_video:ended':
      case 'ended':
        player.media.paused = true;
        triggerEvent.call(player, player.media, 'ended');
        player.embed.state = 'ended';
        break;

      case 'vk_video:timeupdate':
      case 'timeupdate':
        handleCurrentTime(player, data);
        break;

      case 'vk_video:volumechange':
      case 'volumechange':
        if (data && is.number(data.volume)) {
          player.media.volume = data.volume;
        }
        if (data && is.boolean(data.mute)) {
          player.media.muted = data.mute;
        }
        triggerEvent.call(player, player.media, 'volumechange');
        break;

      case 'vk_video:qualitychange':
      case 'qualitychange':
        if (data && data.quality) {
          player.embed.currentQuality = VK_HD_TO_RESOLUTION[data.quality] || null;
          triggerEvent.call(player, player.media, 'qualitychange', false, {
            quality: player.embed.currentQuality,
          });
        }
        break;

      case 'vk_video:captionList':
      case 'captionList':
        handleCaptionList(player, data);
        break;

      case 'vk_video:cueChange':
      case 'cueChange':
        handleCueChange(player, data);
        break;

      case 'vk_video:error':
      case 'error':
        player.media.error = {
          code: (data && data.code) || 1,
          message: (data && data.message) || 'VK Video playback error',
        };
        triggerEvent.call(player, player.media, 'error');
        player.embed.state = 'error';
        break;

      case 'vk_video:adStarted':
      case 'adStarted':
        triggerEvent.call(player, player.media, 'adsstarted');
        break;

      case 'vk_video:adCompleted':
      case 'adCompleted':
        triggerEvent.call(player, player.media, 'adscompleted');
        break;

      default:
        if (player.config.debug) {
          player.debug.log('VK Video unknown event:', type, data);
        }
        break;
    }
  },

  destroy() {
    destroy.call(this);
  },
};

export default vk;
