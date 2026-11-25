import '@testing-library/jest-dom';

// Polyfill HTMLMediaElement and IntersectionObserver in jsdom test environments
if (typeof window !== 'undefined') {
  window.HTMLMediaElement.prototype.load = () => {};
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};

  if (!('IntersectionObserver' in window)) {
    (window as any).IntersectionObserver = class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}
