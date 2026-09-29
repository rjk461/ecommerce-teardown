/**
 * Stitch partials/header.html and partials/footer.html into src/*.html -> root *.html.
 * Run from repo root: npm run build:site
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { PAGES } from './site.config.mjs'
import { seoBlock } from './lib/outputs.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Replaces __ARIA_<KEY>__ with ` aria-current="page"` when <key> (lowercased, _ to -) is the current nav. */
export function injectNav(headerTpl, nav) {
  return headerTpl.replace(/__ARIA_([A-Z_]+)__/g, (_, key) =>
    key.toLowerCase().replace(/_/g, '-') === nav ? ' aria-current="page"' : ''
  )
}

/** Returns the list of files written, as paths relative to outDir. */
export async function build({ root = ROOT, outDir = root } = {}) {
  const headerTpl = await fs.readFile(path.join(root, 'partials', 'header.html'), 'utf8')
  const footerTpl = await fs.readFile(path.join(root, 'partials', 'footer.html'), 'utf8')
  const written = []

  for (const page of PAGES) {
    let body = await fs.readFile(path.join(root, 'src', page.src), 'utf8')
    if (!body.includes('<!-- HEADER -->') || !body.includes('<!-- FOOTER -->')) {
      throw new Error(`Missing markers in ${page.src}`)
    }
    const header = injectNav(headerTpl, page.nav)
    body = body.replace('<!-- HEADER -->', () => header).replace('<!-- FOOTER -->', () => footerTpl)
    if (!body.includes('<!-- SEO -->')) throw new Error(`Missing SEO marker in ${page.src}`)
    body = body.replace('<!-- SEO -->', () => seoBlock(page, body))
    await fs.writeFile(path.join(outDir, page.out), body, 'utf8')
    written.push(page.out)
  }
  return written
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  build()
    .then((files) => files.forEach((f) => console.log('built', f)))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
