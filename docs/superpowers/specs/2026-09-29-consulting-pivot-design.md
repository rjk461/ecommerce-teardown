# ecommerceteardown.com: consulting pivot and AI readiness (design)

Date: 2026-09-29. Status: draft for Richard's review. Repo: `rjk461/ecommerce-teardown`, branch `consulting-pivot`.

## Goal

Reposition the site from "hire me for a full-time Head of Ecommerce role" to "ecommerce and AI growth consultant for Australian online retailers". Add the AI strategy content the site lacks. Make the site readable by AI search and agents, and use it as its own proof for that service.

Success looks like:
- A first-time visitor (a retailer owner or ecommerce lead) understands within one screen that Richard consults on ecommerce growth and AI, and can book a call or a free teardown.
- No page reads as a job search.
- The AI-readiness files exist, validate, and the site scores measurably higher on a published benchmark than before.

## Decisions already made (Richard, 2026-09-29)

1. All job-seeking language comes off the site. Availability reads as "available for consulting, or a full or part time engagement". Richard remains open to a great offer, but the site does not advertise a search.
2. The CV page stays, rewritten (page copy and the PDF) to support consulting engagements rather than a job hunt.
3. Coffee chat stays.
4. Beer Cartel dates are 2009 to September 2025. Richard worked for Just Wines after the June 2024 sale. The site currently implies the tenure ended in 2024.
5. Revenue figures: add none. Keep only the existing "7-figure" wording where it already appears. Do not add "$6M" from LinkedIn.

## Facts to use (source: Richard's LinkedIn screenshots, 2026-09-29, plus site and vault)

- Headline on LinkedIn: co-founder of Made 4 Tradies, AI and ecom leader, 3x Top 50 People in Australian Ecommerce.
- Independent Consultant, Digital Marketing and AI Strategy, freelance, from May 2026. Projects cover ecommerce growth strategy, customer acquisition planning and practical AI implementation for marketing and operations.
- Beer Cartel CEO and Director 2009 to Sep 2025. Retail Drinks Australia board member Nov 2019 to Aug 2025.
- AI credentials on the profile: Claude Code in Action (Anthropic, Mar 2026) and a set of LinkedIn and Microsoft AI courses (Sep 2025). Cite these as what they are. Do not present them as more than course completions.
- Built systems that back up the AI claim: aiOS, ApplyHQ, the AI teardown tool on this site, the Made 4 Tradies pipeline. Claim only what Richard can show.
- Client names (Just Wines, Sans Drinks, Liquor Loot) are not used without Richard's permission.
- Screenshot text was small. Every fact above must be re-read against the live profile before it ships.

## Site changes

### Navigation and footer
- Main nav: AI Strategy, Consulting, Experience (the `/cv` page, renamed in the label only), Book a Coffee.
- Footer: Services adds AI Strategy and AI Search Readiness. Career game moves to the footer only. CV link stays, labelled Experience. Footer blurb changes from "Head of Ecommerce and CMO" to the consulting positioning. The follower count is hard-coded ("11,734"), so drop the number or refresh it.
- `partials/header.html` and `partials/footer.html` are the single source. `scripts/build.mjs` gets the new pages added to `PAGES`.

### Homepage (`src/index.html`)
- Title, meta description and Open Graph tags rewritten for consulting.
- Hero lead: remove "Head of Ecommerce" and "looking for the right business to do it again". Keep the storage-shed story and the existing stats strip. Primary button: free teardown or book a call. Secondary: Book a Coffee. The "View CV" button goes.
- The "Open for role" section (`#open-for-role`) is replaced by "How I help": three lines (grow the store, put AI to work, get found by AI search) that link to the pages below.
- The consulting band line "While I'm focused on finding the right full-time role" is rewritten.
- Areas of work gains an AI row alongside Strategy, Marketing and Platform.

### `/ai-strategy` (new)
AI strategy for ecommerce businesses. Sections: where AI pays off in a retailer (email and lifecycle, customer service, product data and merchandising, reporting, content); how to sequence it (audit, pick two or three use cases, pilot, measure, scale); what an engagement looks like (workshop, fixed-price audit, implementation support, monthly retainer); what adoption and ROI mean in practice, drawn from work Richard has actually done; FAQ. Offer prices are set by Richard. The page carries placeholders until he supplies them, and the build fails on any placeholder left in.

