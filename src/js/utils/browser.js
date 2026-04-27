// ==========================================================================
// Browser sniffing
// Unfortunately, due to mixed support, UA sniffing is required
// ==========================================================================

const isIE = Boolean(window.document.documentMode);

// Chromium-based Edge (Edg/) vs legacy EdgeHTML (Edge/)
const isEdgeLegacy = /Edge\//.test(navigator.userAgent);
const isEdgeChromium = /Edg\//.test(navigator.userAgent);
const isEdge = isEdgeLegacy || isEdgeChromium;

const isWebKit = 'WebkitAppearance' in document.documentElement.style && !isEdgeLegacy;

const isIPhone = /iPhone|iPod/i.test(navigator.userAgent);

// iPadOS 13+ reports as MacIntel with multitouch — detect iPad and iPadOS
const isIPadOS =
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
  /iPad/i.test(navigator.userAgent);

const isIos = isIPhone || isIPadOS;

export default {
  isIE,
  isEdge,
  isEdgeLegacy,
  isEdgeChromium,
  isWebKit,
  isIPhone,
  isIPadOS,
  isIos,
};
