import test from 'node:test'
import assert from 'node:assert/strict'
import { PAGES } from '../scripts/site.config.mjs'
import { read } from './helpers.mjs'

// Rules live in functions so the positive controls run the same code as the real checks.
const cssRule = (h, selector) => {
  const m = h.match(new RegExp(selector.replace(/[.]/g, '\\.') + '\\s*\\{([^}]*)\\}'))
  return m ? m[1] : null
}
const hasBoxStyling = (rule) => /\b(background|border|border-radius)\s*:/.test(rule || '')

test('eyebrow tags above headings carry no border or background (match "What I Do")', () => {
  for (const [file, selector] of [
    ['consulting.html', '.hero-tag'],
    ['sample-teardowns.html', '.hero-tag'],
    ['index.html', '.role-eyebrow'],
  ]) {
    const rule = cssRule(read(file), selector)
    assert.ok(rule, `${file} has no ${selector} rule`)
    assert.equal(hasBoxStyling(rule), false, `${file} ${selector} must not have background, border or radius`)
  }
})

test('eyebrow check can fail (positive control)', () => {
  assert.equal(hasBoxStyling('background: red; color: blue;'), true)
  assert.equal(hasBoxStyling('border: 1px solid green;'), true)
  assert.equal(hasBoxStyling('color: green; font-weight: 700;'), false)
})

test('every page declares Australian English', () => {
  for (const p of PAGES) {
    assert.match(read(p.out), /<html lang="en-AU">/, `${p.out} must be lang="en-AU"`)
  }
  assert.match(read('contact.html'), /<html lang="en-AU">/)
})

test('/cv shows the CV viewer before "At a glance", and the button says Open CV in new tab', () => {
  const h = read('cv.html')
  const viewer = h.indexOf('class="cv-section"')
  const glance = h.indexOf('class="cv-summary"')
  assert.ok(viewer > 0 && glance > 0, 'both sections must exist')
  assert.ok(viewer < glance, 'CV viewer must come before At a glance')
  assert.ok(h.includes('>Open CV in new tab</a>'))
  assert.ok(!h.includes('>Open in new tab</a>'))
})

test('/consulting areas grid has six cards including Data & Reporting', () => {
  const h = read('consulting.html')
  const grid = h.match(/<div class="services-grid areas-grid">[\s\S]*?\n            <\/div>\n        <\/div>\n    <\/section>/)
  assert.ok(grid, 'areas grid missing')
  assert.equal((grid[0].match(/class="service-card"/g) || []).length, 6)
  assert.ok(grid[0].includes('Data &amp; Reporting'))
})

test('the Reddit pixel never blocks rendering', () => {
  for (const p of PAGES) {
    const h = read(p.out)
    assert.ok(!/<script src="\/reddit-pixel\.js"/.test(h), `${p.out} loads the Reddit pixel synchronously`)
  }
})

test('pages left out of the sitemap say noindex; indexed pages do not', () => {
  for (const p of PAGES) {
    const h = read(p.out)
    const noindex = /<meta name="robots" content="noindex/.test(h)
    assert.equal(noindex, !p.index, `${p.out}: noindex must be ${!p.index}`)
  }
  assert.match(read('contact.html'), /<meta name="robots" content="noindex/)
})

test('schema: Person image is a photo, and every Service page carries the ProfessionalService it points at', () => {
  const blocks = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))
  const home = blocks(read('index.html'))
  assert.ok(!home.find((b) => b['@type'] === 'Person').image.includes('og-image'))
  for (const f of ['consulting.html', 'ai-strategy.html', 'ai-search-readiness.html']) {
    const b = blocks(read(f))
    const svc = b.find((x) => x['@type'] === 'Service')
    const prov = b.find((x) => x['@id'] === svc.provider['@id'])
    assert.ok(prov, `${f}: Service.provider ${svc.provider['@id']} is not defined on the page`)
    assert.equal(prov.address.addressLocality, 'Sydney')
  }
})

test('custom 404 page exists, is noindex and links home', () => {
  const h = read('404.html')
  assert.match(h, /noindex/)
  assert.match(h, /href="\/"/)
})
