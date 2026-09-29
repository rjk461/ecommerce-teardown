import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { PAGES, OFFERS } from '../scripts/site.config.mjs'
import { mdPathFor } from '../scripts/lib/outputs.mjs'
import { ROOT, read, exists, stripTags, mentionsAiTeardown } from './helpers.mjs'

// Every served surface a person or a machine can read.
// contact.html is hand-maintained and has no PAGES entry, so it is listed here on purpose.
const htmlFiles = [...PAGES.map((p) => p.out), 'contact.html']
const mdFiles = PAGES.filter((p) => p.index).map((p) => mdPathFor(p).slice(1))
const surfaces = [...htmlFiles, ...mdFiles, 'llms.txt']

test('the gates scan every surface (positive control for the surface list)', () => {
  for (const rel of surfaces) assert.ok(exists(rel), `${rel} is listed as a surface but does not exist`)
  assert.ok(surfaces.includes('llms.txt'))
  assert.ok(surfaces.includes('contact.html'))
  assert.ok(surfaces.includes('index.md'))
  assert.equal(new Set(surfaces).size, surfaces.length, 'a surface is listed twice')
  assert.equal(mdFiles.length, PAGES.filter((p) => p.index).length)
  // The expected size is derived from the config so a legitimately added page does not break it: every page, contact.html,
  // one .md copy per indexed page, and llms.txt. The plain floor of 21 catches the list quietly shrinking to nothing.
  const expected = PAGES.length + 1 + PAGES.filter((p) => p.index).length + 1
  assert.equal(surfaces.length, expected, 'the surface list is not pages + contact.html + indexed .md copies + llms.txt')
  assert.ok(surfaces.length >= 21, `only ${surfaces.length} surfaces are scanned, expected at least 21`)
})

// stripTags drops attribute values, so the words a person or a crawler reads in alt, title, aria-label and content
// attributes (meta descriptions, social cards) are pulled out separately and scanned with the visible text.
// The leading whitespace requirement keeps data-title and similar names out.
const ATTR_RE = /[\s](?:alt|title|aria-label|content)=(?:"([^"]*)"|'([^']*)')/gi
const attrValues = (html) => [...html.matchAll(ATTR_RE)].map((m) => m[1] ?? m[2]).join(' ')
const scannable = (rel) => {
  const raw = read(rel)
  return rel.endsWith('.html') ? stripTags(raw) + ' ' + attrValues(raw) : raw
}

test('attribute extraction can fail (positive control)', () => {
  assert.equal(attrValues('<img src="/a.png" alt="A chart">'), 'A chart')
  assert.equal(attrValues('<a href="/x" title="Go there" aria-label="Go now">x</a><meta content="Summary text">'), 'Go there Go now Summary text')
  assert.equal(attrValues("<img alt='Single quoted'>"), 'Single quoted')
  assert.equal(attrValues('<div data-title="hidden" class="alt"><input placeholder="you@example.com"></div>'), '')
})

// ---- Job-seeking language -------------------------------------------------
const JOB_SEEKING = [
  /looking for (my|the|a) (next|right)/i,
  /(full-?time|senior|leadership) roles?\b/i,
  /\bopen for role/i,
  /\bopen to work\b/i,
  /\bseeking (a |an )?(role|position|opportunit)/i,
  /\bhire me\b/i,
  /\bavailable now\b/i,
  /Head of Ecommerce role/i,
]
const findJobSeeking = (text) => JOB_SEEKING.filter((re) => re.test(text)).map(String)

test('job-seeking scan can fail (positive control)', () => {
  assert.ok(findJobSeeking('<p>Looking for my next Head of Ecommerce role</p>').length >= 2)
  assert.ok(findJobSeeking('Available Now for full-time roles').length >= 2)
  assert.deepEqual(findJobSeeking('Available for consulting, or a full or part time engagement.'), [])
  assert.deepEqual(findJobSeeking('You don' + String.fromCharCode(0x2019) + 't need a full-time hire.'), [])
  // Attribute-borne wording: stripTags alone misses it, the attribute scan must catch it.
  const sneaky = '<img src="/a.png" alt="Open to work: looking for my next Head of Ecommerce role"><a href="/x" aria-label="Hire me">x</a>'
  assert.deepEqual(findJobSeeking(stripTags(sneaky)), [], 'control: visible text alone does not see the attributes')
  assert.ok(findJobSeeking(stripTags(sneaky) + ' ' + attrValues(sneaky)).length >= 3)
  assert.deepEqual(findJobSeeking(stripTags('<img alt="A chart of monthly revenue">') + ' ' + attrValues('<img alt="A chart of monthly revenue">')), [])
})

test('no job-seeking language on any served surface', () => {
  for (const rel of surfaces) {
    const text = scannable(rel)
    assert.deepEqual(findJobSeeking(text), [], `${rel} reads like a job search`)
  }
})

