import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { build, injectNav } from '../scripts/build.mjs'
import { PAGES } from '../scripts/site.config.mjs'
import { ROOT, read, lf } from './helpers.mjs'

test('injectNav marks only the current page', () => {
  const tpl = '<a href="/cv"__ARIA_CV__>CV</a><a href="/consulting"__ARIA_CONSULTING__>C</a>'
  assert.equal(
    injectNav(tpl, 'cv'),
    '<a href="/cv" aria-current="page">CV</a><a href="/consulting">C</a>'
  )
  assert.equal(injectNav(tpl, null), '<a href="/cv">CV</a><a href="/consulting">C</a>')
})

test('injectNav handles hyphenated keys', () => {
  assert.equal(
    injectNav('<a href="/x"__ARIA_AI_STRATEGY__>x</a>', 'ai-strategy'),
    '<a href="/x" aria-current="page">x</a>'
  )
})

test('every page in the config has a source file and both markers', () => {
  for (const page of PAGES) {
    const src = read(`src/${page.src}`)
    assert.ok(src.includes('<!-- HEADER -->'), `${page.src} missing HEADER marker`)
    assert.ok(src.includes('<!-- FOOTER -->'), `${page.src} missing FOOTER marker`)
  }
})

test('committed build output matches a fresh build (drift gate)', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'et-build-'))
  const written = await build({ root: ROOT, outDir: tmp })
  assert.ok(written.length >= PAGES.length, 'build wrote fewer files than pages')
  for (const rel of written) {
    const fresh = lf(fs.readFileSync(path.join(tmp, rel), 'utf8'))
    const committed = lf(read(rel))
    assert.equal(committed, fresh, `${rel} is stale: run npm run build:site and commit the result`)
  }
})

test('drift gate can fail: a stale copy is detected', () => {
  // Positive control: the comparison used above must reject differing text.
  assert.notEqual(lf('a\r\nb'), lf('a\r\nc'))
})

test('header nav: AI Strategy, Consulting, Experience, Book a Coffee; no Career game', () => {
  const html = read('index.html')
  const header = html.match(/<header>[\s\S]*?<\/header>/)[0]
  for (const label of ['AI Strategy', 'Consulting', 'Experience', 'Book a Coffee']) {
    assert.ok(header.includes(`>${label}</a>`), `header missing ${label}`)
  }
  assert.ok(!header.includes('Career game'), 'Career game must be footer only')
  assert.ok(!/>CV</.test(header), 'nav label CV must read Experience')
})

test('footer: services list AI pages, Career game lives here, blurb is consulting positioning', () => {
  const html = read('index.html')
  const footer = html.match(/<footer>[\s\S]*?<\/footer>/)[0]
  assert.ok(footer.includes('href="/ai-strategy"'))
  assert.ok(footer.includes('href="/ai-search-readiness"'))
  assert.ok(footer.includes('Career game'))
  assert.ok(footer.includes('>Experience</a>'))
  assert.ok(!/Head of Ecommerce and CMO/.test(footer))
  assert.ok(!/11,734/.test(footer), 'hard-coded follower count must go')
})

test('the AI strategy nav item is current on both AI pages', () => {
  for (const f of ['ai-strategy.html', 'ai-search-readiness.html']) {
    assert.match(read(f), /<a href="\/ai-strategy" aria-current="page">AI Strategy<\/a>/)
  }
})

test('contact.html is hand-maintained but its header and footer match the built ones', () => {
  // contact.html has no src/ source (Windows Defender flags a src copy as a false positive),
  // so the build does not stitch it. This test is the drift gate for its header and footer.
  const lf = (t) => t.split(String.fromCharCode(13)).join('')
  const grab = (html, tag) => {
    const text = lf(html)
    const start = text.indexOf('<' + tag + '>')
    const end = text.indexOf('</' + tag + '>', start) + tag.length + 3
    return text.slice(start, end).split(' aria-current="page"').join('')
  }
  const idx = read('index.html')
  const contact = read('contact.html')
  for (const tag of ['header', 'footer']) {
    assert.equal(grab(contact, tag), grab(idx, tag), `contact.html ${tag} has drifted from the partial`)
  }
  assert.ok(contact.includes('id="contactForm"'), 'the contact form must survive')
  // Positive control: the comparison must reject a drifted footer.
  assert.notEqual(grab(idx, 'footer'), grab(idx, 'footer').replace('Career game', 'Game'))
})

