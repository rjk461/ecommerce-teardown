import { SITE } from '../site.config.mjs'
import { schemasFor } from './schema.mjs'
import TurndownService from 'turndown'
import { getTitle, getMetaDescription, mainOrBody } from './html.mjs'


/** Shared image metadata. Page titles and descriptions remain in their source heads. */
export function socialImageMeta() {
  const escape = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  const image = escape(SITE.ogImage)
  const alt = escape(SITE.ogImageAlt)
  return [
    `<meta property="og:image" content="${image}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    `<meta property="og:image:alt" content="${alt}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:image" content="${image}">`,
    `<meta name="twitter:image:alt" content="${alt}">`,
  ].join('\n    ')
}

export const canonicalUrl = (page) => SITE.url + page.path
export const mdPathFor = (page) => (page.path === '/' ? '/index.md' : `${page.path}.md`)

/** JSON in a <script> block: neutralise "<" so nothing inside can close the tag. */
const scriptJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c')

/** The head block that replaces the <!-- SEO --> marker. Pages that are not indexed get a noindex tag instead of a canonical. */
export function seoBlock(page, html) {
  if (!page.index) return '<meta name="robots" content="noindex, follow">'
  const lines = [
    `<link rel="canonical" href="${canonicalUrl(page)}">`,
    `<link rel="alternate" type="text/markdown" href="${mdPathFor(page)}">`,
    ...schemasFor(page, html).map((s) => `<script type="application/ld+json">${scriptJson(s)}</script>`),
  ]
  return lines.join('\n    ')
}

const xmlEscape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export function sitemapXml(pages) {
  const urls = pages
    .filter((p) => p.index)
    .map((p) => `  <url>\n    <loc>${xmlEscape(canonicalUrl(p))}</loc>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

const SECTION_ORDER = ['Services', 'About', 'Writing', 'Optional']

/** entries: [{ page, title, description }] for indexed pages that have an llms entry. */
export function llmsTxt(entries) {
  const out = [`# ${SITE.name}`, '', `> ${SITE.summary}`, '']
  for (const section of SECTION_ORDER) {
    const rows = entries.filter((e) => e.page.llms.section === section)
    if (!rows.length) continue
    out.push(`## ${section}`, '')
    for (const { page, description } of rows) {
      const line = `- [${page.llms.label}](${SITE.url}${mdPathFor(page)})`
      out.push(description ? `${line}: ${description}` : line)
    }
    out.push('')
  }
  return out.join('\n')
}

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' })
td.remove(['script', 'style', 'form', 'noscript', 'svg', 'button', 'iframe', 'img', 'input', 'select', 'textarea'])

export function pageMarkdown(page, html) {
  const title = getTitle(html)
  const description = getMetaDescription(html)
  const body = td
    .turndown(mainOrBody(html))
    .replace(/\]\(\//g, `](${SITE.url}/`)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return `---\ntitle: ${title}\ndescription: ${description}\nurl: ${canonicalUrl(page)}\n---\n\n${body}\n`
}
