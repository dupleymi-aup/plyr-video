// ==========================================================================
// Mail.ru Video plugin
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
  handleCurrentTime,
} from './base-embed';

// Parse Mail.ru Video ID from URL
function parseId(url) {
  if (is.empty(url)) {
    return null;
  }

  // Match: my.mail.ru/video/embed/ID or api.video.mail.ru/videos/embed/ID
  const embedRegex = /(?:my\.mail\.ru\/video\/embed\/|api\.video\.mail\.ru\/videos\/embed\/)([^?]+)/i;
  const embedMatch = url.match(embedRegex);
  if (embedMatch) {
    return embedMatch[1];
  }

  // Match: my.mail.ru/mail/user/_myvideo/123
  const oldRegex = /my\.mail\.ru\/mail\/([^/]+)\/_myvideo\/(\d+)/i;
  const oldMatch = url.match(oldRegex);
  if (oldMatch) {
    return `mail/${oldMatch[1]}/_myvideo/${oldMatch[2]}`;
  }

  // Match: my.mail.ru/mail/user/video/abc123
  const videoRegex = /my\.mail\.ru\/(?:mail|community|bk|list\.ru)\/([^/]+)\/video\/([^/?#]+)/i;
  const videoMatch = url.match(videoRegex);
  if (videoMatch) {
    return `${videoMatch[1]}/${videoMatch[2]}`;
  }

  return url;
}

// Resolve embed URL from video ID
function getEmbedUrl(videoId) {
  if (videoId.includes('mail/') || videoId.includes('bk/') || videoId.includes('inbox/') || videoId.includes('list.ru/')) {
    return `https://api.video.mail.ru/videos/embed/${videoId}`;
  }
  return `https://my.mail.ru/video/embed/${videoId}`;
}

// Parse Mail.ru postMessage (mixed format: JSON objects, plain strings, or regex-matchable strings)
function parseMailruMessage(event) {
  const { data } = event;

  // Try JSON parse first (structured messages)
  if (is.string(event.data)) {
    try {
      const msg = JSON.parse(event.data);
      if (msg && msg.type) {
        return { type: msg.type, data: msg.data || {} };
      }
    }
    catch {
      // Not JSON — handle as plain string below
    }

    // Plain string events: "play", "started", "pause", "ended", etc.
    const str = event.data;
    if (/\b(?:play|started)\b/i.test(str)) {
      return { type: 'playing', data: {} };
    }
    if (/\b(?:pause|paused)\b/i.test(str)) {
      return { type: 'pause', data: {} };
    }
    if (/\b(?:end|complete|finished)\b/i.test(str)) {
      return { type: 'ended', data: {} };
    }
  }

  // Object format
  if (is.object(data) && (data.type || data.event)) {
    return { type: data.type || data.event, data: data.data || data };
  }

  return null;
}

const mailru = {
  setup() {
    baseSetup.call(this, mailru);
  },

  ready() {
    const player = this;
    const config = player.config.mailru;

    let source = player.media.getAttribute('src');
    if (is.empty(source)) {
      source = player.media.getAttribute(player.config.attributes.embed.id);
    }

    const videoId = parseId(source);
    if (is.empty(videoId)) {
      player.debug.error('Mail.ru Video: No valid video ID found');
      return;
    }

    const embedUrl = getEmbedUrl(videoId);
    const params = [];
    if (config.autoplay) params.push('autoplay=1');
    params.push('wmode=opaque');

    createEmbed(mailru, {
      player,
      videoId,
      embedUrl,
      params,
      allowedOrigins: ['https://my.mail.ru', 'https://api.video.mail.ru', 'https://video.mail.ru'],
      handleMessage: mailru.handleMessage,
      parseMessage: parseMailruMessage,
      label: 'Mail.ru Video',
    });

    // Mail.ru uses raw string commands: 'play', 'pause', 'seek', etc.
    defineMediaControls(player, {
      play: () => {
        assurePlaybackState.call(player, true);
        sendCommand(player, 'play');
      },
      pause: () => {
        assurePlaybackState.call(player, false);
        sendCommand(player, 'pause');
      },
      stop: () => {
        player.pause();
        player.currentTime = 0;
        sendCommand(player, 'stop');
      },
    });

    // Mail.ru-specific property overrides (limited API)
    let speed = player.config.speed.selected;
    let { volume } = player.config;
    let { muted } = player.config;

    defineMediaProperties(player, videoId, embedUrl, {
      currentTime: {
        get() {
          return player.embed.currentTime || 0;
        },
        set(time) {
          const { media } = player;
          media.seeking = true;
          triggerEvent.call(player, media, 'seeking');
          sendCommand(player, 'seek', { time });
        },
      },
      playbackRate: {
        get() {
          return speed;
        },
        set(input) {
          // Mail.ru doesn't support speed control via API
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
          sendCommand(player, 'setVolume', { volume: input });
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
          sendCommand(player, toggle ? 'mute' : 'unmute');
          triggerEvent.call(player, player.media, 'volumechange');
        },
      },
      currentSrc: {
        get() {
          return embedUrl;
        },
      },
      quality: {
        get() {
          return player.embed.currentQuality || null;
        },
        set(input) {
          // Mail.ru doesn't expose quality via API — local tracking only
          if (input) {
            player.embed.currentQuality = input;
            triggerEvent.call(player, player.media, 'qualitychange', false, { quality: input });
          }
        },
      },
    });

    // Rebuild UI
    if (config.customControls) {
      setTimeout(() => ui.build.call(player), 0);
    }
  },

  handleMessage(msg) {
    const player = this;
    const { type, data } = msg;

    switch (type) {
      case 'ready':
      case 'player:ready':
        player.debug.log('Mail.ru Video player ready');
        player.embed.state = 'ready';
        triggerEvent.call(player, player.media, 'timeupdate');
        break;

      case 'playing':
      case 'player:playing':
        assurePlaybackState.call(player, true);
        triggerEvent.call(player, player.media, 'playing');
        player.embed.state = 'playing';
        break;

      case 'pause':
      case 'player:pause':
        assurePlaybackState.call(player, false);
        player.embed.state = 'paused';
        break;

      case 'ended':
      case 'player:ended':
      case 'complete':
        player.media.paused = true;
        triggerEvent.call(player, player.media, 'ended');
        player.embed.state = 'ended';
        break;

      case 'timeupdate':
      case 'player:timeupdate':
        handleCurrentTime(player, data);
        break;

      case 'durationchange':
      case 'player:durationChange':
        if (data && is.number(data.duration)) {
          player.media.duration = data.duration;
          triggerEvent.call(player, player.media, 'durationchange');
        }
        break;

      case 'volumechange':
      case 'player:volumeChange':
        if (data && is.number(data.volume)) {
          player.media.volume = data.volume;
        }
        triggerEvent.call(player, player.media, 'volumechange');
        break;

      case 'error':
      case 'player:error':
        player.media.error = {
          code: (data && data.code) ? data.code : 1,
          message: (data && data.message) || 'Mail.ru Video playback error',
        };
        triggerEvent.call(player, player.media, 'error');
        player.embed.state = 'error';
        break;

      default:
        if (player.config.debug) {
          player.debug.log('Mail.ru Video unknown event:', type, data);
        }
        break;
    }
  },

  destroy() {
    destroy.call(this);
  },
};

export default mailru;
