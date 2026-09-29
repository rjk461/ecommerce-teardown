import test from 'node:test'
import assert from 'node:assert/strict'
import { read, stripTags } from './helpers.mjs'

// Pages written from scratch for this project. Add new pages here.
export const NEW_PAGES = ['src/ai-strategy.html']

const BANNED = [
  'delve', 'realm', 'harness', 'unlock', 'tapestry', 'paradigm', 'cutting-edge', 'revolutionize', 'landscape',
  'potential', 'findings', 'intricate', 'showcasing', 'crucial', 'pivotal', 'surpass', 'meticulously', 'vibrant',
  'unparalleled', 'underscore', 'leverage', 'synergy', 'innovative', 'game-changer', 'testament', 'commendable',
  'meticulous', 'highlight', 'emphasize', 'boast', 'groundbreaking', 'align', 'foster', 'showcase', 'enhance',
  'holistic', 'garner', 'accentuate', 'pioneering', 'trailblazing', 'unleash', 'versatile', 'transformative',
  'redefine', 'seamless', 'optimize', 'scalable', 'robust', 'breakthrough', 'empower', 'streamline', 'intelligent',
  'smart', 'next-gen', 'frictionless', 'elevate', 'adaptive', 'effortless', 'data-driven', 'insightful', 'proactive',
  'mission-critical', 'visionary', 'disruptive', 'reimagine', 'agile', 'customizable', 'personalized', 'unprecedented',
  'intuitive', 'leading-edge', 'synergize', 'democratize', 'automate', 'accelerate', 'state-of-the-art', 'dynamic',
  'reliable', 'efficient', 'cloud-native', 'immersive', 'predictive', 'transparent', 'proprietary', 'integrated',
  'plug-and-play', 'turnkey', 'future-proof', 'open-ended', 'ai-powered', 'next-generation', 'always-on',
  'hyper-personalized', 'results-driven', 'machine-first', 'paradigm-shifting',
]
const wordRe = (w) => new RegExp(`(^|[^a-z-])${w.replace(/[-]/g, '[- ]')}(?![a-z-])`, 'i')

export function findBanned(text) {
  return BANNED.filter((w) => wordRe(w).test(text))
}
export function findEmDash(html) {
  return /—|&mdash;|&#8212;/.test(html)
}

test('voice helpers can fail (positive control)', () => {
  assert.deepEqual(findBanned('We leverage a robust, seamless plan.'), ['leverage', 'seamless', 'robust'])
  assert.deepEqual(findBanned('Use it. Check the results.'), [])
  assert.ok(findEmDash('a — b'))
  assert.ok(findEmDash('a &mdash; b'))
  assert.ok(!findEmDash('a - b'))
})

for (const rel of NEW_PAGES) {
  test(`${rel}: Australian voice, no banned words, no em dashes`, () => {
    const html = read(rel)
    assert.equal(findEmDash(html), false, 'em dash found')
    assert.deepEqual(findBanned(stripTags(html)), [], 'banned words found')
  })
}

for (const rel of NEW_PAGES) {
  test(`${rel}: no American spellings`, () => {
    const text = stripTags(read(rel))
    for (const w of ['organization', 'optimization', 'prioritized', 'analyze', 'color', 'behavior', 'customize']) {
      assert.ok(!new RegExp(`\\b${w}`, 'i').test(text), `American spelling: ${w}`)
    }
  })
}
