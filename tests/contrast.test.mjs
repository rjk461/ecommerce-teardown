import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PAGES } from '../scripts/site.config.mjs'
import { ROOT, read, exists } from './helpers.mjs'

const lin = (c) => {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const lum = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
}
export const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const DARK = '#0D1117'
const MIN_MUTED = 12 // WCAG AAA is 7:1; Richard asked for high contrast, so the bar is higher.

/** Read a `--name: #RRGGBB` custom property out of CSS text, or null. */
export const token = (css, name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`))
  return m ? m[1].toUpperCase() : null
}

/** Find `color: rgba(...)` declarations (not border-color, background-color and so on). */
export const alphaColours = (css) =>
  (css.match(/(^|[^-a-z])color:\s*rgba\([^)]*\)/g) || []).map((h) => h.replace(/^[^c]*/, ''))

// Hand-maintained root contact.html has no src copy (Windows Defender removed it as a false
// positive), so it is listed by name next to the files derived from PAGES.
const HAND_MAINTAINED = ['contact.html']
const partials = fs.readdirSync(new URL('../partials/', import.meta.url)).map((f) => `partials/${f}`)
const stylesheets = ['site.css', 'content-pages.css']
const pageSources = PAGES.map((p) => `src/${p.src}`)
const pageOutputs = PAGES.map((p) => p.out)

const tokenSources = [...stylesheets, ...pageSources, ...HAND_MAINTAINED].filter(exists)
const scanSources = [...stylesheets, ...pageSources, ...pageOutputs, ...HAND_MAINTAINED, ...partials].filter(exists)

test('contrast helper can fail (positive control)', () => {
  assert.ok(contrast('#A8B3BD', DARK) < MIN_MUTED, 'the old grey must fail the bar')
  assert.ok(contrast('#E6EDF3', DARK) < contrast('#FFFFFF', DARK))
  assert.ok(contrast('#D0D7DE', DARK) >= MIN_MUTED)
  assert.ok(contrast('#FFFFFF', DARK) > 18)
})

test('token() and alphaColours() can find and can miss (positive controls)', () => {
  assert.equal(token('  --text: #ffffff;\n', 'text'), '#FFFFFF')
  assert.equal(token('--muted: #d0d7de;', 'muted'), '#D0D7DE')
  assert.equal(token('--text: white;', 'text'), null)
  assert.deepEqual(alphaColours('p { color: rgba(255, 255, 255, 0.75); }'), ['color: rgba(255, 255, 255, 0.75)'])
  assert.deepEqual(alphaColours('p { border-color: rgba(1,2,3,0.5); background-color: rgba(1,2,3,0.5); }'), [])
  assert.ok(pageSources.length >= 10 && tokenSources.includes('contact.html'), 'contact.html must be covered')
})

for (const rel of tokenSources) {
  const src = read(rel)
  if (token(src, 'text') === null && token(src, 'muted') === null) continue
  test(`${rel}: --text is pure white and --muted clears ${MIN_MUTED}:1 on the dark background`, () => {
    assert.equal(token(src, 'text'), '#FFFFFF')
    const muted = token(src, 'muted')
    assert.ok(muted, '--muted missing')
    assert.ok(contrast(muted, DARK) >= MIN_MUTED, `--muted ${muted} is ${contrast(muted, DARK).toFixed(1)}:1`)
  })
}

test('every stylesheet and page that defines a text token is checked (none silently skipped)', () => {
  const defining = scanSources.filter((rel) => /--text:/.test(read(rel)))
  for (const rel of defining.filter((r) => !pageOutputs.includes(r))) {
    assert.ok(tokenSources.includes(rel), `${rel} defines --text but is not in the token test`)
  }
  assert.ok(tokenSources.length >= 12, `only ${tokenSources.length} token sources found`)
})

test('the retired off-white and grey appear nowhere in served pages, sources, partials or stylesheets', () => {
  for (const rel of scanSources) {
    assert.ok(!/#E6EDF3|#A8B3BD/i.test(read(rel)), `${rel} still uses a retired text colour`)
  }
})

// Declarations that sit on a light background or an image, kept on purpose. Format: 'file: declaration'.
const ALLOW = []

test('no text colour uses an alpha channel', () => {
  for (const rel of scanSources) {
    const hits = alphaColours(read(rel)).filter((h) => !ALLOW.includes(`${rel}: ${h}`))
    assert.deepEqual(hits, [], `${rel} has translucent text colour: ${hits.join(' | ')}`)
  }
})
