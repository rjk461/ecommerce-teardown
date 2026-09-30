/**
 * Single source of truth for the machine-readable layer:
 * canonical URLs, JSON-LD, sitemap.xml, llms.txt and the Markdown copies of pages.
 * Titles and descriptions are NOT stored here: they are read from each page's own head.
 */

export const SITE = {
  url: 'https://ecommerceteardown.com',
  name: 'Ecommerce Teardown',
  ogImage: 'https://ecommerceteardown.com/images/og-image.png',
  // A photo of Richard, used as the Person and ProfessionalService image (og-image.png is a social-card graphic).
  ownerImage: 'https://ecommerceteardown.com/images/richard-headshot-360.webp',
  // One facts block. llms.txt and the JSON-LD descriptions both use it, so the claims match everywhere.
  summary:
    'Richard Kelsey is an ecommerce and AI consultant based in Sydney, Australia. He co-founded Beer Cartel in 2009 and built it into Australia’s #1 online craft beer retailer, staying on until September 2025 after the 2024 sale. He has been named one of the Top 50 People in Australian Ecommerce three times by Inside Retail. He works with Australian online retailers on ecommerce growth and practical AI.',
  owner: {
    name: 'Richard Kelsey',
    jobTitle: 'Ecommerce and AI consultant',
    linkedin: 'https://www.linkedin.com/in/richardkelsey',
    locality: 'Sydney',
    region: 'NSW',
    country: 'AU',
  },
}

/**
 * nav:    null | 'cv' | 'consulting' | 'ai-strategy'  (which header link is aria-current)
 * path:   public URL path ('/' for the homepage)
 * index:  true = public page: canonical, sitemap, llms.txt and a .md copy. false = none of those.
 * schema: which JSON-LD blocks to emit
 * llms:   null, or { section, label } for llms.txt
 */
export const PAGES = [
  { src: 'index.html', out: 'index.html', nav: null, path: '/', index: true,
    schema: ['person', 'professionalService', 'website'], llms: { section: 'About', label: 'Home' } },
  { src: 'cv.html', out: 'cv.html', nav: 'cv', path: '/cv', index: true,
    schema: ['person'], llms: { section: 'About', label: 'Experience' } },
  { src: 'articles.html', out: 'articles.html', nav: null, path: '/articles', index: false,
    schema: [], llms: null },
  { src: 'linkedin.html', out: 'linkedin.html', nav: null, path: '/linkedin', index: true,
    schema: [], llms: { section: 'Writing', label: 'LinkedIn posts' } },
  { src: 'sample-teardowns.html', out: 'sample-teardowns.html', nav: null, path: '/sample-teardowns', index: true,
    schema: [], llms: { section: 'Optional', label: 'Sample teardowns' } },
  { src: 'coming-soon.html', out: 'coming-soon.html', nav: null, path: '/coming-soon', index: false,
    schema: [], llms: null },
  { src: '404.html', out: '404.html', nav: null, path: '/404', index: false,
    schema: [], llms: null },
  { src: 'consulting.html', out: 'consulting.html', nav: 'consulting', path: '/consulting', index: true,
    schema: ['professionalService', 'service', 'faq'], llms: { section: 'Services', label: 'Consulting' } },
  { src: 'ai-strategy.html', out: 'ai-strategy.html', nav: 'ai-strategy', path: '/ai-strategy', index: true,
    schema: ['professionalService', 'service', 'faq'], llms: { section: 'Services', label: 'AI strategy for ecommerce' } },
  { src: 'ai-search-readiness.html', out: 'ai-search-readiness.html', nav: 'ai-strategy', path: '/ai-search-readiness', index: true,
    schema: ['professionalService', 'service', 'faq'], llms: { section: 'Services', label: 'AI search readiness audit' } },
  { src: 'ai-readiness-study.html', out: 'ai-readiness-study.html', nav: null, path: '/ai-readiness-study', index: true, published: '2026-09-30',
    schema: ['article'], llms: { section: 'Writing', label: 'Can AI find Australian online retailers? A 123-store study' } },
]

/** Prices, AUD. `pages` lists every page that must state the price (a test enforces it). */
export const OFFERS = [
  { id: 'ai-search-readiness-audit', name: 'AI Search Readiness Audit', price: 1200, from: false,
    description: 'A fixed-price audit of how visible a retailer is to AI search and shopping agents: written report plus a 45-minute walkthrough.',
    path: '/ai-search-readiness', pages: ['/ai-search-readiness', '/ai-strategy', '/consulting'] },
  { id: 'ecommerce-ai-growth-audit', name: 'Ecommerce and AI Growth Audit', price: 1500, from: false,
    description: 'A fixed-price audit of one store, with a written report and a 60-minute walkthrough.',
    path: '/consulting', pages: ['/ai-strategy', '/consulting'] },
  { id: 'ai-strategy-sprint', name: 'AI Strategy Sprint', price: 4500, from: false,
    description: 'Two weeks, fixed price: an AI roadmap, two or three prioritised use cases and a 90-day plan.',
    path: '/ai-strategy', pages: ['/ai-strategy', '/consulting'] },
  { id: 'monthly-consulting', name: 'Monthly consulting', price: 3500, from: true,
    description: 'Two days a month of ongoing ecommerce and AI advice, one-month minimum.',
    path: '/consulting', pages: ['/', '/consulting', '/ai-strategy'] },
  { id: 'ad-hoc-consulting', name: 'Ad hoc consulting', price: 500, from: true,
    description: 'Fixed-scope, one-off work from $500, or a day rate of $2,000.',
    path: '/consulting', pages: ['/', '/consulting'] },
]
