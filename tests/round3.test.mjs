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

test('no page loads the Reddit pixel or third-party ad tags of its own', () => {
  for (const p of PAGES) {
    const h = read(p.out)
    assert.ok(!/reddit/i.test(h), `${p.out} still mentions Reddit`)
  }
  assert.ok(!/reddit/i.test(read('contact.html')), 'contact.html still mentions Reddit')
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

test('/consulting shows How to Work With Me above Fixed-Price Starting Points', () => {
  const h = read('consulting.html')
  const a = h.indexOf('How to Work With Me')
  const b = h.indexOf('Fixed-Price Starting Points')
  assert.ok(a > 0 && b > 0 && a < b)
})

test('/ai-strategy shows the six areas three across', () => {
  assert.match(read('ai-strategy.html'), /class="card-grid card-grid-3"/)
  assert.match(read('content-pages.css'), /\.card-grid-3 \{ grid-template-columns: repeat\(3, 1fr\); \}/)
})

test('/cv intro links have their own colour, not the browser default', () => {
  assert.match(read('cv.html'), /\.page-header p a \{ color: var\(--green\)/)
})

test('the Google tag loads after the page, and no page hot-links a LinkedIn image', () => {
  for (const p of PAGES) {
    const h = read(p.out)
    assert.ok(!/<script async src="https:\/\/www\.googletagmanager\.com/.test(h), `${p.out} loads the Google tag in the head`)
    if (/gtag\('config'/.test(h)) assert.ok(/googletagmanager\.com\/gtag\/js\?id=G-QS74BWRKTY/.test(h), `${p.out} lost the Google tag`)
    assert.ok(!/content\.linkedin\.com/.test(h), `${p.out} hot-links a LinkedIn image`)
  }
  assert.ok(!/content\.linkedin\.com/.test(read('contact.html')))
})

test('on phones the hero reads headline, photo, then body text, and /consulting shows its photo', () => {
  for (const f of ['index.html', 'consulting.html']) {
    const h = read(f)
    assert.match(h, /\.hero-text \{ display: contents; \}/, `${f} must flatten .hero-text on phones`)
    assert.match(h, /\.hero-photo \{ order: 2;/, `${f} photo must sit between headline and body`)
    assert.match(h, /\.hero \.?[\w-]*\s*\{?[^}]*order: 3;|\.lead \{ order: 3; \}/, `${f} body text must come after the photo`)
  }
  assert.ok(!/\.hero-photo \{ display: none; \}/.test(read('consulting.html')), '/consulting must not hide its photo on phones')
})

test('the retailer study is a public page with Article schema, linked from the audit page, and states its date and denominators', () => {
  const p = PAGES.find((x) => x.path === '/ai-readiness-study')
  assert.ok(p && p.index, 'study page must be indexed')
  const h = read('ai-readiness-study.html')
  const art = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((b) => b['@type'] === 'Article')
  assert.ok(art, 'Article schema missing')
  assert.equal(art.datePublished, '2026-09-30')
  assert.equal(art.author['@id'], 'https://ecommerceteardown.com/#richard-kelsey')
  assert.match(h, /30 September 2026/)
  assert.match(h, /Nothing here names a retailer/)
  assert.match(h, /href="\/ai-search-readiness"/)
  assert.match(read('ai-search-readiness.html'), /href="\/ai-readiness-study"/)
  assert.match(read('llms.txt'), /ai-readiness-study\.md/)
})
