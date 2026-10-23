// Universal Tablet / iPad / WebKit ResizeObserver Polyfill
import ResizeObserverPolyfill from 'resize-observer-polyfill';

if (typeof window !== 'undefined') {
  if (!window.ResizeObserver) {
    window.ResizeObserver = ResizeObserverPolyfill;
  }
  if (typeof global !== 'undefined' && !global.ResizeObserver) {
    global.ResizeObserver = ResizeObserverPolyfill;
  }

  // Suppress benign WebKit/Safari ResizeObserver loop notifications error
  const origError = window.console.error;
  window.console.error = (...args) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      (args[0].includes('ResizeObserver loop') ||
        args[0].includes('undelivered notifications'))
    ) {
      return;
    }
    origError.apply(window.console, args);
  };

  window.addEventListener('error', (e) => {
    if (
      e.message &&
      (e.message.includes('ResizeObserver loop limit exceeded') ||
        e.message.includes('ResizeObserver loop completed with undelivered notifications'))
    ) {
      e.stopImmediatePropagation();
    }
  });
}

export default (typeof window !== 'undefined' && window.ResizeObserver) ? window.ResizeObserver : ResizeObserverPolyfill;
