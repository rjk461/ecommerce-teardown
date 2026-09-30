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
