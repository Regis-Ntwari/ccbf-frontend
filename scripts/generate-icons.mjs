/**
 * Generates PWA icons (PNG) without native dependencies.
 * Draws a simple house mark on the brand colour using a hand-rolled PNG encoder.
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const BRAND = [0x25, 0x27, 0x24]
const WHITE = [0xe9, 0xe5, 0xdb]
const ACCENT = [0xb5, 0x6f, 0x50]

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function encodePng(size, pixel) {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y)
      const i = y * (size * 3 + 1) + 1 + x * 3
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** House silhouette: triangle roof + body + door, scaled to `size`, within a safe zone. */
function housePainter(size, padding) {
  const s = (v) => v * size
  const roofTop = s(0.5 - padding) // y of apex
  const roofBase = s(0.5 + (0.5 - padding) * 0.1)
  const bodyBottom = s(1 - padding)
  const left = s(padding)
  const right = s(1 - padding)
  const bodyLeft = s(padding + (1 - 2 * padding) * 0.15)
  const bodyRight = s(1 - padding - (1 - 2 * padding) * 0.15)
  const doorW = (bodyRight - bodyLeft) * 0.22
  const doorL = s(0.5) - doorW / 2
  const doorTop = bodyBottom - (bodyBottom - roofBase) * 0.55
  return (x, y) => {
    // roof triangle
    const cx = s(0.5)
    const t = (y - roofTop) / (roofBase - roofTop)
    if (y >= roofTop && y <= roofBase && Math.abs(x - cx) <= t * (right - left) / 2) return WHITE
    // body
    if (y > roofBase && y <= bodyBottom && x >= bodyLeft && x <= bodyRight) {
      if (x >= doorL && x <= doorL + doorW && y >= doorTop) return ACCENT
      return WHITE
    }
    return BRAND
  }
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', encodePng(192, housePainter(192, 0.18)))
writeFileSync('public/icons/icon-512.png', encodePng(512, housePainter(512, 0.18)))
// Maskable icons need a larger safe zone (content inside the central 80%).
writeFileSync('public/icons/icon-512-maskable.png', encodePng(512, housePainter(512, 0.28)))
console.log('icons written to public/icons')
