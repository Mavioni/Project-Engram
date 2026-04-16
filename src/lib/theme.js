// ─────────────────────────────────────────────────────────────
// Theme — light / dark mode driven by a `data-theme` attribute
// on <html>. The Zustand store holds the canonical preference;
// this module keeps the DOM in sync.
// ─────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useStore } from './store.js';

/**
 * Apply a theme value to <html>. Safe to call before React mounts
 * — used in main.jsx to avoid a flash of the wrong theme.
 */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  // Keep <meta name="theme-color"> in sync so browser chrome
  // (iOS status bar, Android taskbar) matches the page.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', next === 'dark' ? '#06060e' : '#f5f4ee');
  }
}

/**
 * React hook: reads theme from the store and keeps the DOM in sync
 * whenever it changes. Mount once (in App or main) and it listens
 * forever.
 */
export function useThemeEffect() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
}

/**
 * Hook that exposes the current theme + a setter.
 * Components use `const { theme, toggle, set } = useTheme();`.
 */
export function useTheme() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  return {
    theme,
    set: setTheme,
    toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
}