test('Beer Cartel tenure is never given as ending in 2024', () => {
  const EN = String.fromCharCode(0x2013)
  const bad = new RegExp('Beer Cartel[^.]{0,80}2009[ ]*(&ndash;|' + EN + '|-|to)[ ]*2024', 'i')
  assert.ok(bad.test('Beer Cartel, 2009 to 2024'), 'control: the pattern must be able to match')
  for (const rel of surfaces) assert.ok(!bad.test(read(rel)), `${rel} ends Beer Cartel in 2024`)
})

test('no revenue figure beyond the existing 7-figure wording', () => {
  const bad = /\$6\s?M|6 million/i
  assert.ok(bad.test('turning over $6M') && bad.test('6 million'), 'control: the pattern must be able to match')
  for (const rel of surfaces) assert.ok(!bad.test(read(rel)), `${rel} states $6M`)
})

test('no client names', () => {
  for (const rel of surfaces) {
    const text = read(rel)
    for (const name of ['Sans Drinks', 'Liquor Loot']) assert.ok(!text.includes(name), `${rel} names ${name}`)
    assert.ok(!/\bJust Wines\b/.test(text), `${rel} names Just Wines`)
  }
})

test('the withdrawn $2.99 AI teardown tool is not mentioned on any served surface', () => {
  assert.ok(mentionsAiTeardown('/ai-teardown'), 'control: the helper must be able to match')
  assert.ok(!mentionsAiTeardown('a free teardown'), 'control: the helper must not match plain teardown wording')
  for (const rel of surfaces) assert.ok(!mentionsAiTeardown(read(rel)), `${rel} still mentions the AI teardown tool`)
})

