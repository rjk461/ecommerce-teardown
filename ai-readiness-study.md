---
title: Can AI Find Australian Online Retailers? A 123-Store Study
description: I checked 123 Australian online retailers on 30 September 2026 for AI crawler blocks, structured data, llms.txt and more. Aggregate results, no retailers named.
url: https://ecommerceteardown.com/ai-readiness-study
---

Research, 30 September 2026

# Can AI Find Australian Online Retailers? I Checked 123.

Mostly yes. Of the 93 stores with a readable robots.txt file, only 3 block any AI crawler I looked for. The bigger gaps are elsewhere: a third of readable homepages have no basic business markup, and 26 of the 123 stores turned my checker away outright.

[See the AI Search Readiness Audit](https://ecommerceteardown.com/ai-search-readiness) [Book a Coffee](https://8coffees.ecommerceteardown.com/)

## The results at a glance

Each row says how many stores had the item, out of how many I could actually read. The totals differ because some stores refused some requests. Nothing here names a retailer.

Check

Stores

Out of

Blocks at least one AI crawler in robots.txt

3

93

Declares a sitemap in robots.txt

89

93

Homepage has Organisation markup

53

83

Homepage has WebSite markup

34

83

Homepage has neither of those

27

83

Sample product page has Product markup

31

52

Homepage sends under 1,000 characters of text with the page

13

83

Has an llms.txt file

32

83

Sends real Markdown when asked for it

2

83

Answered my checker with a block or challenge page

26

123

Checked on 30 September 2026, using public files only. The method and its limits are at the bottom of this page.

## What I found

### Blocking AI crawlers is rare

Three of 93 stores block an AI crawler in robots.txt. Two block CCBot (Common Crawl) and one blocks Bytespider (ByteDance). None block GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot or anthropic-ai. I only counted a full "Disallow: /" in a group named for that crawler, so a partial block would not show up here.

### Firewalls turned away 26 stores

26 of the 123 answered my checker with an error, a rate limit or a captcha page instead of their content. I sent an honest, identifiable user agent at about one request a second, so this is a polite unknown bot getting the same treatment as a scraper. It does not prove those stores block AI shopping assistants. It does show that a store can be open in robots.txt and closed at the firewall, and robots.txt is the only one of the two you can read from outside.

### llms.txt is mostly a platform default

32 of 83 readable stores have an llms.txt file. 23 of those 32 are on Shopify, and 20 of the 23 carry the same text. Shopify's developer changelog of 28 May 2026 describes a default agents file with llms.txt pointing to it. Outside Shopify it is 9 of 55. So the number mostly tells you how many stores run Shopify, not how many owners decided to publish one. On my audit page I say the same about the file itself: it is cheap and harmless, but I could not find the major AI providers confirming their crawlers use it.

### Almost no one serves Markdown

25 stores replied to a Markdown request with a content type that said Markdown. When I read the replies, 2 were Markdown. The other 23 were ordinary web pages with a Markdown label. A check that stopped at the header would have reported 25, so treat any headline figure on this topic with some care.

### A third have no business markup on the homepage

Structured data is the code that tells a machine "this is a business" and "this is a product with this price". 56 of 83 readable homepages had Organisation or WebSite markup, and 27 had neither. On the product pages I sampled, 31 of 52 had Product markup and every one of those included a price. I read JSON-LD only, the format Google recommends, so a store that writes the same facts in another format would be counted as missing.

### Some homepages are close to empty until scripts run

13 of 83 send fewer than 1,000 characters of text with the page. A crawler that does not run scripts sees very little on those stores. Many AI crawlers do not run scripts, so this is worth a look if your homepage is built that way.

## Three checks you can do in ten minutes

-   Open yourstore.com.au/robots.txt in a browser and look for the crawler names above. If you see a "Disallow: /" under one of them, find out who added it and why.
-   Open your homepage, view the page source and search for "application/ld+json". If it is missing, so is your organisation markup.
-   Ask whoever runs your firewall or host what happens to a crawler they have not heard of. Ask for the answer in writing.

These are the first items in the [AI Search Readiness Audit](https://ecommerceteardown.com/ai-search-readiness). The audit covers the full set for your store, with a written report and a prioritised list of what to fix.

## Method, and what this cannot tell you

-   Date: 30 September 2026, a single day. Robots files and firewall rules change.
-   Sample: 123 Australian online retailers I picked by hand across fashion, homewares, electronics, liquor, pets, health, sport and more. It is a convenience sample, not random and not a ranking.
-   What I fetched: robots.txt, llms.txt, the homepage, one sitemap and one product page, all public. About one request a second per store, with a user agent that names this site.
-   Denominators: robots.txt figures cover the 93 stores whose file I could read. Homepage figures cover the 83 that let me read the page. The other 40 turned me away or did not respond, and that could bias the results towards stores with lighter defences.
-   Blocks: only a full "Disallow: /" in a group named for the crawler. Firewall and bot-management rules are invisible from outside.
-   Not measured: whether ChatGPT, Perplexity, Google or any assistant recommends any of these stores. Being readable is a requirement, not a promise of a mention.

I wrote the scanner myself and checked its positive results by hand, which is how the Markdown and captcha mistakes were caught. If you think a number here is wrong, get in touch through the coffee link and I will recheck it.

## Want to know where your store sits?

The audit is $1,200 AUD, fixed price. Or book a coffee and we can talk through what these results mean for your store.

[See the AI Search Readiness Audit](https://ecommerceteardown.com/ai-search-readiness) [Book a Coffee](https://8coffees.ecommerceteardown.com/) [See Consulting](https://ecommerceteardown.com/consulting)
