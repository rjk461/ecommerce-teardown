import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { build, injectNav } from '../scripts/build.mjs'
import { PAGES } from '../scripts/site.config.mjs'
import { ROOT, read, lf } from './helpers.mjs'

test('injectNav marks only the current page', () => {
  const tpl = '<a href="/cv"__ARIA_CV__>CV</a><a href="/consulting"__ARIA_CONSULTING__>C</a>'
  assert.equal(
    injectNav(tpl, 'cv'),
    '<a href="/cv" aria-current="page">CV</a><a href="/consulting">C</a>'
  )
  assert.equal(injectNav(tpl, null), '<a href="/cv">CV</a><a href="/consulting">C</a>')
})

test('injectNav handles hyphenated keys', () => {
  assert.equal(
    injectNav('<a href="/x"__ARIA_AI_STRATEGY__>x</a>', 'ai-strategy'),
    '<a href="/x" aria-current="page">x</a>'
  )
})

test('every page in the config has a source file and both markers', () => {
  for (const page of PAGES) {
    const src = read(`src/${page.src}`)
    assert.ok(src.includes('<!-- HEADER -->'), `${page.src} missing HEADER marker`)
    assert.ok(src.includes('<!-- FOOTER -->'), `${page.src} missing FOOTER marker`)
  }
})

test('committed build output matches a fresh build (drift gate)', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'et-build-'))
  const written = await build({ root: ROOT, outDir: tmp })
  assert.ok(written.length >= PAGES.length, 'build wrote fewer files than pages')
  for (const rel of written) {
    const fresh = lf(fs.readFileSync(path.join(tmp, rel), 'utf8'))
    const committed = lf(read(rel))
    assert.equal(committed, fresh, `${rel} is stale: run npm run build:site and commit the result`)
  }
})

test('drift gate can fail: a stale copy is detected', () => {
  // Positive control: the comparison used above must reject differing text.
  assert.notEqual(lf('a\r\nb'), lf('a\r\nc'))
})
