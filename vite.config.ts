import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

const ONNX_WASM_FILES = [
  'ort-wasm.wasm',
  'ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm',
  'ort-wasm-simd-threaded.wasm',
] as const

/** ONNX Runtime loads .wasm next to the bundle; Vite does not emit them unless we copy from node_modules. */
function copyOnnxWasmFiles(): void {
  const srcDir = path.join(rootDir, 'node_modules/onnxruntime-web/dist')
  const destDir = path.join(rootDir, 'public/onnx')
  if (!existsSync(srcDir)) return
  mkdirSync(destDir, { recursive: true })
  for (const f of ONNX_WASM_FILES) {
    const from = path.join(srcDir, f)
    if (existsSync(from)) cpSync(from, path.join(destDir, f))
  }
}

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
          if (id.includes('node_modules/@xenova/transformers')) return 'vendor-transformers'
          if (id.includes('node_modules/onnxruntime-web')) return 'vendor-onnxruntime'
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-onnx-wasm',
      buildStart() {
        copyOnnxWasmFiles()
      },
      configureServer() {
        copyOnnxWasmFiles()
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['Student-Story-logo.png', 'Student-Story-logo-192.png', 'Student-Story-logo-512.png'],
      manifest: {
        ...webManifest,
        start_url: base,
        scope: base,
      },
      workbox: {
        /** WASM is ~10MB each; skip precache (2MB Workbox default). Served from `/onnx/` at runtime. */
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
