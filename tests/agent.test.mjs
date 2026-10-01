import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { PAGES, OFFERS } from '../scripts/site.config.mjs'
import { SKILL_PATH, INDEX_PATH, CATALOG_PATH, BOOKING_URL } from '../scripts/lib/agent.mjs'
import { read } from './helpers.mjs'

const bytes = (p) => fs.readFileSync(new URL(`..${p}`, import.meta.url))

test('the skills index digest is the SHA-256 of the exact bytes of the skill file it points at', () => {
  const idx = JSON.parse(bytes(INDEX_PATH).toString('utf8'))
  assert.equal(idx.$schema, 'https://schemas.agentskills.io/discovery/0.2.0/schema.json')
  assert.equal(idx.skills.length, 1)
  const s = idx.skills[0]
  assert.match(s.name, /^[a-z0-9-]+$/)
  assert.equal(s.type, 'skill-md')
  assert.equal(s.url, `https://ecommerceteardown.com${SKILL_PATH}`)
  assert.equal(s.digest, 'sha256:' + crypto.createHash('sha256').update(bytes(SKILL_PATH)).digest('hex'))
})

test('digest check can fail (positive control)', () => {
  const a = crypto.createHash('sha256').update('a').digest('hex')
  assert.notEqual(a, crypto.createHash('sha256').update('b').digest('hex'))
})

test('the skill file states every offer price and the booking link, and claims no API or payment service', () => {
  const t = bytes(SKILL_PATH).toString('utf8')
  assert.match(t, /^---\nname: ecommerce-teardown-consulting\n/)
  for (const o of OFFERS) assert.ok(t.includes(`$${o.price.toLocaleString('en-AU')}`), `${o.name} price missing`)
  assert.ok(t.includes(BOOKING_URL))
  assert.match(t, /no public API, login or payment service/i)
})

test('ai-catalog.json follows the structure the ARD scanner requires, and every entry points at a file that exists', () => {
  const c = JSON.parse(bytes(CATALOG_PATH).toString('utf8'))
  assert.ok(c.specVersion && c.host.displayName && c.host.identifier && c.entries.length > 0)
  for (const e of c.entries) {
    assert.ok(e.identifier.startsWith('urn:air:ecommerceteardown.com:'))
    assert.ok(e.displayName && e.type)
    assert.equal(['url', 'data'].filter((k) => k in e).length, 1, `${e.identifier} needs exactly one of url or data`)
    assert.ok(e.representativeQueries.length >= 2 && e.representativeQueries.length <= 5)
    const local = new URL(e.url).pathname
    assert.ok(fs.existsSync(new URL(`..${local}`, import.meta.url)), `${e.url} is not a file in this repo`)
  }
})

test('every public page registers the two WebMCP tools, read-only, behind feature detection', () => {
  for (const p of PAGES.filter((x) => x.index)) {
    const h = read(p.out)
    assert.ok(h.includes('mc.registerTool'), `${p.out} lost the WebMCP script`)
    assert.ok(h.includes("name: 'get_services_and_prices'") && h.includes("name: 'get_booking_options'"))
    assert.ok(h.includes('if (!mc || !mc.registerTool) return;'), `${p.out} must feature-detect`)
    assert.equal((h.match(/readOnlyHint: true/g) || []).length, 2)
  }
})
