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

test('every markdown rewrite carries the identical Accept has value', () => {
  const rules = cfg.rewrites.filter((r) => acceptRule(r))
  assert.equal(rules.length, indexed.length)
  const values = new Set(rules.map((r) => JSON.stringify(r.has)))
  assert.equal(values.size, 1, `rewrites disagree on the Accept match: ${[...values].join(' | ')}`)
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

// One constant drives both directions: every token below must be in robots.txt, and robots.txt must name no other token.
const BOT_TOKENS = [
  'Googlebot', 'Google-Extended', 'bingbot',
  'OAI-SearchBot', 'GPTBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'Claude-Web',
  'PerplexityBot', 'Perplexity-User',
  'Applebot', 'Applebot-Extended', 'CCBot',
]

/** RFC 9309 grouping: consecutive User-agent lines share the rules that follow them. Comments and blank lines are ignored. */
function robotsGroups(text) {
  const groups = []
  let cur = null
  let lastWasAgent = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) continue
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/)
    if (!m) continue
    const key = m[1].toLowerCase()
    if (key === 'sitemap') continue
    if (key === 'user-agent') {
      if (!lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur) }
      cur.agents.push(m[2])
      lastWasAgent = true
    } else if (cur) {
      cur.rules.push(`${m[1]}: ${m[2]}`)
      lastWasAgent = false
    }
  }
  return groups
}

/** Problems found for a bot: not named, or its group lacks the signal, Allow: / or Disallow: /api/. */
function robotsProblems(text, bots) {
  const groups = robotsGroups(text)
  const problems = []
  for (const ua of bots) {
    const g = groups.find((x) => x.agents.includes(ua))
    if (!g) { problems.push(`${ua}: no group`); continue }
    for (const rule of ['Content-Signal: search=yes, ai-input=yes, ai-train=yes', 'Allow: /', 'Disallow: /api/']) {
      if (!g.rules.includes(rule)) problems.push(`${ua}: group lacks "${rule}"`)
    }
  }
  return problems
}

test('robots.txt allows the crawlers, states Content Signals and points at the sitemap', () => {
  const t = read('robots.txt')
  assert.match(t, /^Content-Signal: search=yes, ai-input=yes, ai-train=yes$/m)
  assert.match(t, /^Sitemap: https:\/\/ecommerceteardown\.com\/sitemap\.xml$/m)
  for (const ua of BOT_TOKENS) {
    assert.match(t, new RegExp(`^User-agent: ${ua}$`, 'm'), `robots.txt missing ${ua}`)
  }
  assert.ok(!/^Disallow: \/$/m.test(t), 'a blanket Disallow: / would block every crawler')
})

test('robots.txt names no crawler outside the list', () => {
  const named = [...read('robots.txt').matchAll(/^User-agent:\s*(\S+)\s*$/gm)].map((m) => m[1]).filter((u) => u !== '*')
  assert.deepEqual([...named].sort(), [...BOT_TOKENS].sort())
})

test('every listed bot and * share one group that has the Content Signal, Allow: / and Disallow: /api/', () => {
  const t = read('robots.txt')
  assert.deepEqual(robotsProblems(t, ['*', ...BOT_TOKENS]), [])
  assert.equal(robotsGroups(t).length, 1, 'expected a single group')
})

test('positive control: a named bot with its own group and no Disallow: /api/ is caught', () => {
  const bad = [
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=yes',
    'Allow: /',
    'Disallow: /api/',
    '',
    'User-agent: GPTBot',
    'Allow: /',
  ].join('\n')
  const problems = robotsProblems(bad, ['*', 'GPTBot'])
  assert.ok(problems.some((p) => p.startsWith('GPTBot') && p.includes('Disallow: /api/')), problems.join('; '))
  assert.ok(problems.some((p) => p.startsWith('GPTBot') && p.includes('Content-Signal')), problems.join('; '))
  assert.deepEqual(robotsProblems(bad, ['*']), [], 'the * group alone is fine')
  assert.equal(robotsGroups(bad).length, 2)
})
