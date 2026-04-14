import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = resolve(__dirname, '../public/favicon.svg')
const outDir = resolve(__dirname, '../public')
const svg = readFileSync(svgPath)

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
]

for (const { name, size } of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, name))
  console.log(`Generated ${name}`)
}

// Maskable icon: 512x512 with 20% padding on #1a1a1a background
const iconSize = Math.round(512 * 0.8)
const padding = Math.round((512 - iconSize) / 2)
const iconBuffer = await sharp(svg).resize(iconSize, iconSize).png().toBuffer()

await sharp({
  create: { width: 512, height: 512, channels: 4, background: { r: 26, g: 26, b: 26, alpha: 1 } },
})
  .composite([{ input: iconBuffer, left: padding, top: padding }])
  .png()
  .toFile(resolve(outDir, 'pwa-512x512-maskable.png'))

console.log('Generated pwa-512x512-maskable.png')
