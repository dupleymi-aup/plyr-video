// ==========================================================================
// Plyr controls: Backward-compatibility proxy
// ==========================================================================
// This module exports a plain object that mimics the old controls object literal.
// All existing callers (controls.method.call(this.player, ...)) work unchanged.
// ==========================================================================

import Controls from './controls';

// List of all public method names
const methodNames = [
  'getIconUrl',
  'createIcon',
  'createLabel',
  'createBadge',
  'createButton',
  'createRange',
  'createProgress',
  'createTime',
  'bindMenuItemShortcuts',
  'createMenuItem',
  'formatTime',
  'updateTimeDisplay',
  'timeUpdate',
  'durationUpdate',
  'updateVolume',
  'setRange',
  'updateProgress',
  'updateRangeFill',
  'updateSeekTooltip',
  'toggleMenuButton',
  'updateSetting',
  'getLabel',
  'checkMenu',
  'focusFirstMenuItem',
  'toggleMenu',
  'getMenuSize',
  'showMenuPanel',
  'setQualityMenu',
  'setSpeedMenu',
  'setCaptionsMenu',
  'setTranslationMenu',
  'setTranscriptionMenu',
  'updateTranscriptionMenu',
  'updateTranslationMenu',
  'setMarkers',
  'setDownloadUrl',
  'setMediaMetadata',
  'findElements',
  'create',
  'inject',
];

// Create the proxy object
const controls = {
  idCounter: 0,
};

// Cache one Controls instance per player to avoid re-instantiating sub-modules on every call
const controlsCache = new WeakMap();

// For each method, create a wrapper that reuses the cached Controls instance
for (const name of methodNames) {
  controls[name] = function (...args) {
    // 'this' is the Plyr instance (from .call(this.player, ...))
    let instance = controlsCache.get(this);
    if (!instance) {
      instance = new Controls(this);
      controlsCache.set(this, instance);
    }
    // Sync the static idCounter back to the proxy
    controls.idCounter = Controls.idCounter;
    return instance[name](...args);
  };
}

export default controls;
