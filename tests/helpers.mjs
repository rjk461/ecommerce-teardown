import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
export const exists = (rel) => fs.existsSync(path.join(ROOT, rel))
export const lf = (s) => s.replace(/\r\n/g, '\n')
export const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
