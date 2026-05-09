import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

/** GitHub Pages project sites use `/repo-name/`; user/org pages (`*.github.io`) use `/`. Set `VITE_BASE_PATH` in CI or `.env`. */
function normalizeAppBase(): string {
  const raw = process.env.VITE_BASE_PATH?.trim()
  if (raw === undefined || raw === '' || raw === '/') return '/'
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

const base = normalizeAppBase()

const webManifest = JSON.parse(
  readFileSync(path.join(rootDir, 'manifest.json'), 'utf-8'),
) as Record<string, unknown>

// https://vite.dev/config/
export default defineConfig({
  base,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom')) return 'vendor-react-dom'
          if (id.includes('/node_modules/react/')) return 'vendor-react'
          if (id.includes('node_modules/react-router')) return 'vendor-router'
          if (id.includes('node_modules/dexie')) return 'vendor-dexie'
          if (id.includes('node_modules/date-fns')) return 'vendor-date-fns'
          if (id.includes('node_modules/@radix-ui')) return 'vendor-radix'
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons'
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['Student-Story-logo.png', 'Student-Story-logo-192.png', 'Student-Story-logo-512.png'],
      manifest: {
        ...webManifest,
        start_url: base,
        scope: base,
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      /** Without this, no service worker in `npm run dev` → no install prompt on localhost. */
      devOptions: {
        enabled: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
})
