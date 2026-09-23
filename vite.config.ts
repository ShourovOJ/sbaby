import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// `--mode artifact` builds one self-contained page for claude.ai Artifacts:
// no service worker, relative paths, fonts inlined, no code splitting.
// scripts/artifact-page.mjs then turns it into the page fragment that gets published.
export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact'
  return {
    base: artifact ? './' : '/',
    plugins: [
      react(),
      tailwindcss(),
      !artifact &&
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
          manifest: {
            name: 'sbaby — play & grow',
            short_name: 'sbaby',
            description: 'Daily play games for babies 0–24 months, and a simple way to watch them grow.',
            theme_color: '#FFFBF6',
            background_color: '#FFFBF6',
            display: 'standalone',
            start_url: '.',
            icons: [
              { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
              { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
              { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          },
        }),
    ],
    build: artifact
      ? {
          outDir: 'dist-artifact',
          copyPublicDir: false,
          assetsInlineLimit: 10_000_000,
          cssCodeSplit: false,
          chunkSizeWarningLimit: 1000,
          rolldownOptions: { output: { codeSplitting: false } },
        }
      : { chunkSizeWarningLimit: 600 },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    },
  }
})
