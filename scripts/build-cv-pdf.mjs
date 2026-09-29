/**
 * Renders scripts/cv/consulting-cv.html to a DRAFT PDF for review.
 * Usage: node scripts/build-cv-pdf.mjs
 * Needs a Chrome or Chromium binary: set CHROME_PATH, or it looks in the puppeteer cache.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const cache = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome')
  if (fs.existsSync(cache)) {
    for (const v of fs.readdirSync(cache).sort().reverse()) {
      for (const rel of ['chrome-win64/chrome.exe', 'chrome-linux64/chrome', 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing']) {
        const p = path.join(cache, v, rel)
        if (fs.existsSync(p)) return p
      }
    }
  }
  throw new Error('No Chrome found. Set CHROME_PATH to a Chrome or Chromium executable.')
}

const outDir = path.join(ROOT, 'docs', 'drafts')
fs.mkdirSync(outDir, { recursive: true })
const out = path.join(outDir, 'Richard-Kelsey-CV-consulting-DRAFT.pdf')

const browser = await chromium.launch({ executablePath: findChrome() })
const page = await browser.newPage()
await page.goto(pathToFileURL(path.join(ROOT, 'scripts', 'cv', 'consulting-cv.html')).href)
await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true })
await browser.close()
console.log('wrote', out)
