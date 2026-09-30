// Markdown for agents: a request that asks for text/markdown gets the page's .md copy.
// Vercel does not fire a vercel.json rewrite keyed on the Accept header for these static pages
// (tested 2026-09-30), so this runs as Routing Middleware. It only runs on the page paths below
// (tests/middleware.test.mjs keeps the list equal to the indexed pages). Browsers never send
// text/markdown, so they keep getting the HTML.
import { next, rewrite } from '@vercel/functions'

export const config = {
  matcher: ['/', '/consulting', '/ai-strategy', '/ai-search-readiness', '/ai-readiness-study', '/cv', '/linkedin', '/sample-teardowns'],
}

export default function middleware(request) {
  const { pathname } = new URL(request.url)
  const accept = request.headers.get('accept') || ''
  if (/text\/markdown/i.test(accept)) {
    return rewrite(new URL(pathname === '/' ? '/index.md' : `${pathname}.md`, request.url), {
      headers: { Vary: 'Accept' },
    })
  }
  return next({ headers: { Vary: 'Accept' } })
}
