import test from 'node:test'
import assert from 'node:assert/strict'
import { PAGES, SITE } from '../scripts/site.config.mjs'
import { sitemapXml, llmsTxt, pageMarkdown, mdPathFor, canonicalUrl } from '../scripts/lib/outputs.mjs'
import { read, exists, mentionsAiTeardown } from './helpers.mjs'

const indexed = PAGES.filter((p) => p.index)

test('sitemap.xml lists exactly the indexed pages', () => {
  const xml = read('sitemap.xml')
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  assert.deepEqual(locs.sort(), indexed.map(canonicalUrl).sort())
  for (const p of PAGES.filter((p) => !p.index)) assert.ok(!xml.includes(p.path))
})

test('sitemap escapes XML-special characters (positive control)', () => {
  const xml = sitemapXml([{ path: '/a&b<c', index: true }])
  assert.ok(xml.includes('a&amp;b&lt;c'))
})

test('llms.txt: H1, blockquote, links to markdown copies, no non-indexed pages', () => {
  const t = read('llms.txt')
  assert.match(t, /^# Ecommerce Teardown\n/)
  assert.match(t, /\n> .+\n/)
  assert.ok(t.includes(SITE.summary), 'facts block must appear verbatim')
  for (const p of indexed.filter((p) => p.llms)) {
    assert.ok(t.includes(`${SITE.url}${mdPathFor(p)}`), `llms.txt missing ${p.path}`)
  }
  for (const p of PAGES.filter((p) => !p.index)) assert.ok(!t.includes(p.path))
})

test('llms.txt link lines match the "- [label](url): description" shape', () => {
  const links = read('llms.txt').split('\n').filter((l) => l.startsWith('- '))
  assert.ok(links.length >= indexed.filter((p) => p.llms).length)
  for (const l of links) assert.match(l, /^- \[[^\]]+\]\(https:\/\/[^)]+\)(: .+)?$/)
})

for (const p of indexed) {
  test(`${mdPathFor(p)} exists, starts with front matter and an H1, has absolute links`, () => {
    const rel = mdPathFor(p).slice(1)
    assert.ok(exists(rel), `${rel} not generated`)
    const md = read(rel)
    assert.match(md, /^---\ntitle: .+\ndescription: .+\nurl: https:\/\/.+\n---\n/)
    assert.match(md, /\n# .+/, 'no H1 in markdown body')
    assert.ok(!/<script|<style|<form/i.test(md), 'markup leaked into markdown')
    assert.ok(!/\]\(\/[^)]*\)/.test(md), 'relative link left in markdown')
  })
}

test('pageMarkdown drops forms and scripts and absolutises links (positive control)', () => {
  const html = '<title>T</title><meta name="description" content="D"><main><h1>Hi</h1><p><a href="/x">x</a></p><form><input></form><script>alert(1)</script></main>'
  const md = pageMarkdown({ path: '/t', index: true }, html)
  assert.ok(md.includes('# Hi'))
  assert.ok(md.includes('[x](https://ecommerceteardown.com/x)'))
  assert.ok(!md.includes('alert') && !md.includes('input'))
})

test('the withdrawn AI teardown pages leave no trace in the sitemap, llms.txt or the page files', () => {
  assert.ok(!mentionsAiTeardown(read('sitemap.xml')), 'sitemap.xml mentions ai-teardown')
  assert.ok(!mentionsAiTeardown(read('llms.txt')), 'llms.txt mentions ai-teardown')
  for (const f of ['ai-teardown.md', 'ai-teardown.html', 'ai-teardown-success.html', 'src/ai-teardown.html', 'src/ai-teardown-success.html']) {
    assert.ok(!exists(f), `${f} still exists`)
  }
})

test('positive control: the ai-teardown check flags a string that contains it', () => {
  assert.ok(mentionsAiTeardown('<loc>https://ecommerceteardown.com/ai-teardown</loc>'))
  assert.ok(!mentionsAiTeardown('<loc>https://ecommerceteardown.com/free-teardown</loc>'))
})

test('the free teardown offer is withdrawn: no page, no markdown copy, no sitemap or llms.txt entry', () => {
  for (const f of ['free-teardown.html', 'free-teardown.md', 'src/free-teardown.html']) {
    assert.ok(!exists(f), `${f} still exists`)
  }
  assert.ok(!read('sitemap.xml').includes('free-teardown'))
  assert.ok(!read('llms.txt').includes('free-teardown'))
})
