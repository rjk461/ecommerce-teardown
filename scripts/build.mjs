/**
 * Stitch partials/header.html and partials/footer.html into src/*.html → root *.html
 * Run from repo root: node scripts/build.mjs
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

/** nav: 'cv' | 'consulting' | null */
const PAGES = [
  { src: 'index.html', out: 'index.html', nav: null },
  { src: 'cv.html', out: 'cv.html', nav: 'cv' },
  { src: 'articles.html', out: 'articles.html', nav: null },
  { src: 'linkedin.html', out: 'linkedin.html', nav: null },
  { src: 'free-teardown.html', out: 'free-teardown.html', nav: null },
  { src: 'sample-teardowns.html', out: 'sample-teardowns.html', nav: null },
  { src: 'coming-soon.html', out: 'coming-soon.html', nav: null },
  { src: 'consulting.html', out: 'consulting.html', nav: 'consulting' },
  { src: 'ai-teardown.html', out: 'ai-teardown.html', nav: null },
  { src: 'ai-teardown-success.html', out: 'ai-teardown-success.html', nav: null },
]

function injectNav(headerTpl, nav) {
  const cvAria = nav === 'cv' ? ' aria-current="page"' : ''
  const consAria = nav === 'consulting' ? ' aria-current="page"' : ''
  return headerTpl
    .replace(/__CV_ARIA__/g, cvAria)
    .replace(/__CONSULTING_ARIA__/g, consAria)
}

async function main() {
  const headerTpl = await fs.readFile(path.join(ROOT, 'partials', 'header.html'), 'utf8')
  const footerTpl = await fs.readFile(path.join(ROOT, 'partials', 'footer.html'), 'utf8')

  for (const page of PAGES) {
    const srcPath = path.join(ROOT, 'src', page.src)
    let body = await fs.readFile(srcPath, 'utf8')
    if (!body.includes('<!-- HEADER -->') || !body.includes('<!-- FOOTER -->')) {
      throw new Error(`Missing markers in ${page.src}`)
    }
    const header = injectNav(headerTpl, page.nav)
    body = body.replace('<!-- HEADER -->', header).replace('<!-- FOOTER -->', footerTpl)
    await fs.writeFile(path.join(ROOT, page.out), body, 'utf8')
    console.log('built', page.out)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
