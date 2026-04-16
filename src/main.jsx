import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { applyTheme } from './lib/theme.js';
import './styles/global.css';

// ─────────────────────────────────────────────────────────────
// Apply the persisted theme to <html> BEFORE React mounts so
// there's no flash of the wrong background. We read the raw
// localStorage envelope (same key zustand/persist uses) so we
// don't need to spin up the full store just for this.
// ─────────────────────────────────────────────────────────────
try {
  const raw = localStorage.getItem('engram.v1');
  if (raw) {
    const parsed = JSON.parse(raw);
    const theme = parsed?.state?.theme;
    applyTheme(theme === 'dark' ? 'dark' : 'light');
  } else {
    applyTheme('light');
  }
} catch {
  applyTheme('light');
}

// ─────────────────────────────────────────────────────────────
// Mount React, replacing the inline #engram-boot indicator from
// index.html.
// ─────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

// ─────────────────────────────────────────────────────────────
// Service worker — deferred until after `load` so it never
// competes with the main bundle for bandwidth on first paint.
// ─────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({ immediate: false });
      })
      .catch((err) => {
        console.warn('[Engram] SW registration skipped:', err);
      });
  });
}
