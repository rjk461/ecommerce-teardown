import test from 'node:test'
import assert from 'node:assert/strict'
import { PAGES } from '../scripts/site.config.mjs'
import { mdPathFor } from '../scripts/lib/outputs.mjs'
import middleware, { config } from '../middleware.js'

const indexed = PAGES.filter((p) => p.index)

test('middleware matcher covers exactly the indexed pages', () => {
  assert.deepEqual([...config.matcher].sort(), indexed.map((p) => p.path).sort())
})

test('text/markdown gets the page .md copy, browsers get HTML', () => {
  for (const p of indexed) {
    const md = middleware(new Request(`https://ecommerceteardown.com${p.path}`, { headers: { accept: 'text/markdown' } }))
    assert.equal(md.headers.get('x-middleware-rewrite'), `https://ecommerceteardown.com${mdPathFor(p)}`, p.path)
    const html = middleware(new Request(`https://ecommerceteardown.com${p.path}`, { headers: { accept: 'text/html,application/xhtml+xml' } }))
    assert.equal(html.headers.get('x-middleware-rewrite'), null, `${p.path} must not rewrite for a browser`)
  }
})

test('every markdown target exists', async () => {
  const { existsSync } = await import('node:fs')
  for (const p of indexed) assert.ok(existsSync(new URL(`..${mdPathFor(p)}`, import.meta.url)), mdPathFor(p))
})
