## Consulting pivot, AI strategy pages and AI readiness layer

Held for Richard's approval. Do not merge until he says so: Vercel deploys `main` straight to production and the site carries his name.

### What changed, in plain terms

The site now sells consulting instead of looking for a full-time role.

- All job-seeking wording is gone. Availability reads "available for consulting, or a full or part time engagement".
- Two new pages cover AI: `/ai-strategy` and `/ai-search-readiness`.
- The homepage, consulting page, menu and footer lead with ecommerce growth plus AI.
- The CV page is now "Experience". A consulting version of the CV PDF is drafted for approval and is not live.
- Text colours are pure white and a lighter grey for better contrast.
- The $2.99 AI teardown page, its success page and the `api/` teardown functions are taken offline. The two old addresses redirect to `/consulting`.

### Offer ladder (AUD)

- Free teardown: withdrawn on 2026-09-30 at Richard's decision. The page, its form, every link to it, and its sitemap and llms.txt entries are gone. `/free-teardown` redirects (temporarily) to `/consulting`.
- AI Search Readiness Audit: $1,200 fixed.
- Ecommerce and AI Growth Audit: $1,500 fixed.
- AI Strategy Sprint: $4,500 over two weeks.
- Ad hoc work from $500, plus a $2,000 day rate.
- Monthly consulting from $3,500 for two days, one month minimum.

No new revenue figures. The existing "7-figure" wording is the only one used. No client names.

### Pages

New: `/ai-strategy`, `/ai-search-readiness`.
Rewritten: `/`, `/consulting`, `/cv` (now Experience), `/contact` (hand-maintained, see repo notes).
Header and footer: updated on every page.

### The AI readiness layer, and what it does not promise

Added: `robots.txt` with Content Signals, `sitemap.xml`, `llms.txt`, a Markdown copy of every page, `Link` headers, structured data (Person, ProfessionalService, WebSite, Service, FAQPage), canonical tags, and a Markdown copy of every page that agents can find through those headers and `llms.txt`. The plan included a rewrite to serve Markdown when a request sends `Accept: text/markdown`. It was tested on the Vercel preview on 2026-09-30 and did not fire (the page still came back as HTML), which matches Vercel's docs (updated 2026-08-14: a rewrite source should not be an existing file). It has been removed rather than shipped as dead config. Everything else was confirmed live on the preview: `Link` headers, `.md` and `llms.txt` content types, the two redirects, and a normal browser still receiving HTML.

It does not promise rankings or citations. Sources checked on 2026-09-29:

- Google's own page (last updated 2025-12-10) says no special files or markup are needed to appear in AI Overviews or AI Mode. For Google, ordinary SEO hygiene is the work.
- llmstxt.org (version 2, last modified 2026-08-10) defines `llms.txt`. Whether OpenAI or Anthropic crawlers read it is unconfirmed from their documentation, so the site makes no claim that it helps.
- Cloudflare's Agent Readiness check (published 2026-04-17) is the benchmark.
- AI training crawlers are allowed in `robots.txt`, at Richard's decision. `Claude-Web` is named because the scanner checks it, but it is not in Anthropic's current crawler documentation.

### Agent Readiness score

Before: 0 (Level 0, Not Ready), scanned 2026-09-29 14:46 AEST against the live site. Record: `docs/superpowers/agent-readiness-before.md`.
After: 33 (Level 2, Bot-Aware), scanned 2026-09-30 08:19 AEST on the preview. Record: `docs/superpowers/agent-readiness-after.md`. The 33 is not a target to push to 100: the rest of the checks (API catalogue, MCP, OAuth and similar) do not apply to a static consulting site. The Markdown negotiation check fails on purpose, see above. Production is re-scanned after merge.

### Checks run

- `npm test`: 120 pass, 0 fail (the count fell because the free teardown page and its checks went). Covers a stale build, job-seeking wording, prices on each page, broken internal links, banned words and contrast.
- Voice scan of the five changed pages: no banned words, em dashes, US spellings or AI sentence patterns.
- Phone width (375px): no sideways scrolling on `/`, `/ai-strategy`, `/ai-search-readiness`, `/consulting`, `/cv`, `/contact`.

### Open items for Richard

1. Approve the CV PDF draft: `C:\Users\rjk_4\personal-projects\ecommerce-teardown-consulting-pivot\docs\drafts\Richard-Kelsey-CV-consulting-DRAFT.pdf`. It replaces `Sample/Richard-Kelsey-CV.pdf` only after approval.
2. Confirm the prices above once more.
3. Confirmed by Richard on 2026-09-29: prices, CV draft, and these facts that could not be checked while signed out of LinkedIn: the Claude Code in Action course (March 2026), the May 2026 consulting start, the personal agent system built on the Claude API, Top 50 in 2019, 2021 and 2022, five platform migrations and four email platform implementations, AI-assisted customer service and personalisation at Beer Cartel, and the "about a week" turnaround on the AI Search Readiness Audit.
3a. The live `/cv` page still shows the old CV PDF, which opens with "Head of Ecommerce and CMO". Approving the draft and swapping it in fixes that, so do not merge before then.
4. Update the LinkedIn "Professional development" entry and check the "Open to work" banner. Both sit outside this repo.
5. After merge: submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools.
6. Confirm no paid $2.99 customer is waiting on a result before merging.

Vercel preview URL: added below once it exists.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
