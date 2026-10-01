import { SITE, OFFERS } from '../site.config.mjs'
import { extractFaq, getTitle, getMetaDescription } from './html.mjs'

const CONTEXT = 'https://schema.org'
const PERSON_ID = `${SITE.url}/#richard-kelsey`
const SERVICE_ID = `${SITE.url}/#consulting`

const person = () => ({
  '@context': CONTEXT,
  '@type': 'Person',
  '@id': PERSON_ID,
  name: SITE.owner.name,
  jobTitle: SITE.owner.jobTitle,
  description: SITE.summary,
  url: SITE.url + '/',
  image: SITE.ownerImage,
  sameAs: [SITE.owner.linkedin],
  address: {
    '@type': 'PostalAddress',
    addressLocality: SITE.owner.locality,
    addressRegion: SITE.owner.region,
    addressCountry: SITE.owner.country,
  },
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'University of Canterbury' },
    { '@type': 'CollegeOrUniversity', name: 'Massey University' },
  ],
  award: ['Top 50 People in Australian Ecommerce, Inside Retail (2019, 2021, 2022)'],
  knowsAbout: ['Ecommerce growth strategy', 'AI strategy for retailers', 'AI search readiness', 'Email marketing', 'Platform migrations'],
})

const professionalService = () => ({
  '@context': CONTEXT,
  '@type': 'ProfessionalService',
  '@id': SERVICE_ID,
  name: SITE.name,
  url: SITE.url + '/',
  description: SITE.summary,
  image: SITE.ownerImage,
  telephone: '+61405251864',
  address: {
    '@type': 'PostalAddress',
    addressLocality: SITE.owner.locality,
    addressRegion: SITE.owner.region,
    addressCountry: SITE.owner.country,
  },
  founder: { '@id': PERSON_ID },
  areaServed: { '@type': 'Country', name: 'Australia' },
  serviceType: ['Ecommerce consulting', 'AI strategy consulting', 'AI search readiness audit'],
})

const website = () => ({
  '@context': CONTEXT,
  '@type': 'WebSite',
  '@id': `${SITE.url}/#website`,
  name: SITE.name,
  url: SITE.url + '/',
  inLanguage: 'en-AU',
  publisher: { '@id': PERSON_ID },
})

const offerFor = (o) => {
  const base = { '@type': 'Offer', name: o.name, description: o.description, priceCurrency: 'AUD', url: SITE.url + o.path }
  return o.from
    ? { ...base, priceSpecification: { '@type': 'PriceSpecification', minPrice: o.price, priceCurrency: 'AUD' } }
    : { ...base, price: String(o.price) }
}

const service = (page, html) => ({
  '@context': CONTEXT,
  '@type': 'Service',
  name: getTitle(html).split('|')[0].trim(),
  description: getMetaDescription(html),
  url: SITE.url + page.path,
  provider: { '@id': SERVICE_ID },
  areaServed: { '@type': 'Country', name: 'Australia' },
  offers: OFFERS.filter((o) => o.pages.includes(page.path)).map(offerFor),
})

/**
 * Tag-stripping leaves a space where an inline tag ended ("readiness ."). Close the gap before punctuation.
 * A period only counts as sentence punctuation when whitespace or the end of the text follows it,
 * so a file extension or domain such as " .csv" or " .com" is left alone.
 */
const article = (page, html) => ({
  '@context': CONTEXT,
  '@type': 'Article',
  headline: getTitle(html).split('|')[0].trim(),
  description: getMetaDescription(html),
  url: SITE.url + page.path,
  mainEntityOfPage: SITE.url + page.path,
  datePublished: page.published,
  dateModified: page.modified || page.published,
  inLanguage: 'en-AU',
  image: SITE.ogImage,
  author: { '@id': PERSON_ID },
  publisher: { '@id': PERSON_ID },
})

export const tidyAnswerText = (text) => text.replace(/\s+([,;:?!])/g, '$1').replace(/\s+\.(?=\s|$)/g, '.')

const faq = (html) => ({
  '@context': CONTEXT,
  '@type': 'FAQPage',
  mainEntity: extractFaq(html).map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: tidyAnswerText(a) },
  })),
})

export function schemasFor(page, html) {
  const makers = {
    person: () => person(),
    professionalService: () => professionalService(),
    website: () => website(),
    service: () => service(page, html),
    faq: () => faq(html),
    article: () => article(page, html),
  }
  return page.schema.map((key) => makers[key]())
}