// ---- Placeholders ---------------------------------------------------------
// Build tokens can hide anywhere, so they are checked on the raw source. The words are checked on visible text only
// (an HTML placeholder attribute or a CSS class called "placeholder" is legitimate) and TBD, TODO and PLACEHOLDER
// count only in capitals, which is how a leftover marker is written.
const TOKENS = /\[\[|\{\{|__ARIA_/
const WORDS = /(^|[^A-Za-z])(TBD|TODO|PLACEHOLDER)($|[^A-Za-z])/
const LOREM = /lorem ipsum/i
const hasPlaceholder = (raw, visible = raw) => TOKENS.test(raw) || WORDS.test(visible) || LOREM.test(visible)

test('placeholder scan can fail (positive control)', () => {
  for (const bad of ['TBD', 'TODO: fix', 'Lorem ipsum dolor', 'x [[link]] y', 'x {{name}} y', '__ARIA_CURRENT__']) {
    assert.ok(hasPlaceholder(bad), `should flag: ${bad}`)
  }
  assert.ok(hasPlaceholder('<p>fine</p> {{name}}', 'fine'), 'a build token in the raw source is flagged even when the visible text is clean')
  assert.ok(!hasPlaceholder('<input placeholder="you@example.com"><style>.x-placeholder{}</style>', stripTags('<input placeholder="you@example.com"><style>.x-placeholder{}</style>')))
  assert.ok(!hasPlaceholder('A finished sentence about a to-do list app.'))
  const attrBorne = '<img src="/a.png" alt="TBD"><meta content="Lorem ipsum dolor">'
  assert.ok(!hasPlaceholder(attrBorne, stripTags(attrBorne)), 'control: visible text alone does not see the attributes')
  assert.ok(hasPlaceholder(attrBorne, stripTags(attrBorne) + ' ' + attrValues(attrBorne)), 'a placeholder word inside an attribute is flagged')
})

test('no placeholder text on any served surface', () => {
  for (const rel of surfaces) {
    assert.ok(!hasPlaceholder(read(rel), scannable(rel)), `${rel} has placeholder text`)
  }
})

// ---- Prices ---------------------------------------------------------------
const money = (n) => '$' + n.toLocaleString('en-AU')
const statesPrice = (html, price) => html.includes(money(price))

test('price check can fail (positive control)', () => {
  assert.equal(money(1200), '$1,200')
  assert.ok(statesPrice('<p>Fixed price $1,200.</p>', 1200))
  assert.ok(!statesPrice('<p>Fixed price $1,500.</p>', 1200))
  assert.ok(!statesPrice('<p>Fixed price 1200.</p>', 1200))
})

test('every offer price appears on every page that must state it', () => {
  for (const o of OFFERS) {
    for (const pagePath of o.pages) {
      const page = PAGES.find((p) => p.path === pagePath)
      assert.ok(page, `offer ${o.id} lists unknown page ${pagePath}`)
      assert.ok(statesPrice(read(page.out), o.price), `${page.out} does not state ${money(o.price)} (${o.name})`)
    }
  }
})

test('no page is still waiting in PENDING_PRICE_PAGES', () => {
  const pendingList = (src) => {
    const m = src.match(/PENDING_PRICE_PAGES\s*=\s*\[([^\]]*)\]/)
    assert.ok(m, 'could not find PENDING_PRICE_PAGES')
    return m[1].replace(/\/\/.*$/gm, '').trim()
  }
  assert.notEqual(pendingList("export const PENDING_PRICE_PAGES = ['/x']"), '', 'control: a non-empty list must be detected')
  assert.equal(pendingList('export const PENDING_PRICE_PAGES = []'), '')
  assert.equal(pendingList(read('tests/prices.test.mjs')), '', 'PENDING_PRICE_PAGES must be empty')
})

// ---- Links ----------------------------------------------------------------
function resolves(href) {
  const p = decodeURIComponent(href.split('#')[0].split('?')[0])
  if (p === '' || p === '/') return true
  const rel = p.replace(/^\//, '')
  if (rel.startsWith('api/')) return exists(rel + '.js') || exists(rel)
  if (path.extname(rel)) return exists(rel)
  return exists(rel + '.html') || (fs.existsSync(path.join(ROOT, rel)) && fs.statSync(path.join(ROOT, rel)).isDirectory())
}

const internalRefs = (html) => [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]).filter((h) => !h.startsWith('//'))

test('link check can fail (positive control)', () => {
  assert.equal(resolves('/definitely-not-a-page'), false)
  assert.equal(resolves('/consulting'), true)
  assert.equal(resolves('/images/Richard%20Kelsey%20Headshot.png'), true)
  assert.equal(resolves('/images/No%20Such%20File.png'), false)
  assert.deepEqual(internalRefs('<a href="/consulting">x</a><a href="//cdn.example.com/a.js">y</a><a href="https://a.com">z</a>'), ['/consulting'])
})

test('every internal href and src on every page resolves', () => {
  const missing = []
  for (const rel of htmlFiles) {
    for (const href of internalRefs(read(rel))) if (!resolves(href)) missing.push(`${rel}: ${href}`)
  }
  assert.deepEqual(missing, [])
})

test('the CV PDF path still resolves and the draft is not live', () => {
  assert.ok(exists('Sample/Richard-Kelsey-CV.pdf'))
  assert.ok(!exists('Richard-Kelsey-CV-consulting-DRAFT.pdf'))
  assert.ok(!exists('Sample/Richard-Kelsey-CV-consulting-DRAFT.pdf'))
})

// ---- JSON-LD --------------------------------------------------------------
const ldBlocks = (html) => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1])

test('JSON-LD check can fail (positive control)', () => {
  assert.equal(ldBlocks('<script type="application/ld+json">{"a":1}</script>').length, 1)
  assert.throws(() => JSON.parse(ldBlocks('<script type="application/ld+json">{"a":1,}</script>')[0]))
  assert.deepEqual(ldBlocks('<script>var a = 1</script>'), [])
})

test('every JSON-LD block on every page parses as JSON', () => {
  let total = 0
  for (const p of PAGES) {
    const blocks = ldBlocks(read(p.out))
    if (p.index) assert.equal(blocks.length, p.schema.length, `${p.out} has ${blocks.length} JSON-LD blocks, config says ${p.schema.length}`)
    for (const b of blocks) {
      total += 1
      assert.doesNotThrow(() => JSON.parse(b), `${p.out} has a JSON-LD block that is not valid JSON`)
    }
  }
  assert.ok(total > 0, 'no JSON-LD found anywhere: the scan looked at nothing')
})

// ---- Canonical and sitemap ------------------------------------------------
const canonicalOf = (html) => (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1]

test('canonical check can fail (positive control)', () => {
  assert.equal(canonicalOf('<link rel="canonical" href="https://ecommerceteardown.com/cv">'), 'https://ecommerceteardown.com/cv')
  assert.equal(canonicalOf('<link rel="stylesheet" href="/a.css">'), undefined)
})

test('every indexed page has an ecommerceteardown.com canonical and a sitemap entry', () => {
  const sitemap = read('sitemap.xml')
  const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1])
  const indexed = PAGES.filter((p) => p.index)
  assert.ok(indexed.length > 0)
  for (const p of indexed) {
    const canonical = canonicalOf(read(p.out))
    assert.ok(canonical && canonical.startsWith('https://ecommerceteardown.com'), `${p.out} canonical is ${canonical}`)
    assert.ok(locs.includes(canonical), `${p.out} canonical ${canonical} is not in sitemap.xml`)
  }
  assert.equal(locs.length, indexed.length, 'sitemap.xml lists a page that is not indexed, or misses one')
  for (const p of PAGES.filter((q) => !q.index)) {
    assert.equal(canonicalOf(read(p.out)), undefined, `${p.out} is not indexed but has a canonical`)
  }
})
