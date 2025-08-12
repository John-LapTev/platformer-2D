import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Super Adventure Game',
        short_name: 'Adventure',
        description: 'Эпическая платформенная игра',
        theme_color: '#2c3e50',
        background_color: '#667eea',
        display: 'fullscreen',
        orientation: 'landscape',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true,
    hmr: {
      clientPort: 443
    },
    proxy: {},
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    // Разрешаем все хосты для туннелей
    allowedHosts: [
      '.loca.lt',
      '.localhost',
      'localhost',
      '.ngrok.io',
      '.ngrok-free.app'
    ]
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  }
});