// ==========================================================================
// Console wrapper
// ==========================================================================

function noop() {}

export default class Console {
  constructor(enabled = false) {
    this.enabled = window.console && enabled;

    // Cache bound functions once to avoid allocating new closures on every access
    if (this.enabled) {
      // eslint-disable-next-line no-console
      this._log = Function.prototype.bind.call(console.log, console);
      this._warn = Function.prototype.bind.call(console.warn, console);
      this._error = Function.prototype.bind.call(console.error, console);
      this.log('Debugging enabled');
    }
    else {
      this._log = noop;
      this._warn = noop;
      this._error = noop;
    }
  }

  get log() {
    return this._log;
  }

  get warn() {
    return this._warn;
  }

  get error() {
    return this._error;
  }
}