test('homepage: consulting positioning in title, description and hero', () => {
  const html = read('index.html')
  assert.match(html, /<title>Richard Kelsey \| Ecommerce and AI Growth Consultant<\/title>/)
  assert.ok(!/Head of Ecommerce \|/.test(html))
  assert.ok(html.includes('href="/free-teardown" class="btn btn-primary">Get a Free Teardown'))
  assert.ok(!html.includes('>View CV<'))
  assert.ok(!html.includes('id="open-for-role"'))
  assert.ok(html.includes('id="how-i-help"'))
})

test('homepage: availability wording and Beer Cartel dates', () => {
  const text = read('index.html')
  assert.ok(text.includes('full or part time engagement'))
  assert.ok(text.includes('until September 2025'))
  assert.ok(!/\$6M|6 million/i.test(text), 'no new revenue figures')
})

test('homepage: AI area card exists and the AI bullet left Platform', () => {
  const html = read('index.html')
  assert.ok(html.includes('<h3>AI Strategy &amp; Adoption</h3>'))
  assert.ok(!/Platform &amp; Technology[\s\S]{0,400}AI tools applied/.test(html))
})

test('consulting page: title, fixed-price section, AI card, new FAQs', () => {
  const html = read('consulting.html')
  assert.match(html, /<title>Ecommerce and AI Consulting \| Richard Kelsey<\/title>/)
  assert.ok(html.includes('id="fixed-price"'))
  for (const price of ['$1,200', '$1,500', '$4,500', '$2,000']) assert.ok(html.includes(price), `missing ${price}`)
  assert.ok(html.includes('<h3>AI Strategy &amp; Adoption</h3>'))
  assert.ok(html.includes('full or part time'))
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))
  const faq = blocks.find((b) => b['@type'] === 'FAQPage')
  assert.ok(faq, 'FAQPage JSON-LD missing')
  assert.ok(faq.mainEntity.some((q) => /AI/.test(q.name)))
  assert.ok(faq.mainEntity.some((q) => /full or part time/.test(q.name)))
})

test('cv page: Experience framing, dates, and an indexable summary', () => {
  const html = read('cv.html')
  assert.match(html, /<title>Experience \| Richard Kelsey \| Ecommerce Teardown<\/title>/)
  assert.ok(html.includes('September 2025'))
  assert.ok(html.includes('May 2026'))
  assert.ok(html.includes('Made 4 Tradies'))
  assert.ok(!/2009\s*(&ndash;|-|to)\s*2024/.test(html))
  assert.ok(html.includes('/Sample/Richard-Kelsey-CV.pdf'), 'PDF link must still work')
})

const EM_DASH = String.fromCharCode(8212)
const EN_DASH = String.fromCharCode(8211)
const findDashes = (s) => [EM_DASH, EN_DASH, '&mdash;', '&ndash;'].filter((d) => s.includes(d))

test('dash checker flags em and en dashes, raw and as entities (positive control)', () => {
  assert.deepEqual(findDashes('a ' + EM_DASH + ' b'), [EM_DASH])
  assert.deepEqual(findDashes('a ' + EN_DASH + ' b'), [EN_DASH])
  assert.deepEqual(findDashes('a &mdash; b'), ['&mdash;'])
  assert.deepEqual(findDashes('a &ndash; b'), ['&ndash;'])
  assert.deepEqual(findDashes('a, b: c to d'), [])
})

test('cv and consulting pages carry no em or en dashes in their source', () => {
  for (const page of ['cv.html', 'consulting.html']) {
    assert.deepEqual(findDashes(read('src/' + page)), [], 'dash found in src/' + page)
  }
})
