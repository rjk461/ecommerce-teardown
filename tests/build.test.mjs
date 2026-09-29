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
