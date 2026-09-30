import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { KEY, ENDPOINT, payload, sitemapUrls } from '../scripts/indexnow.mjs'
import { read } from './helpers.mjs'

test('the IndexNow key is valid and the key file at the site root contains exactly that key', () => {
  assert.match(KEY, /^[A-Za-z0-9-]{8,128}$/)
  assert.equal(fs.readFileSync(new URL(`../${KEY}.txt`, import.meta.url), 'utf8'), KEY)
})

test('the IndexNow payload names the production host, the key file, and every sitemap URL', () => {
  const urls = sitemapUrls(read('sitemap.xml'))
  assert.ok(urls.length >= 8 && urls.every((u) => u.startsWith('https://ecommerceteardown.com')))
  const p = payload(urls)
  assert.equal(p.host, 'ecommerceteardown.com')
  assert.equal(p.keyLocation, `https://ecommerceteardown.com/${KEY}.txt`)
  assert.deepEqual(p.urlList, urls)
  assert.equal(new URL(ENDPOINT).pathname, '/indexnow')
})

test('sitemapUrls finds nothing in an empty sitemap (positive control)', () => {
  assert.deepEqual(sitemapUrls('<urlset></urlset>'), [])
})
