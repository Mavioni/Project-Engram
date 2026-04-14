import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// ─────────────────────────────────────────────────────────────
// Engram — Vite build config
// Produces a static, PWA-installable bundle in dist/.
// Drop dist/ onto app.netlify.com/drop to deploy.
// ─────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Do NOT inline a blocking <script src="/registerSW.js"> into
      // index.html — src/main.jsx imports `virtual:pwa-register` and
      // calls it inside window.addEventListener('load', ...) so the
      // SW install never competes with the main bundle for bandwidth
      // on first paint.
      injectRegister: false,
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'robots.txt',
        '.well-known/assetlinks.json',
      ],
      manifest: {
        name: 'Engram — Catalog Yourself',
        short_name: 'Engram',
        description:
          'A living catalog of you. Track your mood, your activities, your ideas — and meet your IRIS: a 24-facet personality map with Claude-powered insights.',
        theme_color: '#06060e',
        background_color: '#06060e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['health', 'lifestyle', 'productivity'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Three.js pushes us over the default 2 MB budget.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/gh\/twitter\/twemoji/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'twemoji',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          charts: ['recharts'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
