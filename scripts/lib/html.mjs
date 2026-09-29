const ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  '&rsquo;': '’', '&lsquo;': '‘', '&mdash;': '—', '&ndash;': '–',
  '&times;': '×', '&middot;': '·', '&rarr;': '→', '&nbsp;': ' ',
}

export function decodeEntities(s) {
  return s.replace(/&(?:amp|lt|gt|quot|#39|rsquo|lsquo|mdash|ndash|times|middot|rarr|nbsp);/g, (m) => ENTITIES[m])
}

const clean = (s) => decodeEntities(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())

export function getTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i)
  return m ? clean(m[1]) : ''
}

export function getMetaDescription(html) {
  const m = html.match(/<meta name="description" content="([^"]*)"/i)
  return m ? decodeEntities(m[1]) : ''
}

/** The <main> element if there is one, else everything between </header> and <footer. */
export function mainOrBody(html) {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  if (main) return main[1]
  const body = html.match(/<\/header>([\s\S]*?)<footer/i)
  return body ? body[1] : ''
}

/** Visible FAQ items: <... class="faq-item"><h3>Q</h3><p>A</p>. Returns [{ q, a }]. */
export function extractFaq(html) {
  const items = []
  const re = /<[a-z]+[^>]*class="faq-item"[^>]*>\s*<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi
  let m
  while ((m = re.exec(html)) !== null) items.push({ q: clean(m[1]), a: clean(m[2]) })
  return items
}
