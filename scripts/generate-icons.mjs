import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE = resolve(__dirname, '../..', '..', 'Documents', 'tuner-logo-icon.PNG')
const OUT = resolve(__dirname, '../public')
const BG = { r: 26, g: 26, b: 26, alpha: 1 } // #1a1a1a

const icons = [
  { name: 'favicon-32x32.png', size: 32, padding: 2 },
  { name: 'favicon-16x16.png', size: 16, padding: 1 },
  { name: 'apple-touch-icon-180x180.png', size: 180, padding: 24 },
  { name: 'pwa-192x192.png', size: 192, padding: 26 },
  { name: 'pwa-512x512.png', size: 512, padding: 64 },
  { name: 'pwa-512x512-maskable.png', size: 512, padding: 100 },
]

for (const icon of icons) {
  const innerSize = icon.size - icon.padding * 2

  const resized = await sharp(SOURCE)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  await sharp({
    create: { width: icon.size, height: icon.size, channels: 4, background: BG },
  })
    .composite([{ input: resized, gravity: 'centre' }])
    .png()
    .toFile(resolve(OUT, icon.name))

  console.log(`✓ ${icon.name} (${icon.size}x${icon.size}, padding ${icon.padding}px)`)
}

// Copy as favicon.png for browser
const fav32 = await sharp(resolve(OUT, 'favicon-32x32.png')).toBuffer()
await sharp(fav32).toFile(resolve(OUT, 'favicon.png'))
console.log('✓ favicon.png')

console.log('\nDone!')
