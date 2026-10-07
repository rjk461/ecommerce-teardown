import test from 'node:test'
import assert from 'node:assert/strict'
import { MEDIA } from '../scripts/media.config.mjs'
import { validateMedia, mediaArchive, featuredMedia, mediaCollectionSchema } from '../scripts/lib/media.mjs'
import { SITE } from '../scripts/site.config.mjs'
import { read } from './helpers.mjs'

const fixture = () => structuredClone(MEDIA[0])
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))

test('unreviewed, excluded, duplicated and unsafe sources cannot enter the build', () => {
  const held = fixture(); held.status = 'held'
  const unscreened = fixture(); delete unscreened.screening
  const excluded = fixture(); excluded.summary = 'An interview mentioning crowdfunding.'
  const unsafe = fixture(); unsafe.url = 'https://name:password@example.com/interview'
  const invalidDate = fixture(); invalidDate.published = '2026-02-30'
  for (const item of [held, unscreened, excluded, unsafe, invalidDate]) assert.throws(() => validateMedia([item]))
  assert.throws(() => validateMedia([fixture(), fixture()]), /Duplicate/)
  assert.equal(validateMedia(MEDIA).length, MEDIA.length)
})

test('publisher text and URLs are escaped in rendered records', () => {
  const item = fixture()
  item.title = '<img src=x onerror="alert(1)">'
  item.summary = 'Research & "retail" <script>alert(1)</script>'
  item.url = 'https://example.com/?q="test"&x=1'
  const html = mediaArchive([item])
  assert.ok(!html.includes('<img src=x') && !html.includes('<script>'))
  assert.ok(html.includes('&lt;img') && html.includes('q=&quot;test&quot;&amp;x=1'))
})

test('unknown publication dates stay absent from CreativeWork metadata', () => {
  const item = fixture(); item.published = null; item.year = 2022
  const schema = mediaCollectionSchema(SITE, SITE.url + '/#richard-kelsey', [item])
  assert.ok(!('datePublished' in schema.mainEntity.itemListElement[0].item))
  assert.match(mediaArchive([item]), /2022/)
  assert.ok(!mediaArchive([item]).includes('1 January'))
})

test('every archive source appears once in visible HTML, Markdown and collection metadata', () => {
  const html = read('media.html'), markdown = read('media.md')
  const collection = jsonLd(html).find((block) => block['@type'] === 'CollectionPage')
  assert.equal(collection.mainEntity.numberOfItems, MEDIA.length)
  assert.equal((html.match(/data-media-id=/g) || []).length, MEDIA.length)
  for (const item of MEDIA) {
    assert.equal((html.match(new RegExp('data-media-id="' + item.id + '"', 'g')) || []).length, 1)
    assert.ok(markdown.includes(item.url), item.id + ' missing from Markdown')
    assert.ok(collection.mainEntity.itemListElement.some((entry) => entry.item.url === item.url))
  }
  assert.ok(!/crowd[\s-]?fund|birchal/i.test(html + markdown))
})

test('six original editions and six Crafty Pint results editions have distinct source dates', () => {
  const editions = MEDIA.filter((item) => item.category === 'editions')
  assert.deepEqual(editions.map((item) => item.edition).sort(), [2016, 2017, 2018, 2019, 2020, 2022])
  assert.equal(editions.find((item) => item.edition === 2022).published, '2023-03-03')
  for (const year of [2016, 2017, 2018, 2019, 2020, 2022]) {
    assert.ok(MEDIA.some((item) => item.publisher === 'The Crafty Pint' && (year === 2016 ? item.id === 'crafty-what-drinkers-want' : year === 2018 ? item.id === 'crafty-balter-survey-2018' : item.id.includes('results-' + year))), 'Missing Crafty Pint results edition ' + year)
  }
  const caseHtml = read('case-studies/australian-craft-beer-survey.html')
  for (const item of editions) assert.ok(caseHtml.includes(item.url))
  assert.ok(caseHtml.includes('Geoff Huens') && caseHtml.includes('random sample'))
})

test('identity links use profile URLs and preserve the existing Person ID', () => {
  for (const file of ['index.html', 'cv.html']) {
    const person = jsonLd(read(file)).find((block) => block['@type'] === 'Person')
    assert.equal(person['@id'], 'https://ecommerceteardown.com/#richard-kelsey')
    assert.deepEqual(person.sameAs, [SITE.owner.linkedin, 'https://made4tradies.com.au/about/richard-kelsey'])
    assert.ok(!person.sameAs.some((url) => MEDIA.some((item) => item.url === url)))
  }
  const cv = read('cv.html')
  assert.ok(cv.includes('href="https://made4tradies.com.au/about/richard-kelsey"'))
  assert.ok(cv.includes('/Sample/Richard-Kelsey-CV.pdf'))
  const profile = jsonLd(cv).find((block) => block['@type'] === 'ProfilePage')
  assert.equal(profile.mainEntity['@id'], 'https://ecommerceteardown.com/#richard-kelsey')
})

test('homepage and biography select the same three approved sources', () => {
  const selected = MEDIA.filter((item) => item.featured)
  assert.equal(selected.length, 3)
  assert.equal((featuredMedia().match(/data-media-id=/g) || []).length, 3)
  for (const file of ['index.html', 'cv.html']) for (const item of selected) assert.ok(read(file).includes('data-media-id="' + item.id + '"'))
})

test('archive summaries use Australian spelling', () => {
  for (const item of MEDIA) assert.doesNotMatch(item.summary, /\b(organiz|optimiz|prioritiz|analyz|behavior|customiz|personaliz)/i, item.id)
})

test('podcast display dates use Australia while source timestamps remain exact', () => {
  const podcasts = MEDIA.filter((item) => item.id.startsWith('small-business-big-marketing'))
  assert.equal(podcasts.length, 2)
  const schema = mediaCollectionSchema(SITE, SITE.url + '/#richard-kelsey', podcasts)
  for (const item of podcasts) {
    assert.equal(new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date(item.sourcePublishedAt)), item.published)
    const work = schema.mainEntity.itemListElement.find((entry) => entry.item.url === item.url).item
    assert.equal(work.datePublished, item.sourcePublishedAt)
    assert.equal(item.screening.method, 'whole-audio-transcript')
  }
})
