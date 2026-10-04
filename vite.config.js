import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { viteAiMiddleware } from './scripts/viteAiMiddleware.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      viteAiMiddleware(env),
      VitePWA({
      disable: mode === 'app-check',
      registerType: 'autoUpdate',
      includeAssets: ['t9dya-icon.svg'],
      manifest: {
        name: 'Notre espace - T9dya et Hwayj',
        short_name: 'Notre espace',
        description: 'Courses, budget du foyer et dressing personnel.',
        id: '/',
        theme_color: '#0f766e',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        icons: [
          {
            src: '/t9dya-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,woff2}']
      }
      })
    ]
  }
})
