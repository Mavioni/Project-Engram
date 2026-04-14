import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider } from './lib/auth.jsx';
import './styles/global.css';

// ─────────────────────────────────────────────────────────────
// Mount React, replacing the inline #engram-boot indicator from
// index.html.
// ─────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
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
// On a fresh Netlify Drop deploy this was causing the tab to
// look like it was "still loading" while Workbox precached
// ~1.5 MB in the background. Now the page is interactive first;
// the SW installs once the user already has something to look at.
// ─────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({ immediate: false });
      })
      .catch((err) => {
        // Non-fatal — the app runs fine without a SW, just no offline.
        // eslint-disable-next-line no-console
        console.warn('[Engram] SW registration skipped:', err);
      });
  });
}
