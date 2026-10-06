# Ecommerce Teardown

🔥 **Enter the Ring for Your FREE Website Teardown!**

A lucha libre-themed landing page for professional ecommerce website audits and teardowns.

## About

Richard Kelsey (3x Australian Retailer of the Year, scaled Beer Cartel to high 7-figure revenue) offers brutal, no-holds-barred website teardowns with the intensity of a lucha libre showdown.

## Services

- **Free Public Teardown**: Homepage review, 15-min video + written analysis
- **Private Single-Round**: $197 AUD - One page, private analysis
- **Private 3-Round Battle**: $799 AUD - Homepage + product + category pages  
- **Complete Championship Audit**: $1,997 AUD - 10 pages, technical SEO, 90-min strategy session

## Tech Stack

- Pure HTML/CSS (no frameworks)
- Mad Mex brand-inspired color palette
- Mobile responsive
- Deployed on Vercel
- Vercel Serverless Functions (for AI Teardown test mode)

## Design Inspiration

Mexican lucha libre wrestling aesthetic meets professional ecommerce consulting, inspired by Mad Mex restaurant branding.

## Color Palette

- Mad Green: `#00A651`
- Mad Red: `#C8102E`
- Mad Pink: `#E91E63`
- Mad Yellow: `#F8B500`
- Mad Cream: `#F5EFE6`

## Local Development

Page copy lives in `src/*.html` and `partials/`. After editing, run `npm run build:site` to regenerate the root `*.html`, the `.md` copies, `sitemap.xml` and `llms.txt`, then `npm test`. Open `index.html` in a browser to preview (Vercel deploys the root files from `main`; there is no build step on Vercel).

### Agent discovery and DNS
**Published and verified 2026-10-07, 10:17 AEDT.** Richard added `port=443` in GoDaddy. A fresh public scan accepted the ServiceMode record with port 443 and DNSSEC validation; the displayed score increased from **60/100 to 67/100**, with **Discoverability 4/4** and Level 4 (Agent-Integrated). The other displayed categories remained Content 1/1, Bot Access Control 2/2 and API/Auth/MCP/Skill Discovery 3/8. Commerce remains optional. Some regional resolver caches initially retained the earlier record under its one-hour TTL.

The dated proposal below is retained as the pre-change record; its approval and publication steps have now been completed. The rollback value remains valid.

The consulting site exposes its services and booking options through two browser WebMCP tools. Its generated agent skill, skills index and AI catalog live under `.well-known/`; their source is `scripts/lib/agent.mjs`, using facts and prices from `scripts/site.config.mjs`. The site has no public HTTP API, authentication service, remote MCP server or checkout. Publish metadata only for services that actually exist. The scanner's commerce checks are informational and do not affect its displayed score.

**DNS change pending Richard's approval, 2026-10-07 (Sydney).** The public [agent-readiness report](https://isitagentready.com/ecommerceteardown.com) displays 60/100. Its DNS-AID check rejects the existing ServiceMode SVCB record because it lacks an explicit port. The existing record was authenticated by validating DNS resolvers; DNSSEC does not need to be enabled again.

In GoDaddy, edit the existing SVCB record, preserving its name, priority, target, ALPN and one-hour TTL. Add only `port=443`:

```dns
_index._agents.ecommerceteardown.com. 3600 IN SVCB 1 ecommerceteardown.com. alpn="h2" port=443
```

Rollback: restore the existing value `1 ecommerceteardown.com. alpn=h2`, with TTL 3600. This record is separate from the website's A/CNAME and email records.

After the approved edit, confirm the record in GoDaddy, then query its SVCB RRset through both [Google DNS](https://dns.google/resolve?name=_index._agents.ecommerceteardown.com&type=SVCB&do=1) and [Cloudflare DNS](https://cloudflare-dns.com/dns-query?name=_index._agents.ecommerceteardown.com&type=SVCB&do=1). Check for `port=443`, successful resolution and authenticated data (`AD=true`). Allow the existing one-hour cache TTL before treating an older answer as a failed publication. Rerun the public scanner and verify its DNS-AID result and displayed score; do not report an estimated score as achieved.

The scan also observed DNSSEC SERVFAIL responses for absent `_mcp._agents` and `_search._agents` names. Those observations do not negate authentication of the existing `_index._agents` record, but do prevent claiming that all discovery-name lookups are healthy. If validation fails after publication, investigate the provider's signing responses before making further DNSSEC changes.

This correction meets the scanner's explicit-port requirement. It does not establish a working MCP/A2A service or guarantee AI search rankings. [DNS-AID remains an Internet-Draft](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/); [RFC 9460](https://www.rfc-editor.org/rfc/rfc9460) defines the underlying SVCB format.

### Telling Bing about new or changed pages (IndexNow)

After a merge has deployed, run `npm run indexnow` to submit every URL in `sitemap.xml`, or `npm run indexnow -- <url>` for one page. It needs the site live first, because IndexNow checks the key file at the site root. The key is public by design.

### Restoring the AI teardown tool

The withdrawn teardown tool's `api/` functions live on in git at the tag `ai-teardown-tool-last-live`. To bring them back: `git checkout ai-teardown-tool-last-live -- api`, then reinstall the packages it used (`@anthropic-ai/sdk`, `@sparticuz/chromium`, `@vercel/blob`, `openai`, `resend`, `zod`) and set fresh OpenAI, Blob and Resend keys in Vercel.

### AI Teardown test mode (no Stripe)

**Withdrawn 2026-09-29:** the `/ai-teardown` and `/ai-teardown-success` pages are no longer part of the site (both redirect to `/consulting`, as does `/free-teardown`, the free teardown offer withdrawn on 2026-09-30). The `api/` functions were removed on 2026-09-29 (recoverable from git history), so the steps below no longer work; they are kept as the record of how the tool was tested.

You can generate a teardown report without a payment gateway:

- Open: `/ai-teardown?test=1` (page withdrawn, see above)
- Submit a URL + email + notes
- The page will call `POST /api/test-teardown` and return:
  - mobile + desktop screenshots (full-page)
  - an OpenAI-generated teardown
  - a downloadable PDF with branded title
  - automatic email delivery with PDF attachment (if email provided)

#### Required environment variables (Vercel)

**AI Provider (default: OpenAI)**
- `OPENAI_API_KEY` (default path) - Vision model default: `gpt-4.1` (set `OPENAI_MODEL` to override; `gpt-4o` is a good fallback).
- Optional Claude override: set `CLAUDE_API_KEY` (and optionally `CLAUDE_MODEL`, default `claude-sonnet-4-5-20250929`). Claude is only used if OpenAI is not configured.

#### Optional (recommended) storage

If you set up Vercel Blob, the API will store the PDF/screenshots and return public URLs:

- `BLOB_READ_WRITE_TOKEN`

If Blob is not configured, the implementation falls back to in-memory storage (suitable for local/dev only; not reliable across serverless invocations).

#### Optional email delivery

To enable automatic email delivery of reports:

- `RESEND_API_KEY` (required for email)
- `RESEND_FROM_EMAIL` (optional, default: `reports@ecommerceteardown.com`)

If Resend is not configured, reports are still generated and returned via API response, but emails are not sent.

## Deployment

Deployed automatically via Vercel on push to `main` branch.

## License

© 2026 Richard Kelsey. All rights reserved.

## Contact

- Website: [ecommerceteardown.com](https://ecommerceteardown.com)
- LinkedIn: [Connect with Richard](https://linkedin.com/in/richardkelsey)

---

**Let's build something new** 🎭💪🔥
