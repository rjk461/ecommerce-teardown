import test from 'node:test'
import assert from 'node:assert/strict'
import { OFFERS, PAGES } from '../scripts/site.config.mjs'
import { read, stripTags } from './helpers.mjs'

// Pages that have not been rewritten for the consulting offers yet.
// Task 10 must delete this entry. ('/' was listed for Task 9 but already states its prices, so the stale-skip test removed it.)
export const PENDING_PRICE_PAGES = ['/consulting']

export const formatPrice = (n) => '$' + n.toLocaleString('en-AU')

/** Returns the offers (name and formatted price) whose price is not stated in the given page text. */
export function missingPrices(text, offers) {
  return offers.filter((o) => !text.includes(formatPrice(o.price))).map((o) => `${o.name} ${formatPrice(o.price)}`)
}

const pageText = (path) => {
  const page = PAGES.find((p) => p.path === path)
  assert.ok(page, `no PAGES entry for ${path}`)
  return stripTags(read(page.out))
}
const offersFor = (path) => OFFERS.filter((o) => o.pages.includes(path))
const paths = [...new Set(OFFERS.flatMap((o) => o.pages))]

test('price check can fail (positive control)', () => {
  const offers = [{ name: 'Audit', price: 1200 }]
  assert.deepEqual(missingPrices('The audit costs $1,200 fixed.', offers), [])
  assert.deepEqual(missingPrices('The audit costs $1,500 fixed.', offers), ['Audit $1,200'])
  assert.deepEqual(missingPrices('The audit costs 1200 fixed.', offers), ['Audit $1,200'])
  assert.equal(formatPrice(4500), '$4,500')
})

for (const path of paths) {
  if (PENDING_PRICE_PAGES.includes(path)) continue
  test(`${path} states every price it must state`, () => {
    assert.deepEqual(missingPrices(pageText(path), offersFor(path)), [])
  })
}

test('a page in PENDING_PRICE_PAGES must still be missing a price (no stale skip)', () => {
  for (const path of PENDING_PRICE_PAGES) {
    assert.ok(paths.includes(path), `${path} is in PENDING_PRICE_PAGES but no offer lists it`)
    assert.ok(
      missingPrices(pageText(path), offersFor(path)).length > 0,
      `${path} now states all its prices: remove it from PENDING_PRICE_PAGES`,
    )
  }
})
