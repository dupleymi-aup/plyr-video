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

// For each method, create a wrapper that instantiates Controls with the player
// context (this from .call()) and delegates
for (const name of methodNames) {
  controls[name] = function (...args) {
    // 'this' is the Plyr instance (from .call(this.player, ...))
    const controlsInstance = new Controls(this);
    // Sync the static idCounter back to the proxy
    controls.idCounter = Controls.idCounter;
    return controlsInstance[name](...args);
  };
}

export default controls;
