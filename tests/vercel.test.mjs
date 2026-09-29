import test from 'node:test'
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { PAGES } from '../scripts/site.config.mjs'
import { mdPathFor } from '../scripts/lib/outputs.mjs'
import { read, mentionsAiTeardown, ROOT } from './helpers.mjs'

const cfg = JSON.parse(read('vercel.json'))
const indexed = PAGES.filter((p) => p.index)
test('no Accept: text/markdown rewrite is configured, because Vercel does not fire it on these pages', () => {
  // Tested live on a Vercel preview on 2026-09-30: with cleanUrls and static pages, a rewrite
  // keyed on the Accept header never fired (Accept: text/markdown still returned text/html).
  // Vercel's docs (vercel.json page, last updated 2026-08-14) say a rewrite source should not
  // be a file. Agents find the Markdown through the Link header and llms.txt instead.
  assert.equal(cfg.rewrites, undefined)
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

test('the withdrawn teardown pages redirect temporarily to /consulting', () => {
  assert.ok(Array.isArray(cfg.redirects), 'no redirects array')
  for (const source of ['/ai-teardown', '/ai-teardown-success', '/free-teardown']) {
    const r = cfg.redirects.find((x) => x.source === source)
    assert.ok(r, `no redirect for ${source}`)
    assert.equal(r.destination, '/consulting')
    assert.equal(r.permanent, false, `${source} must be a temporary redirect: the tool may return`)
  }
})

test('no rewrite and no header rule refers to the AI teardown pages', () => {
  for (const r of cfg.rewrites || []) assert.ok(!mentionsAiTeardown(r.source), `rewrite source ${r.source}`)
  for (const h of cfg.headers) assert.ok(!mentionsAiTeardown(h.source), `header source ${h.source}`)
})

test('positive control: the ai-teardown check flags a string that contains it', () => {
  assert.ok(mentionsAiTeardown('/ai-teardown'))
  assert.ok(mentionsAiTeardown('</ai-teardown.md>; rel="alternate"'))
  assert.ok(!mentionsAiTeardown('/free-teardown'))
})

/** Problems that mean a serverless function is still wired up: a functions block in vercel.json, or tracked files under api/. */
const functionProblems = (config, trackedApiFiles) => {
  const problems = []
  if ('functions' in config) problems.push('vercel.json has a functions block')
  for (const f of trackedApiFiles) problems.push(`tracked file under api/: ${f}`)
  return problems
}

test('the teardown serverless functions are offline: no functions block and no tracked api/ files', () => {
  const tracked = execFileSync('git', ['ls-files', 'api'], { cwd: ROOT, encoding: 'utf8' }).split(/\s+/).filter(Boolean)
  assert.deepEqual(functionProblems(cfg, tracked), [])
})

test('positive control: the functions check flags a functions block and a tracked api/ file', () => {
  assert.deepEqual(functionProblems({ functions: { 'api/*.js': { maxDuration: 300 } } }, []), ['vercel.json has a functions block'])
  assert.deepEqual(functionProblems({}, ['api/x.js']), ['tracked file under api/: api/x.js'])
  assert.deepEqual(functionProblems({}, []), [])
})
