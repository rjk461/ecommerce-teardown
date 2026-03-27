# Ecommerce Teardown — CLAUDE.md

Static HTML site deployed on Vercel via GitHub (rjk461/ecommerce-teardown).
Live at: https://ecommerceteardown.com
Local repo: /c/Users/rjk_4/AppData/Local/Temp/ecommerce-teardown/

## Deploy workflow
Edit → git commit → git push → Vercel auto-deploys (~60 seconds). No local preview server.

## CSS gotchas
- Media query overrides must come AFTER base rules in the stylesheet (equal specificity = later rule wins)
- Mobile breakpoints: `640px` (hamburger nav), `900px` (general layout)
- Logo base rule: `.logo a { font-size: ... }` — any mobile override must follow this

## Page structure
- Homepage (index.html): `.hero { padding: 1.25rem 0 4.5rem }` — reference for spacing
- Inner pages with hero: consulting.html, free-teardown.html, sample-teardowns.html → `.hero` class
- Inner pages with page-header: articles.html, linkedin.html → `.page-header` class

## Design tokens
--dark: #0D1117 | --dark-2: #161B22 | --green: #00C853 | --muted: #A8B3BD | --border: #30363D
