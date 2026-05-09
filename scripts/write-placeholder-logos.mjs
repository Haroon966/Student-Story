/**
 * Writes minimal valid PNG placeholders into /public so dev/build work
 * before you drop in real Student-Story-logo*.png files.
 * Replace those files with your 192×192 and 512×512 exports when ready.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64',
)

const publicDir = join(process.cwd(), 'public')
const targets = ['Student-Story-logo.png', 'Student-Story-logo-192.png', 'Student-Story-logo-512.png']

for (const name of targets) {
  writeFileSync(join(publicDir, name), tinyPng)
}

console.log('Wrote placeholder PNGs to public/:', targets.join(', '))
