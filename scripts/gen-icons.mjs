// Renders the sbaby icon to the PNG sizes the PWA manifest needs.
// Usage: node scripts/gen-icons.mjs  (uses Playwright's Chromium; set PW_CHROMIUM_PATH if needed)
import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

const icon = (size, padding) => {
  const cell = (size - padding * 2 - size * 0.06) / 2
  const gap = size * 0.06
  const r = cell * 0.28
  const a = padding
  const b = padding + cell + gap
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#FFFBF6"/>
  <rect x="${a}" y="${a}" width="${cell}" height="${cell}" rx="${r}" fill="#EC7A61"/>
  <rect x="${b}" y="${a}" width="${cell}" height="${cell}" rx="${r}" fill="#6FA8DC"/>
  <rect x="${a}" y="${b}" width="${cell}" height="${cell}" rx="${r}" fill="#F6BF55"/>
  <rect x="${b}" y="${b}" width="${cell}" height="${cell}" rx="${r}" fill="#6FB28C"/>
</svg>`
}

const outputs = [
  ['public/icon-192.png', 192, 0.19],
  ['public/icon-512.png', 512, 0.19],
  ['public/apple-touch-icon.png', 180, 0.19],
  // Maskable icons must keep content inside the central 80% safe zone.
  ['public/icon-maskable-512.png', 512, 0.28],
]

const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {})
const page = await browser.newPage()
for (const [file, size, pad] of outputs) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>html,body{margin:0}</style>${icon(size, size * pad)}`)
  await writeFile(file, await page.screenshot({ omitBackground: false }))
  console.log('wrote', file)
}
await browser.close()
