import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { version } from './package.json'

export default defineConfig({
  define: {
    APP_VERSION: JSON.stringify(version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon-32x32.png',
        'favicon-16x16.png',
        'apple-touch-icon-180x180.png',
        'fonts/*.woff2',
      ],
      manifest: {
        name: 'LLESNOTE-1 Tuner',
        short_name: 'Tuner',
        description: 'Chromatic guitar tuner with multiple tuning presets. Works offline.',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/tuner/',
        start_url: '/tuner/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
  base: '/tuner/',
  server: {
    host: true,
  },
})
