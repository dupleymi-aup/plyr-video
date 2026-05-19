// ==========================================================================
// String utils
// ==========================================================================

import is from './is';

// Generate a unique ID
export function generateId(prefix) {
  // Use crypto.randomUUID if available (browser environment)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  // Fallback: use higher entropy random string
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${randomPart}`;
}

// Format string
export function format(input, ...args) {
  if (is.empty(input)) return input;

  return input.toString().replace(/\{(\d+)\}/g, (_, i) => args[i].toString());
}

// Get percentage
export function getPercentage(current, max) {
  if (current === 0 || max === 0 || Number.isNaN(current) || Number.isNaN(max)) {
    return 0;
  }

  return ((current / max) * 100).toFixed(2);
}

// Replace all occurrences of a string in a string
export function replaceAll(input = '', find = '', replace = '') {
  // Use native replaceAll if available (ES2021+)
  if (typeof input.replaceAll === 'function') {
    return input.replaceAll(find.toString(), replace.toString());
  }
  // Fallback for older environments
  return input.replace(new RegExp(find.toString().replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1'), 'g'), replace.toString());
}

// Convert to title case
export function toTitleCase(input = '') {
  return input.toString().replace(/\w\S*/g, text => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase());
}

// Convert string to pascalCase
export function toPascalCase(input = '') {
  let string = input.toString();

  // Convert kebab case
  string = replaceAll(string, '-', ' ');

  // Convert snake case
  string = replaceAll(string, '_', ' ');

  // Convert to title case
  string = toTitleCase(string);

  // Convert to pascal case
  return replaceAll(string, ' ', '');
}

// Convert string to pascalCase
export function toCamelCase(input = '') {
  let string = input.toString();

  // Convert to pascal case
  string = toPascalCase(string);

  // Convert first character to lowercase
  return string.charAt(0).toLowerCase() + string.slice(1);
}

// Remove HTML from a string
export function stripHTML(source) {
  // Use regex to strip tags safely without executing scripts
  return source
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&apos;/g, '\'');
}

// Like outerHTML, but also works for DocumentFragment
export function getHTML(element) {
  const wrapper = document.createElement('div');
  wrapper.appendChild(element);
  return wrapper.innerHTML;
}
