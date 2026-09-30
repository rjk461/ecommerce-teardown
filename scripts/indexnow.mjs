// Tells Bing (and the other IndexNow engines it shares with) which pages changed.
// Usage: npm run indexnow            -> submits every URL in the local sitemap.xml
//        npm run indexnow -- <url>   -> submits only the URLs you list
// The key is public by design: IndexNow checks it against the file of the same name at the site root.
import fs from 'node:fs'
import { SITE } from './site.config.mjs'

export const KEY = 'd1e006fb7caa19861e014520a14676ee'
export const ENDPOINT = 'https://www.bing.com/indexnow'

export function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1])
}

export function payload(urls) {
  const host = new URL(SITE.url).host
  return { host, key: KEY, keyLocation: `${SITE.url}/${KEY}.txt`, urlList: urls }
}

if (import.meta.url === new URL(process.argv[1], 'file://').href || process.argv[1]?.endsWith('indexnow.mjs')) {
  const given = process.argv.slice(2)
  const urls = given.length ? given : sitemapUrls(fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8'))
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload(urls)),
  })
  console.log(`IndexNow: submitted ${urls.length} URL(s), response ${res.status} ${res.statusText}`)
  process.exit(res.ok ? 0 : 1)
}
