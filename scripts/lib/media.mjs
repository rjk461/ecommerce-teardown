import { MEDIA, MEDIA_GROUPS } from '../media.config.mjs'

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))

export function validateMedia(items) {
  const ids = new Set(), urls = new Set()
  const groups = new Set(MEDIA_GROUPS.map((group) => group.id))
  for (const item of items) {
    if (item.status !== 'included' || !['article-body', 'publisher-transcript', 'whole-audio-transcript'].includes(item.screening?.method) || !item.screening.reviewed || !item.screening.evidence) throw new Error('Unreviewed media: ' + item.id)
    if (!item.id || ids.has(item.id) || urls.has(item.url)) throw new Error('Duplicate media: ' + item.id)
    if (!groups.has(item.category) || !item.title || !item.publisher || !item.summary || !item.attribution) throw new Error('Incomplete media: ' + item.id)
    const url = new URL(item.url)
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Unsafe media URL: ' + item.id)
    if (item.published && (!/^\d{4}-\d{2}-\d{2}$/.test(item.published) || Number.isNaN(Date.parse(item.published)) || new Date(item.published).toISOString().slice(0, 10) !== item.published)) throw new Error('Invalid publication date: ' + item.id)
    if (/crowd[\s-]?fund|birchal/i.test([item.title, item.summary, item.url].join(' '))) throw new Error('Excluded subject: ' + item.id)
    ids.add(item.id); urls.add(item.url)
  }
  return items
}

export function mediaDate(item) {
  if (!item.published) return item.year ? String(item.year) : 'Date not stated'
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(item.published))
}

function record(item, featured = false) {
  const h = escapeHtml
  return '<article class="' + (featured ? 'media-feature' : 'media-record') + '" data-media-id="' + h(item.id) + '">' +
    '<p class="media-meta">' + h(item.publisher) + ' &middot; ' + h(mediaDate(item)) + '</p>' +
    '<h3><a href="' + h(item.url) + '" target="_blank" rel="noopener">' + h(featured && item.featuredTitle ? item.featuredTitle : item.title) + '</a></h3>' +
    '<p>' + h(item.summary) + '</p><p class="media-attribution">' + h(item.attribution) + '</p></article>'
}

export function featuredMedia(items = MEDIA) {
  return '<div class="media-feature-grid">' + validateMedia(items).filter((item) => item.featured).map((item) => record(item, true)).join('\n') + '</div>'
}

const orderedMedia = (items) => MEDIA_GROUPS.flatMap((group) => items.filter((item) => item.category === group.id).sort((a, b) => (b.published || String(b.year || 0)).localeCompare(a.published || String(a.year || 0))))

export function mediaArchive(items = MEDIA) {
  validateMedia(items)
  const nav = '<nav class="media-jump" aria-label="Media categories">' + MEDIA_GROUPS.map((group) => '<a href="#' + group.id + '">' + escapeHtml(group.label) + ' <span>(' + items.filter((item) => item.category === group.id).length + ')</span></a>').join('') + '</nav>'
  return nav + MEDIA_GROUPS.map((group) => {
    const records = orderedMedia(items).filter((item) => item.category === group.id)
    return '<section class="media-group" id="' + group.id + '"><h2>' + escapeHtml(group.label) + '</h2><p class="media-group-intro">' + escapeHtml(group.description) + '</p>' + records.map((item) => record(item)).join('\n') + '</section>'
  }).join('\n')
}

export function surveyEditions(items = MEDIA) {
  return '<ul class="survey-editions">' + validateMedia(items).filter((item) => item.category === 'editions').sort((a, b) => a.edition - b.edition).map((item) => '<li><a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener">' + item.edition + ' survey report</a><span>Published ' + escapeHtml(mediaDate(item)) + '</span></li>').join('\n') + '</ul>'
}

export function mediaCollectionSchema(site, personId, items = MEDIA) {
  return {
    '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': site.url + '/media#collection',
    name: 'Richard Kelsey: media and podcasts', url: site.url + '/media', inLanguage: 'en-AU',
    about: { '@id': personId },
    mainEntity: { '@type': 'ItemList', numberOfItems: items.length, itemListElement: orderedMedia(validateMedia(items)).map((item, index) => ({
      '@type': 'ListItem', position: index + 1, item: {
        '@type': 'CreativeWork', name: item.title, url: item.url, description: item.summary,
        publisher: { '@type': 'Organization', name: item.publisher },
        ...(item.published ? { datePublished: item.sourcePublishedAt || item.published } : {}),
        ...(item.updated ? { dateModified: item.updated } : {}),
      },
    })) },
  }
}
