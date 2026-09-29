import test from 'node:test'
import assert from 'node:assert/strict'
import { PAGES } from '../scripts/site.config.mjs'
import { mdPathFor } from '../scripts/lib/outputs.mjs'
import { read } from './helpers.mjs'

const cfg = JSON.parse(read('vercel.json'))
const indexed = PAGES.filter((p) => p.index)
const acceptRule = (r) => r.has?.find((h) => h.type === 'header' && h.key.toLowerCase() === 'accept')

test('every indexed page has an Accept: text/markdown rewrite to its .md copy', () => {
  for (const p of indexed) {
    const rule = cfg.rewrites.find((r) => r.source === p.path && acceptRule(r))
    assert.ok(rule, `no markdown rewrite for ${p.path}`)
    assert.equal(rule.destination, mdPathFor(p))
  }
})

test('the markdown rewrite matches agents and never matches a browser Accept header', () => {
  const rule = cfg.rewrites.find((r) => acceptRule(r))
  const re = new RegExp('^' + acceptRule(rule).value + '$')
  assert.ok(re.test('text/markdown'))
  assert.ok(re.test('text/markdown, text/html;q=0.9'))
  const chrome = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
  const firefox = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  const wild = '*/*'
  for (const a of [chrome, firefox, wild]) assert.ok(!re.test(a), `browser Accept matched: ${a}`)
})

test('every indexed page sends a Link header pointing at its markdown copy and the sitemap', () => {
  for (const p of indexed) {
    const rule = cfg.headers.find((h) => h.source === p.path)
    assert.ok(rule, `no headers rule for ${p.path}`)
    const link = rule.headers.find((h) => h.key === 'Link')
    assert.ok(link, `no Link header for ${p.path}`)
    assert.ok(link.value.includes(`<${mdPathFor(p)}>; rel="alternate"; type="text/markdown"`))
    assert.ok(link.value.includes('</sitemap.xml>; rel="sitemap"'))
  }
})

test('markdown and llms.txt are served with a text content type', () => {
  const md = cfg.headers.find((h) => /\.md/.test(h.source))
  assert.ok(md, 'no headers rule for .md files')
  assert.match(md.headers.find((h) => h.key === 'Content-Type').value, /^text\/markdown/)
  const llms = cfg.headers.find((h) => h.source === '/llms.txt')
  assert.match(llms.headers.find((h) => h.key === 'Content-Type').value, /^text\/plain/)
})

test('existing config is preserved', () => {
  assert.equal(cfg.cleanUrls, true)
  assert.equal(cfg.trailingSlash, false)
  assert.equal(cfg.functions['api/*.js'].maxDuration, 300)
  assert.ok(cfg.headers.find((h) => h.source === '/(.*)').headers.some((h) => h.key === 'X-Content-Type-Options'))
})

test('robots.txt allows the crawlers, states Content Signals and points at the sitemap', () => {
  const t = read('robots.txt')
  assert.match(t, /^Content-Signal: search=yes, ai-input=yes, ai-train=yes$/m)
  assert.match(t, /^Sitemap: https:\/\/ecommerceteardown\.com\/sitemap\.xml$/m)
  for (const ua of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Googlebot', 'Google-Extended']) {
    assert.match(t, new RegExp(`^User-agent: ${ua}$`, 'm'), `robots.txt missing ${ua}`)
  }
  assert.ok(!/^Disallow: \/$/m.test(t), 'a blanket Disallow: / would block every crawler')
})
