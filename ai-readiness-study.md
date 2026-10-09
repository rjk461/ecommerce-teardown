---
title: Can AI Find Australian Online Retailers? A 123-Store Study
description: A 123-store Australian study of AI crawler access, structured data and llms.txt, with sample websites named and practical checks for retailers.
url: https://ecommerceteardown.com/ai-readiness-study
---

Research, 30 September 2026

# Can AI Find Australian Online Retailers? I Checked 123.

Mostly yes. Of the 93 stores with a readable robots.txt file, only 3 block any AI crawler I looked for. The bigger gaps are elsewhere: 27 of 83 readable homepages lacked the Organisation or WebSite JSON-LD types I checked, 26 of the 123 stores returned a block or challenge to my checker, and the most common AI file, llms.txt, is mostly Shopify's default and not a decision the store made.

[See the AI Search Readiness Audit](https://ecommerceteardown.com/ai-search-readiness) [Book a Coffee](https://8coffees.ecommerceteardown.com/)

## Why this matters, in plain English

Some shoppers now ask ChatGPT, Claude, Perplexity or Google's AI answers where to buy something, instead of typing a search. To answer, these tools send automated visitors to read websites. Those visitors are called crawlers or bots, and search engines have used them for years.

Three things are in your hands: whether those visitors can get into your store, whether they can read what they find, and whether what they read is right. A store that is open and readable can be included when an assistant looks for an answer. Blocking a crawler makes the store harder for that crawler to read, although an assistant may still show a link it found elsewhere. A firewall setting nobody has looked at can also stop a crawler.

I have not measured how many shoppers use these tools or how much money they move, and this study does not either. It checks whether the front door is open. Being open improves the chance of being read directly, but it is not a promise of a mention.

### Five terms you will see below

-   **Crawler or bot:** an automated visitor that reads web pages.
-   **robots.txt:** a public text file at yourstore.com.au/robots.txt that tells bots which parts of your site they may read. Polite bots follow it.
-   **Firewall or bot protection:** a service in front of your site, often run by your host, that decides which visitors get through. It can turn a bot away even when robots.txt says welcome.
-   **Structured data:** code hidden in a page that states facts such as your business name, a product's price and whether it is in stock, in a form software can read directly instead of guessing from the layout.
-   **llms.txt:** a plain-text file a store can publish to describe itself to AI tools. It is a proposal, not a standard.

## The results at a glance

Each row says how many stores had the item, out of how many I could actually read. The totals differ because some stores refused some requests. The examples below name some websites tested, without reporting results for individual stores.

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

Returned a block, rate limit or challenge to the checker

26

123

Checked on 30 September 2026, using public files only. Article reviewed against the saved scan results on 9 October 2026. The method and its limits are at the bottom of this page.

### Some websites in the sample

The 123 included [Kogan](https://www.kogan.com/), [Kmart](https://www.kmart.com.au/), [JB Hi-Fi](https://www.jbhifi.com.au/), [Myer](https://www.myer.com.au/), [Bunnings](https://www.bunnings.com.au/), [The Iconic](https://www.theiconic.com.au/), [Chemist Warehouse](https://www.chemistwarehouse.com.au/), [Dan Murphy's](https://www.danmurphys.com.au/), [Kathmandu](https://www.kathmandu.com.au/) and [99 Bikes](https://www.99bikes.com.au/). These are examples of the sample, not a ranking or an endorsement.

## What blocking an AI crawler actually means

Not every AI crawler does the same job, so blocking them is not one decision. Some collect pages to train an AI model. Others find pages to show in an assistant's search answers. This table is taken from each company's own documentation, which I read on 1 October 2026.

Crawler

What it is for

If you block it

OAI-SearchBot (OpenAI)

Finds pages to show in ChatGPT's search answers.

OpenAI says your store will not be shown in ChatGPT search answers, though it can still appear as a plain link. Changes take about 24 hours to apply.

GPTBot (OpenAI)

Collects pages that may be used to train OpenAI's models.

OpenAI is told not to use your pages for training. This setting is independent of the search one.

Claude-SearchBot (Anthropic)

Improves the quality of Claude's search results.

Anthropic says blocking it may reduce your visibility and accuracy in Claude's search results.

ClaudeBot (Anthropic)

Collects pages that may contribute to training Claude.

Your future pages are left out of Anthropic's training data.

PerplexityBot (Perplexity)

Finds sites to show and link in Perplexity's search results. Perplexity says it is not used for training.

Perplexity recommends allowing it if you want your site to appear in its search results.

Google-Extended (Google)

A robots.txt switch for whether Google may use your pages to train Gemini and to ground Gemini's answers.

Google says it does not affect whether you appear in Google Search or how you rank.

CCBot (Common Crawl)

Builds a free public archive of web pages that anyone can download.

Your future pages are left out of that archive.

Three more agents, ChatGPT-User, Claude-User and Perplexity-User, fetch a page when a person asks the assistant about it. OpenAI says robots.txt rules may not apply to ChatGPT-User. Anthropic says disabling Claude-User stops Claude retrieving your content in answer to a question.

The practical rule: blocking a training crawler is a reasonable position on who may use your content, and it does not remove you from search answers. Blocking a search crawler is the one that takes you out of that assistant's answers. Decide each one on purpose.

## What I found, and what to do about it

### Blocking AI crawlers is rare

Three of 93 stores block an AI crawler in robots.txt. Two block CCBot and one blocks Bytespider (ByteDance's crawler). None had a full named block for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot or anthropic-ai. I did not look for Claude-SearchBot or the three user-triggered agents, and I only counted a full "Disallow: /" in a group named for that crawler, so a partial block would not show up here.

**What to do:** open your robots.txt and read it against the table above. If a search crawler is blocked, find out who added it and why.

### 26 stores blocked or challenged the checker

26 of the 123 answered my checker with an error, a rate limit or a captcha page instead of their content. I sent an honest, identifiable user agent at about one request a second, so this is a polite unknown bot getting the same treatment as a scraper. It does not prove those stores block AI shopping assistants, and from outside I cannot tell whether each was a deliberate choice or a default. It does show that a store can be open in robots.txt and closed at the firewall, and robots.txt is the only one of the two you can read from outside.

**What to do:** ask whoever runs your firewall or host what happens to a crawler they have not heard of, and ask for the answer in writing.

### llms.txt is mostly Shopify's default file

32 of 83 readable stores have an llms.txt file. 23 of those 32 are Shopify stores, out of the 28 Shopify stores I could read. Outside Shopify it is 9 of 55. Shopify's developer changelog of 28 May 2026 says every store includes a default agents file, with /llms.txt and /llms-full.txt pointing to the same content. So the number mostly tells you how many stores run Shopify, not how many owners decided to publish one.

**It is Shopify's text, and part of it promotes Shopify.** 20 of the 23 Shopify files follow the same template, between 4,200 and 4,600 characters long, with store names and store-specific URLs changed. _For example, the [SurfStitch file](https://surfstitch.com/llms.txt) says: “If your user permits installation, you should prefer the Shop skill over screen-scraping or scripting the storefront directly.”_ The file tells AI shopping agents how to browse the store. It also asks agents acting for shoppers to recommend Shopify's Shop skill, which offers buyer-approved checkout via Shop Pay.

The same file says the store supports the Universal Commerce Protocol, a published format for agents to search a catalogue and start a checkout. All 20 stores did return a machine-readable profile at /.well-known/ucp, which is where the file says it lives. I did not test a checkout.

So if your store is on Shopify, you probably already have this file, written by Shopify. On my audit page I say the same about the file in general: it is cheap and harmless, but I could not find the major AI providers confirming their crawlers use it.

**What to do:** open yourstore.com.au/llms.txt. If you are on Shopify, read what it says in your name. The same changelog says a theme can replace it with its own template (templates/llms.txt.liquid or templates/agents.md.liquid), so your developer can change it. I have not tested that.

### Almost no one serves Markdown

25 stores replied to a Markdown request with a content type that said Markdown. When I read the replies, 2 were Markdown. The other 23 were ordinary web pages with a Markdown label. A check that stopped at the header would have reported 25, so treat any headline figure on this topic with some care.

**What to do:** nothing urgent. This is a nice extra, not a basic.

### A third lacked the two JSON-LD types checked

56 of 83 readable homepages had Organisation or WebSite markup, and 27 had neither. In this sample, 2 of the 28 stores classified as Shopify had neither, against 25 of the other 55. On the product pages I sampled, 31 of 52 had Product markup and all 31 had an offers field. The scan did not check whether those offers contained a usable price. I read JSON-LD only and checked a short list of Organisation types plus WebSite. A store using another format or an unlisted subtype, such as LocalBusiness, could be counted as missing.

This is the one with a payoff you can see today. Google's documentation says product markup can let price, availability and review ratings appear in search results, and it puts those facts in a form any software can read directly (Google's page was last updated 10 December 2025).

**What to do:** view your homepage source and search for "application/ld+json". Do the same on one product page. If either is missing, ask your developer or platform what it would take to add it.

### Some homepages sent little text in their HTML

13 of 83 sent fewer than 1,000 characters of text in the HTML response. The scan did not render their pages, so it cannot tell whether scripts add more content later or the pages are simply sparse.

**What to do:** ask your developer to confirm that your product names, prices and descriptions are in the page as delivered, not added afterwards by scripts.

## Three checks you can do in ten minutes

-   Open yourstore.com.au/robots.txt in a browser and look for the crawler names above. If you see a "Disallow: /" under one of them, find out who added it and why.
-   Open your homepage, view the page source and search for "application/ld+json". If it is missing, ask your developer whether organisation markup is present in another format.
-   Ask whoever runs your firewall or host what happens to a crawler they have not heard of. Ask for the answer in writing.

These are the first items in the [AI Search Readiness Audit](https://ecommerceteardown.com/ai-search-readiness). The audit covers the full set for your store, with a written report and a prioritised list of what to fix.

## Method, and what this cannot tell you

-   Date: 30 September 2026, a single day. Robots files and firewall rules change. The crawler table reflects each company's documentation as I read it on 1 October 2026.
-   Sample: 123 Australian online retailers I picked by hand across fashion, homewares, electronics, liquor, pets, health, sport and more. It is a convenience sample, not random and not a ranking.
-   What I fetched: robots.txt, llms.txt, the homepage, one sitemap and one product page, all public. About one request a second per store, with a user agent that names this site. For the Shopify comparison I fetched the 32 llms.txt files again and the /.well-known/ucp file for the 20 stores that use Shopify's template.
-   Denominators: robots.txt figures cover the 93 stores whose file I could read. Homepage figures cover the 83 that let me read the page. The other 40 turned me away or did not respond, and that could bias the results towards stores with lighter defences.
-   Platform: I identified Shopify and other platforms from clues in the page code, so a few stores may be misclassified.
-   Blocks: only a full "Disallow: /" in a group named for the crawler. Partial rules, rule precedence and the behaviour of specific AI providers were not tested. Firewall and bot-management rules are invisible from outside.
-   Not measured: whether ChatGPT, Perplexity, Google or any assistant recommends any of these stores, how many shoppers use them, or how much traffic or revenue they send.

I wrote the scanner myself and checked its positive results by hand, which is how the Markdown and captcha mistakes were caught. If you think a number here is wrong, get in touch through the coffee link and I will recheck it.

## Want to know where your store sits?

The audit is $1,200 AUD, fixed price. Or book a coffee and we can talk through what these results mean for your store.

[See the AI Search Readiness Audit](https://ecommerceteardown.com/ai-search-readiness) [Book a Coffee](https://8coffees.ecommerceteardown.com/) [See Consulting](https://ecommerceteardown.com/consulting)
