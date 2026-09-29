import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { PAGES } from '../scripts/site.config.mjs'
import { getTitle, getMetaDescription } from '../scripts/lib/html.mjs'
import { ROOT, read, exists, stripTags } from './helpers.mjs'

const pages = PAGES.filter((p) => p.index)
const html = (p) => read(p.out)

// Rules live in functions so the positive controls at the bottom run the same code as the real checks.
const headingLevels = (h) => [...h.matchAll(/<h([1-6])[\s>]/gi)].map((m) => Number(m[1]))
const skipsLevel = (levels) => levels.some((n, i) => i > 0 && n - levels[i - 1] > 1)
const imgProblems = (h) => {
  const out = []
  for (const m of h.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0]
    if (!/\balt="/i.test(tag)) out.push(`no alt: ${tag.slice(0, 60)}`)
    const src = (tag.match(/\bsrc="([^"]+)"/i) || [])[1] || ''
    if (!src.startsWith('/')) continue
    if (!/\bwidth="\d+"/i.test(tag)) out.push(`no width: ${src}`)
    if (!/\bheight="\d+"/i.test(tag)) out.push(`no height: ${src}`)
  }
  return out
}
const vagueLinks = (h) =>
  [...h.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => stripTags(m[1]).trim().toLowerCase())
    .filter((t) => /^(click here|here|read more|learn more|more)$/.test(t))

test('every public page has exactly one h1', () => {
  for (const p of pages) {
    assert.equal(headingLevels(html(p)).filter((n) => n === 1).length, 1, `${p.path} must have exactly one <h1>`)
  }
})

test('heading levels never skip going deeper', () => {
  for (const p of pages) {
    const levels = headingLevels(html(p))
    assert.ok(!skipsLevel(levels), `${p.path}: outline skips a level (${levels.join('')})`)
  }
})

test('every page, indexed or not, has one <main>, a lang and a viewport', () => {
  for (const p of PAGES) {
    const h = html(p)
    assert.equal((h.match(/<main[\s>]/gi) || []).length, 1, `${p.out} needs exactly one <main>`)
    assert.match(h, /<html[^>]*\blang="/i, `${p.out} needs <html lang>`)
    assert.match(h, /<meta[^>]+name="viewport"/i, `${p.out} needs a viewport meta`)
  }
})

test('titles and descriptions are a sensible length', () => {
  for (const p of pages) {
    const h = html(p)
    const t = getTitle(h)
    const d = getMetaDescription(h)
    assert.ok(t.length >= 20 && t.length <= 70, `${p.path} title is ${t.length} chars: ${t}`)
    assert.ok(d.length >= 70 && d.length <= 170, `${p.path} description is ${d.length} chars`)
  }
})

test("titles carry each page's target phrase", () => {
  const want = {
    '/': /ecommerce/i,
    '/ai-strategy': /ai strategy/i,
    '/ai-search-readiness': /ai search/i,
    '/consulting': /consulting/i,
    '/free-teardown': /teardown/i,
  }
  for (const [route, re] of Object.entries(want)) {
    const p = pages.find((x) => x.path === route)
    assert.ok(p, `${route} must be a public page`)
    assert.match(getTitle(html(p)), re, `${route} title should contain its target phrase`)
  }
})

test('the first paragraph under the h1 is a direct answer of 15 to 70 words', () => {
  for (const route of ['/ai-strategy', '/ai-search-readiness', '/consulting']) {
    const p = pages.find((x) => x.path === route)
    const h = html(p)
    const after = h.slice(h.search(/<\/h1>/i))
    const first = after.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
    assert.ok(first, `${route}: a paragraph must follow the h1`)
    const words = stripTags(first[1]).trim().split(/\s+/).length
    assert.ok(words >= 15 && words <= 70, `${route}: lead paragraph is ${words} words`)
  }
})

test('no public page is an orphan, and the homepage links straight to the money pages', () => {
  const inbound = new Map(pages.map((p) => [p.path, new Set()]))
  for (const p of pages) {
    for (const m of html(p).matchAll(/<a\b[^>]*\bhref="([^"#?]+)/gi)) {
      const href = m[1].replace(/\/$/, '') || '/'
      if (href !== p.path && inbound.has(href)) inbound.get(href).add(p.path)
    }
  }
  for (const p of pages) {
    if (p.path !== '/') assert.ok(inbound.get(p.path).size >= 1, `${p.path} has no internal link pointing to it`)
  }
  for (const route of ['/ai-strategy', '/ai-search-readiness', '/consulting', '/free-teardown']) {
    assert.ok(inbound.get(route).has('/'), `the homepage must link to ${route}`)
  }
})

test('link text is descriptive', () => {
  for (const p of PAGES) assert.deepEqual(vagueLinks(html(p)), [], `${p.out} has vague link text`)
})

test('local images have alt text and dimensions, and stay under 300 KB', () => {
  for (const p of PAGES) {
    const h = html(p)
    assert.deepEqual(imgProblems(h), [], `${p.out} has image problems`)
    for (const m of h.matchAll(/<img\b[^>]*\bsrc="(\/[^"]+)"/gi)) {
      const rel = decodeURIComponent(m[1].slice(1))
      assert.ok(exists(rel), `${p.out}: ${m[1]} does not exist`)
      assert.ok(fs.statSync(path.join(ROOT, rel)).size <= 300 * 1024, `${p.out}: ${m[1]} is over 300 KB`)
    }
  }
})

test('the Open Graph image on every public page exists in the repo', () => {
  for (const p of pages) {
    const m = html(p).match(/property="og:image"\s+content="https:\/\/ecommerceteardown\.com(\/[^"]+)"/i)
    assert.ok(m, `${p.path} needs an og:image on this domain`)
    assert.ok(exists(m[1].slice(1)), `${p.path}: og:image ${m[1]} does not exist`)
  }
})

test('the homepage carries WebSite structured data that names the owner', () => {
  const h = html(pages.find((p) => p.path === '/'))
  const blocks = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((m) => JSON.parse(m[1]))
  const site = blocks.find((b) => b['@type'] === 'WebSite')
  assert.ok(site, 'homepage needs a WebSite block')
  assert.equal(site.url, 'https://ecommerceteardown.com/')
  assert.equal(site.publisher['@id'], 'https://ecommerceteardown.com/#richard-kelsey')
})

test('positive controls: each rule fails on input it must reject', () => {
  assert.ok(skipsLevel([1, 2, 4]), 'a jump from h2 to h4 must be caught')
  assert.ok(!skipsLevel([1, 2, 3, 2, 3]), 'a clean outline must pass')
  assert.ok(imgProblems('<img src="/x.png" alt="">').length >= 2, 'missing width and height must be caught')
  assert.deepEqual(imgProblems('<img src="/x.png" alt="" width="10" height="10">'), [])
  assert.deepEqual(vagueLinks('<a href="/x">click here</a>'), ['click here'])
  assert.deepEqual(vagueLinks('<a href="/x">AI strategy</a>'), [])
})
