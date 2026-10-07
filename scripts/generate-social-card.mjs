import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'images', 'richard-kelsey-social-2026.png')
const portrait = await sharp(path.join(root, 'images', 'richard-hero.webp')).png().toBuffer()
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <clipPath id="portrait"><rect x="760" y="112" width="376" height="458" rx="22"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="#0D1117"/>
  <rect width="1200" height="6" fill="#00C853"/>
  <g font-family="Segoe UI, Arial, sans-serif">
    <text x="64" y="81" font-size="32" font-weight="800" fill="#FFFFFF">Ecommerce <tspan fill="#00C853">Teardown</tspan></text>
    <text x="64" y="199" font-size="58" font-weight="800" fill="#FFFFFF">Richard Kelsey</text>
    <text x="64" y="284" font-size="46" font-weight="700" fill="#FFFFFF">Ecommerce growth.</text>
    <text x="64" y="342" font-size="46" font-weight="700" fill="#00C853">Practical AI.</text>
    <text x="64" y="413" font-size="28" fill="#D0D7DE">Independent advice for</text>
    <text x="64" y="453" font-size="28" fill="#D0D7DE">Australian online retailers.</text>
    <text x="64" y="514" font-size="21" font-weight="600" fill="#FFFFFF">Beer Cartel co-founder · 3× Top 50 in AU Ecommerce</text>
    <text x="64" y="579" font-size="24" fill="#D0D7DE">ecommerceteardown.com</text>
  </g>
  <image x="760" y="112" width="376" height="458" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait)" href="data:image/png;base64,${portrait.toString('base64')}"/>
  <rect x="760" y="112" width="376" height="458" rx="22" fill="none" stroke="#30363D" stroke-width="2"/>
</svg>`

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(output)
console.log(path.relative(root, output))
