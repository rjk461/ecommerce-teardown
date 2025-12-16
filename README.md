# Ecommerce Teardown

🔥 **Enter the Ring for Your FREE Website Teardown!**

A lucha libre-themed landing page for professional ecommerce website audits and teardowns.

## About

Richard Kelsey (3x Australian Retailer of the Year, scaled Beer Cartel to $6M) offers brutal, no-holds-barred website teardowns with the intensity of a lucha libre showdown.

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

Simply open `index.html` in a browser. No build process required.

### AI Teardown test mode (no Stripe)

You can generate a teardown report without a payment gateway:

- Open: `/ai-teardown?test=1`
- Submit a URL + email + notes
- The page will call `POST /api/test-teardown` and return:
  - mobile + desktop screenshots (full-page)
  - an OpenAI-generated teardown
  - a downloadable PDF with branded title
  - automatic email delivery with PDF attachment (if email provided)

#### Required environment variables (Vercel)

**AI Provider (choose one):**
- `CLAUDE_API_KEY` (preferred) - Uses Claude 3.5 Sonnet for analysis
- `CLAUDE_MODEL` (optional, default: `claude-3-5-sonnet-20240620`)
- OR
- `OPENAI_API_KEY` (fallback) - Uses OpenAI if Claude is not configured
- `OPENAI_MODEL` (optional, default: `gpt-4o-mini`)

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

© 2025 Richard Kelsey. All rights reserved.

## Contact

- Website: [ecommerceteardown.com](https://ecommerceteardown.com)
- LinkedIn: [Connect with Richard](https://linkedin.com/in/richardkelsey)

---

**Let's build something new** 🎭💪🔥
