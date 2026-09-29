import test from 'node:test'
import assert from 'node:assert/strict'
import { PAGES, SITE } from '../scripts/site.config.mjs'
import { seoBlock, canonicalUrl, mdPathFor } from '../scripts/lib/outputs.mjs'
import { schemasFor } from '../scripts/lib/schema.mjs'
import { read } from './helpers.mjs'

const jsonLd = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))
const norm = (u) => u.replace(/\/$/, '')

test('canonicalUrl and mdPathFor', () => {
  assert.equal(canonicalUrl({ path: '/' }), 'https://ecommerceteardown.com/')
  assert.equal(canonicalUrl({ path: '/consulting' }), 'https://ecommerceteardown.com/consulting')
  assert.equal(mdPathFor({ path: '/' }), '/index.md')
  assert.equal(mdPathFor({ path: '/consulting' }), '/consulting.md')
})

for (const page of PAGES.filter((p) => p.index)) {
  test(`${page.out}: one canonical, matching og:url, alternate markdown, valid JSON-LD`, () => {
    const html = read(page.out)
    const canon = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)]
    assert.equal(canon.length, 1, 'expected exactly one canonical')
    assert.equal(canon[0][1], canonicalUrl(page))
    const og = html.match(/property="og:url" content="([^"]+)"/)
    assert.ok(og, 'missing og:url')
    assert.equal(norm(og[1]), norm(canonicalUrl(page)))
    assert.ok(
      html.includes(`<link rel="alternate" type="text/markdown" href="${mdPathFor(page)}">`),
      'missing markdown alternate link'
    )
    const blocks = jsonLd(html)
    assert.equal(blocks.length, page.schema.length, 'JSON-LD block count does not match config')
    for (const b of blocks) {
      assert.equal(b['@context'], 'https://schema.org')
      assert.ok(b['@type'])
    }
  })
}

for (const page of PAGES.filter((p) => !p.index)) {
  test(`${page.out}: not indexed, so no canonical and no JSON-LD`, () => {
    const html = read(page.out)
    assert.ok(!html.includes('rel="canonical"'))
    assert.ok(!html.includes('application/ld+json'))
    assert.ok(!html.includes('<!-- SEO -->'), 'marker must be consumed')
  })
}

test('tricky characters survive into valid JSON-LD (positive control)', () => {
  const html =
    '<title>Q&amp;A page</title><meta name="description" content="It&rsquo;s a \\"test\\" &amp; more">' +
    '<div class="faq-item"><h3>Is it Richard&rsquo;s &amp; yours?</h3><p>Yes, it&rsquo;s &lt;fine&gt; &amp; \u201cquoted\u201d.</p></div>'
  const page = { path: '/x', index: true, schema: ['faq'], out: 'x.html' }
  const block = seoBlock(page, html)
  const parsed = jsonLd(block)
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0]['@type'], 'FAQPage')
  assert.equal(parsed[0].mainEntity[0].name, 'Is it Richard\u2019s & yours?')
  assert.ok(!block.includes('</script><'), 'a stray script close would break the page')
})

test('homepage carries Person and ProfessionalService with LinkedIn sameAs', () => {
  const blocks = jsonLd(read('index.html'))
  const person = blocks.find((b) => b['@type'] === 'Person')
  assert.ok(person)
  assert.equal(person.name, SITE.owner.name)
  assert.ok(person.sameAs.includes(SITE.owner.linkedin))
  assert.ok(blocks.find((b) => b['@type'] === 'ProfessionalService'))
})

test('schemasFor returns Service with offers for the consulting page', () => {
  const page = PAGES.find((p) => p.path === '/consulting')
  const s = schemasFor(page, read('src/consulting.html')).find((b) => b['@type'] === 'Service')
  assert.ok(s)
  assert.ok(s.offers.length >= 3)
  for (const o of s.offers) assert.equal(o.priceCurrency, 'AUD')
})

test('a FAQ answer containing a script close cannot break out of the JSON-LD block (regression)', () => {
  const html =
    '<title>T</title><meta name="description" content="d">' +
    '<div class="faq-item"><h3>Q?</h3><p>&lt;/script&gt;&lt;script&gt;alert(1)&lt;/script&gt;</p></div>'
  const page = { path: '/x', index: true, schema: ['faq'], out: 'x.html' }
  const block = seoBlock(page, html)
  const scriptBlocks = (block.match(/<script /g) || []).length
  assert.equal(scriptBlocks, 1)
  assert.equal((block.match(/<\/script>/g) || []).length, scriptBlocks, 'exactly one closing tag per script block')
  const parsed = jsonLd(block)
  assert.equal(parsed[0].mainEntity[0].acceptedAnswer.text, '</script><script>alert(1)</script>')
})

test('extractFaq finds every faq-item on the consulting page', async () => {
  const { extractFaq } = await import('../scripts/lib/html.mjs')
  const src = read('src/consulting.html')
  assert.equal(extractFaq(src).length, (src.match(/class="faq-item"/g) || []).length)
})

test('every FAQPage block carries at least one question', () => {
  for (const page of PAGES.filter((p) => p.index && p.schema.includes('faq'))) {
    const faq = jsonLd(read(page.out)).find((b) => b['@type'] === 'FAQPage')
    assert.ok(faq && faq.mainEntity.length > 0, `${page.out}: empty FAQPage`)
  }
})