### `/ai-search-readiness` (new)
How visible a retailer is to ChatGPT, Perplexity, Google's AI answers and shopping agents. Sections: what to check (crawler access, structured data, product and content clarity, brand mentions), the fixed-price audit, and this site's own before and after as the example.

### Consulting page (`src/consulting.html`)
Add AI to "Areas I work across" and the FAQ. Add an FAQ answer on AI engagements. Add FAQ structured data (see below). Keep the existing offers and prices unless Richard changes them.

### CV page (`src/cv.html` and the PDF)
Rewrite the copy and the PDF around consulting: independent consulting from May 2026, Beer Cartel 2009 to 2025, the AI credentials, board seat, awards. A draft PDF goes to Richard for review before it replaces `Richard-Kelsey-CV.pdf`. I draft it from the LinkedIn profile and the vault; he approves the content.

### Facts fix
Beer Cartel end date corrected to 2025 wherever it appears. The `/contact` link in the footer needs checking, because `src/contact.html` no longer exists while a root `contact.html` does.

### Untouched
The AI teardown tool, its APIs, pricing and payment flow are out of scope. Only the copy that points to it may change.

## AI readiness layer

Reasoning, with sources checked on 2026-09-29:

- **Google:** its own page (last updated 2025-12-10) says no special files, markup or `llms.txt` are needed to appear in AI Overviews or AI Mode. So for Google, ordinary SEO hygiene is the work.
- **`llms.txt`:** the spec at llmstxt.org (version 2, last modified 2026-08-10) is a Markdown file at the site root, and only the H1 is required. Whether OpenAI or Anthropic crawlers read it on the open web is unconfirmed from their own documentation. It is cheap, so ship it, and do not claim it improves rankings.
- **Benchmark:** Cloudflare's Agent Readiness score (published 2026-04-17) checks robots.txt, sitemap, Link headers, Markdown for Agents, Content Signals, AI bot rules in robots.txt, Web Bot Auth, Agent Skills, API Catalog, OAuth discovery, MCP Server Card and WebMCP.

Deliverables, in priority order:

1. `robots.txt` that allows search and citation crawlers explicitly, states AI usage preferences with Content Signals, and points to the sitemap. Richard chooses whether training crawlers are allowed (see open items).
2. `sitemap.xml` covering every public page, generated by the build script so it cannot drift.
3. JSON-LD structured data on each page: `Person` and `ProfessionalService` on the homepage (with `sameAs` for LinkedIn), `Service` on the consulting and AI pages, `FAQPage` where a page has an FAQ. Validated before merge.
4. Canonical URLs and consistent Open Graph tags on every page. One shared facts block (name, role, location, credentials) so the same claims appear identically everywhere.
5. `llms.txt` (and optionally `llms-full.txt`), generated by the build from the same page list.
6. Markdown copy of each page, generated by the build at `<page>.md`, advertised with `rel="alternate" type="text/markdown"`. Serving Markdown when a request sends `Accept: text/markdown` depends on Vercel rewrites supporting a header condition. **Not yet verified against Vercel's current docs.** If it does not work, ship the `.md` files and the `Link` header only.
7. `Link` response headers in `vercel.json` pointing to the sitemap and the Markdown alternates.
8. Before and after: run Cloudflare's Agent Readiness check on the live site now and again after deploy, and record both results in the PR.

Out of scope, on purpose: MCP server, OAuth discovery, WebMCP, agent skills and API catalog. They suit sites with a product or API, not a static consulting site.

## Delivery

- One branch, one pull request, with the Vercel preview URL in the description.
- Vercel deploys `main` to production on merge, and the site carries Richard's name. The standing auto-merge rule does not apply: the PR is held for Richard's approval of the preview.
- Site copy is Richard's voice. It is drafted with the `richards-writing-voice` skill, checked with `/voice-check`, and read through before the PR opens.
- After any change to `partials/` or `src/`, `npm run build:site` is run so the root `*.html` files match. Verification before the PR: build passes, every internal link resolves, no page still contains job-seeking phrases (a grep over the built HTML), structured data validates, `robots.txt`, `sitemap.xml` and `llms.txt` return 200 on the preview, and pages check at phone width.

## Open items for Richard
- Prices for the AI audit and strategy sprint. Existing prices on the consulting page stay unless he says otherwise.
- Whether AI training crawlers (for example GPTBot, Google-Extended) should be allowed or blocked in `robots.txt`.
- Whether Made 4 Tradies gets a one-line mention on the site.
- Whether Career game should stay in the footer or go.
- A consulting-focused CV PDF: approve my draft when it arrives.
