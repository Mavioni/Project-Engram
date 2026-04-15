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
//
// `import.meta.env.BASE_URL` is injected by Vite from the `base`
// option in vite.config.js. In dev it's '/', in production on
// GitHub Pages it's '/Project-Engram/'. React Router strips the
// trailing slash from basename internally, so passing BASE_URL
// directly is safe.
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
// Scope is set by vite-plugin-pwa to match the `base` path
// (e.g. /Project-Engram/ on GitHub Pages), so the SW only
// intercepts requests under our project subpath.
// ─────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({ immediate: false });
      })
      .catch((err) => {
        // Non-fatal — the app runs fine without a SW, just no offline.
         
        console.warn('[Engram] SW registration skipped:', err);
      });
  });
}
