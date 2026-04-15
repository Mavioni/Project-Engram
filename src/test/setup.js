import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 25 ships an experimental native `localStorage` (controlled by
// `--localstorage-file`). When the flag is absent, Node still installs a
// broken stub on `globalThis.localStorage` that has no methods, and happy-dom
// doesn't replace it. Install a real in-memory polyfill here so zustand's
// persist middleware and our afterEach cleanup both work.
class MemoryStorage {
  #store = new Map();
  get length() { return this.#store.size; }
  clear() { this.#store.clear(); }
  getItem(key) { return this.#store.has(key) ? this.#store.get(key) : null; }
  setItem(key, value) { this.#store.set(String(key), String(value)); }
  removeItem(key) { this.#store.delete(key); }
  key(index) { return [...this.#store.keys()][index] ?? null; }
}
const memoryLocalStorage = new MemoryStorage();
const memorySessionStorage = new MemoryStorage();

// Override both the global and the window reference. Use
// `Object.defineProperty` for `globalThis` because Node 25 may have installed
// its native localStorage as a non-writable property.
Object.defineProperty(globalThis, 'localStorage', {
  value: memoryLocalStorage,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'sessionStorage', {
  value: memorySessionStorage,
  writable: true,
  configurable: true,
});
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: memoryLocalStorage,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: memorySessionStorage,
    writable: true,
    configurable: true,
  });
}

// Each test starts with a clean DOM and a clean localStorage — the
// zustand store's `persist` middleware writes to localStorage, so leaks
// between tests would cause "one test hydrates another's state" flakes.
afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom doesn't implement matchMedia, IntersectionObserver, or
// ResizeObserver. Recharts and the PWA register both touch these on
// mount — stubbing here keeps render smoke tests from crashing.
beforeEach(() => {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    };
  }
});
