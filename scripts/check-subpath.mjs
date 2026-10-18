// Serves ./out the way GitHub Pages serves a *project* site (https://user.github.io/<repo>/…) and checks that
// every internal link / script / stylesheet / image the pages reference actually resolves.
//   node scripts/check-subpath.mjs /Data-Scientist        (default base taken from NEXT_PUBLIC_SITE_URL)
import http from 'node:http'
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const OUT = 'out'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
const BASE = (process.argv[2] ?? (siteUrl ? new URL(siteUrl).pathname : '')).replace(/\/+$/, '')
if (!existsSync(OUT)) { console.error('✖ ./out not found — run `npm run build` first.'); process.exit(1) }
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' }

// GitHub-Pages-like resolution: /base/x → x, x.html, x/index.html ; everything outside /base is another site → 404
function resolve(urlPath) {
  const p = decodeURIComponent(urlPath.split('?')[0].split('#')[0])
  if (BASE && p !== BASE && !p.startsWith(BASE + '/')) return null
  let rel = BASE ? p.slice(BASE.length) : p
  rel = rel.replace(/^\/+/, '')
  for (const c of [rel, `${rel}.html`, join(rel, 'index.html')]) { const f = join(OUT, c); if (existsSync(f) && statSync(f).isFile()) return f }
  return null
}
const server = http.createServer((req, res) => {
  const f = resolve(req.url)
  if (!f) { res.writeHead(404); return res.end('404') }
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f))
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const origin = `http://127.0.0.1:${server.address().port}`

const attr = /\b(?:href|src|poster|data-src)="([^"#][^"]*)"/g
const srcset = /\bsrcSet="([^"]*)"|\bsrcset="([^"]*)"/g
const cssUrl = /url\(\s*['"]?(\/[^'")\s]+)/g
const pages = walk(OUT).filter((f) => f.endsWith('.html') && !f.includes('_next') && !/404|_not-found/.test(f))
const urls = new Map()   // url → first page that references it
const add = (u, from) => { if (u && !u.startsWith('//') && /^\//.test(u) && !urls.has(u)) urls.set(u, from) }
for (const f of pages) {
  const html = readFileSync(f, 'utf8')
  for (const m of html.matchAll(attr)) add(m[1].replace(/&amp;/g, '&'), f)
  for (const m of html.matchAll(srcset)) for (const part of (m[1] || m[2]).split(',')) add(part.trim().split(/\s+/)[0], f)
}
for (const f of walk(join(OUT, '_next')).filter((x) => x.endsWith('.css'))) for (const m of readFileSync(f, 'utf8').matchAll(cssUrl)) add(m[1], f)

const bad = [], unprefixed = []
for (const [u, from] of urls) {
  const prefixed = !BASE || u === BASE || u.startsWith(BASE + '/')
  if (!prefixed) unprefixed.push(`${u}   (in ${from.replace('out/', '')})`)
  const r = await fetch(origin + u)
  if (r.status !== 200) bad.push(`${r.status}  ${u}   (in ${from.replace('out/', '')})`)
}
server.close()
console.log(`Sub-path check "${BASE || '/'}": ${pages.length} pages, ${urls.size} distinct internal URLs`)
console.log(`  not prefixed with the base path: ${unprefixed.length}`); unprefixed.slice(0, 12).forEach((x) => console.log('   ✖', x))
console.log(`  failing to load (404 etc.):      ${bad.length}`); bad.slice(0, 12).forEach((x) => console.log('   ✖', x))
const home = await (async () => { try { return readFileSync(join(OUT, 'index.html'), 'utf8') } catch { return '' } })()
const chunks = [...home.matchAll(/\/_next\/static\/[^"']+\.js/g)].length
console.log(`  homepage references ${chunks} script chunk(s)`)
process.exit(bad.length || unprefixed.length ? 1 : 0)
