/**
 * One-time migration: strip <header> and <footer> from root *.html into src/
 * with <!-- HEADER --> and <!-- FOOTER --> markers for the static site build.
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const FILES = [
  'index.html',
  'cv.html',
  'articles.html',
  'linkedin.html',
  'contact.html',
  'free-teardown.html',
  'sample-teardowns.html',
  'coming-soon.html',
  'consulting.html',
  'ai-teardown.html',
  'ai-teardown-success.html',
]

function stripHeaderFooter(html) {
  const withoutHeader = html.replace(/<header>\s*[\s\S]*?<\/header>\s*/i, '<!-- HEADER -->\n\n')
  return withoutHeader.replace(/<footer>\s*[\s\S]*?<\/footer>\s*/i, '<!-- FOOTER -->\n\n')
}

async function main() {
  await fs.mkdir(path.join(ROOT, 'src'), { recursive: true })
  for (const file of FILES) {
    const p = path.join(ROOT, file)
    const html = await fs.readFile(p, 'utf8')
    const out = stripHeaderFooter(html)
    await fs.writeFile(path.join(ROOT, 'src', file), out, 'utf8')
    console.log('migrated', file)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
