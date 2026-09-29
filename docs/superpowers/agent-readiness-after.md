# Agent Readiness: after (Vercel preview of PR 9)

Tool: https://isitagentready.com/ (Cloudflare). Scanned: 2026-09-30 08:19 AEST (tool reported "Last scanned 9/30/2026 at 8:19:51 AM"). URL scanned: https://ecommerce-teardown-r0n63zglb-made-4-tradies.vercel.app (the preview deployment of branch consulting-pivot, with Deployment Protection switched off by Richard for the scan). Production (https://ecommerceteardown.com) is scanned again after merge and recorded at the bottom of this file.

Overall score: 33 (Level 2, "Bot-Aware"). Before: 0 (Level 0, "Not Ready"), scanned 2026-09-29 14:46 AEST.

Category scores: Discoverability 3/4 (75), Content 0/1, Bot Access Control 2/2 (100), API/Auth/MCP/Skill Discovery 0/8, Commerce optional.

| Check | Result |
| --- | --- |
| robots.txt | Pass: 200, valid format |
| Sitemap | Pass on the preview. The scanner first followed the Sitemap line to the production domain, which returned 404 until merge, then found /sitemap.xml on the preview |
| Link headers | Pass: alternate and describedby relations found |
| DNS for AI Discovery (DNS-AID) | Fail, out of scope |
| Markdown negotiation | Fail: Accept: text/markdown returns text/html. Deliberate: Vercel did not fire the rewrite (tested 2026-09-30), so it was removed. The .md copies and Link headers remain |
| Web Bot Auth | Fail, out of scope |
| AI bot rules in robots.txt | Pass: 8 AI bots found |
| Content Signals in robots.txt | Pass |
| API Catalog, OAuth/OIDC discovery, OAuth Protected Resource, auth.md, MCP Server Card, Agent Skills index, WebMCP, ARD manifest | Fail, all out of scope for a static consulting site |
| Commerce (x402, MPP, UCP, ACP) | Not detected (optional, does not score) |

## Production scan (after merge)

Scanned 2026-09-30 09:22 AEST against https://ecommerceteardown.com after PR #9 merged (squash commit 63d0888) and deployed.

Overall score: 33 (Level 2, "Bot-Aware"), the same as the preview scan. Discoverability 75 (3/4: robots.txt, sitemap and Link headers pass; DNS-AID fails). Content 0 (Markdown negotiation fails on purpose, see the PR). Bot Access Control 100 (2/2). API, Auth, MCP and Skill Discovery 0/8 (not applicable to a static consulting site). Commerce: optional, not scored.

The number in the "worked example" paragraph on /ai-search-readiness (0, then 33) matches, so no page change was needed.
