import { SITE } from '../site.config.mjs'
import { schemasFor } from './schema.mjs'

export const canonicalUrl = (page) => SITE.url + page.path
export const mdPathFor = (page) => (page.path === '/' ? '/index.md' : `${page.path}.md`)

/** JSON in a <script> block: neutralise "<" so nothing inside can close the tag. */
const scriptJson = (obj) => JSON.stringify(obj).replace(/</g, '\u003c')

/** The head block that replaces the <!-- SEO --> marker. Empty for pages that are not indexed. */
export function seoBlock(page, html) {
  if (!page.index) return ''
  const lines = [
    `<link rel="canonical" href="${canonicalUrl(page)}">`,
    `<link rel="alternate" type="text/markdown" href="${mdPathFor(page)}">`,
    ...schemasFor(page, html).map((s) => `<script type="application/ld+json">${scriptJson(s)}</script>`),
  ]
  return lines.join('\n    ')
}
