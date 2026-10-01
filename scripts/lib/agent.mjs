/**
 * Agent discovery files, generated from site.config.mjs so the prices and facts cannot drift from the site.
 * Only things that exist are described here: a plain-text skill, an index that points at it, and a catalog
 * that points at the skill and llms.txt. No API, login or payment service is claimed, because there is none.
 */
import crypto from 'node:crypto'
import { SITE, OFFERS } from '../site.config.mjs'

export const SKILL_NAME = 'ecommerce-teardown-consulting'
export const SKILL_PATH = `/.well-known/agent-skills/${SKILL_NAME}/SKILL.md`
export const INDEX_PATH = '/.well-known/agent-skills/index.json'
export const CATALOG_PATH = '/.well-known/ai-catalog.json'
export const BOOKING_URL = 'https://8coffees.ecommerceteardown.com/'
export const PHONE = '+61 405 251 864'

const money = (o) => `${o.from ? 'from ' : ''}AUD $${o.price.toLocaleString('en-AU')}`

export function skillMd() {
  const offers = OFFERS.map((o) => `- ${o.name}, ${money(o)}: ${o.description} Details: ${SITE.url}${o.path}`).join('\n')
  return `---
name: ${SKILL_NAME}
description: Facts about Richard Kelsey's ecommerce and AI consulting for Australian online retailers, with current prices and how to enquire. Use when someone asks who can audit a store for AI search readiness, what it costs, or how to book.
---

# Ecommerce Teardown consulting

${SITE.summary}

## Services and prices (AUD)

${offers}

## What this does not offer

- No ranking or AI-assistant mention is promised. The audit finds what can be fixed and what is outside your control.
- There is no public API, login or payment service on this site. Enquiries go to a person.

## How to enquire

- Book a coffee (a short intro call): ${BOOKING_URL}
- Phone: ${PHONE}
- Site: ${SITE.url}/ (a Markdown copy of every page is linked from ${SITE.url}/llms.txt)

Prices are those on the site when this file was generated. The pages above are the source of truth.
`
}

export const sha256 = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex')

export function skillsIndex(skillText) {
  return {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: SKILL_NAME,
        type: 'skill-md',
        description: 'Who Richard Kelsey is, what the consulting services cost, and how to book, for Australian online retailers.',
        url: SITE.url + SKILL_PATH,
        digest: `sha256:${sha256(skillText)}`,
      },
    ],
  }
}

export function aiCatalog() {
  return {
    specVersion: '1.0',
    host: { displayName: SITE.name, identifier: new URL(SITE.url).host },
    entries: [
      {
        identifier: `urn:air:${new URL(SITE.url).host}:skill:${SKILL_NAME}`,
        displayName: 'Ecommerce Teardown consulting: services, prices and how to book',
        type: 'text/markdown',
        url: SITE.url + SKILL_PATH,
        representativeQueries: [
          'who can audit my Australian online store for AI search readiness',
          'how much does an AI search readiness audit cost in Australia',
          'ecommerce consultant in Sydney with fixed-price audits',
          'how do I book an ecommerce and AI strategy consultant',
        ],
      },
      {
        identifier: `urn:air:${new URL(SITE.url).host}:index:llms-txt`,
        displayName: 'Ecommerce Teardown site index (llms.txt)',
        type: 'text/plain',
        url: `${SITE.url}/llms.txt`,
        representativeQueries: [
          'what pages does ecommerceteardown.com have',
          'Markdown copies of the Ecommerce Teardown pages',
        ],
      },
    ],
  }
}

/** Files to write, as { path (relative to the site root, no leading slash), content }. */
export function agentFiles() {
  const skill = skillMd()
  return [
    { path: SKILL_PATH.slice(1), content: skill },
    { path: INDEX_PATH.slice(1), content: JSON.stringify(skillsIndex(skill), null, 2) + '\n' },
    { path: CATALOG_PATH.slice(1), content: JSON.stringify(aiCatalog(), null, 2) + '\n' },
  ]
}
