import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const indexHtml = join(dist, 'index.html')

if (!existsSync(indexHtml)) {
  console.warn('copy-spa-fallback: dist/index.html not found (skip)')
  process.exit(0)
}

copyFileSync(indexHtml, join(dist, '404.html'))
