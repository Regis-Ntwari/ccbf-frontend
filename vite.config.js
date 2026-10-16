import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

/**
 * Vite configuration.
 *
 * Plugin order matters: the TanStack Router plugin must run before the React
 * plugin so file-based route generation and code-splitting work.
 */
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(process.env['npm_package_version'] ?? '0.1.0') },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      disableTypes: true,
      generatedRouteTree: './src/routeTree.gen.js',
    }),
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Construction Cost & BOQ Platform',
        short_name: 'CostBOQ',
        description: 'Instant construction budgets for clients, auditable BOQs for professionals.',
        theme_color: '#252724',
        background_color: '#F8F7F3',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'en',
        categories: ['business', 'productivity', 'utilities'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'New estimate', url: '/estimate/new', description: 'Start a rough budget' },
          { name: 'What can I build?', url: '/budget', description: 'Reverse budget' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Reference data changes rarely: serve from cache, refresh in background.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/catalogue') || url.pathname.startsWith('/api/locations'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-catalogue',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // Projects and estimates: network first so pros always see fresh numbers.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/projects') || url.pathname.startsWith('/api/estimates'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-projects',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
  build: {
    sourcemap: true,
    // No manual vendor chunking: splitting node_modules by package created a circular
    // dependency between chunks (the CommonJS interop helper ran before its chunk was
    // initialised, blank screen in production). Routes are already code-split by the
    // router plugin; Rollup shares the heavy libraries between them on its own.
    chunkSizeWarningLimit: 900,
  },
})
