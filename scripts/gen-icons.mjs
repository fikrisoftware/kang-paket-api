// Rasterisasi build/icon.svg → PNG/ICO/ICNS di resources/ untuk window icon & packaging.
// Jalankan: node scripts/gen-icons.mjs
import sharp from 'sharp'
import png2icons from 'png2icons'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = resolve(root, 'build/icon.svg')
const outDir = resolve(root, 'resources')
mkdirSync(outDir, { recursive: true })

const svg = readFileSync(svgPath)

const png512 = await sharp(svg, { density: 384 }).resize(512, 512).png().toBuffer()
writeFileSync(resolve(outDir, 'icon.png'), png512)

// PNG besar (1024) sebagai sumber ICO/ICNS agar tajam.
const png1024 = await sharp(svg, { density: 512 }).resize(1024, 1024).png().toBuffer()

const ico = png2icons.createICO(png1024, png2icons.BILINEAR, 0, false)
if (ico) writeFileSync(resolve(outDir, 'icon.ico'), ico)

const icns = png2icons.createICNS(png1024, png2icons.BILINEAR, 0)
if (icns) writeFileSync(resolve(outDir, 'icon.icns'), icns)

console.log('Ikon dibuat di resources/: icon.png, icon.ico, icon.icns')
