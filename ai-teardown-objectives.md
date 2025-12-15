## Objective
Create a low-cost “AI Teardown” service page that:
- **Sells an AI conversion-focused teardown** at a low cost (target: **$2.99 per page**).
- **Explains the value clearly** (conversion rate improvements, friction points, prioritized fixes).
- **Collects a URL and email**, then **redirects to payment**.
- After payment: **capture mobile + desktop screenshots**, run the teardown, generate a **PDF**, and **email the report** to the customer.

## What was built in this branch
### 1) New landing page: `/ai-teardown`
File: `ai-teardown.html`
- **CRO-focused layout**: headline, benefits, what-you-get, how-it-works, FAQ.
- **Mobile-first conversion support**: a **sticky CTA** on small screens and clear pricing (“$2.99 / page”).
- **Form**: collects:
  - **Page URL**
  - **Delivery email**
  - Optional **notes** (what they’re trying to optimize)
- **Client-side behavior**:
  - Normalizes URLs (adds `https://` if missing).
  - Submits to `POST /api/create-checkout-session` and redirects to the returned Stripe Checkout URL.
  - Shows a friendly error if checkout can’t be started.

### 2) New success page: `/ai-teardown-success`
File: `ai-teardown-success.html`
- Designed to be the **post-payment landing**.
- Accepts Stripe’s `session_id` via query string:
  - Example: `/ai-teardown-success?session_id=...`
- Attempts to trigger generation via:
  - `GET /api/process-teardown?session_id=...`
- Displays clear status messaging and surfaces `session_id` so support can troubleshoot.

## How to access the pages
This site uses Vercel with `cleanUrls: true` in `vercel.json`, so `.html` files are served without the extension:
- **Landing**: `/ai-teardown`
- **Success**: `/ai-teardown-success`

## What is NOT implemented yet (required to complete the end-to-end flow)
The frontend assumes these backend endpoints exist:
- `POST /api/create-checkout-session`
  - Creates a **Stripe Checkout Session** for $2.99.
  - Stores/passes metadata: `url`, `email`, `notes`.
  - Redirects to Stripe Checkout.
- `GET /api/process-teardown?session_id=...`
  - Validates payment status via Stripe.
  - Captures **mobile + desktop screenshots**.
  - Runs the **AI teardown**.
  - Generates a **PDF**.
  - Emails the PDF to the customer.

## Recommended next steps
- Add Stripe integration (Checkout + webhook or success-triggered processing).
- Add screenshot generation (e.g., Playwright).
- Add PDF generation and email delivery (e.g., Resend/SendGrid).
- Add basic rate limiting + anti-abuse protections.
- Add analytics events (view → form start → checkout start → payment success) to measure conversion improvements.
