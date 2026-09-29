# Agent Readiness: before (live site, unchanged)

Tool: https://isitagentready.com/ (Cloudflare). Scanned: 2026-09-29 14:46 AEST (tool reported "Last scanned 9/29/2026 at 2:46:38 PM"). URL: https://ecommerceteardown.com

Overall score: 0 (Level 0, "Not Ready")

Category scores: Discoverability 0/4, Content 0/1, Bot Access Control 0/2, API/Auth/MCP/Skill Discovery 0/8, Commerce (optional).

| Check | Result |
| --- | --- |
| robots.txt | Fail: /robots.txt returns 404 |
| Sitemap | Fail: no sitemap at /sitemap.xml, /sitemap-index.xml, /sitemap_index.xml or .gz |
| Link headers | Fail: no Link header on the homepage |
| DNS for AI Discovery (DNS-AID) | Fail: no records (out of scope for this project) |
| Markdown negotiation | Fail: Accept: text/markdown returns text/html |
| Web Bot Auth | Fail: directory not found (out of scope) |
| AI bot rules in robots.txt | Fail: cannot check without robots.txt |
| Content Signals in robots.txt | Fail: cannot check without robots.txt |
| API Catalog, OAuth/OIDC discovery, OAuth Protected Resource Metadata, auth.md, MCP Server Card, Agent Skills index, WebMCP, ARD capability manifest | Fail, all out of scope for a static consulting site |
| Commerce (x402, MPP, UCP, ACP) | Not detected (optional) |

The checks in scope for this project are robots.txt, sitemap, Link headers, Markdown negotiation, AI bot rules and Content Signals. The tool's AI bot rules check names GPTBot, OAI-SearchBot, Claude-Web and Google-Extended as examples.
