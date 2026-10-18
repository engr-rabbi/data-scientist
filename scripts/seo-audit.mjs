// Static SEO audit of the exported site (./out).  Usage: npm run build && npm run seo:audit
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const OUT = 'out'
if (!existsSync(OUT)) { console.error('✖ ./out not found — run `npm run build` first.'); process.exit(1) }
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
const htmlFiles = walk(OUT).filter((f) => f.endsWith('.html') && !f.includes('_next'))
const errors = [], warns = []
const attr = (html, re) => (html.match(re) || [])[1]
const titles = new Map(), descs = new Map(); const pages = []

const routeOf = (f) => { const r = '/' + relative(OUT, f).replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, ''); return r.length > 1 ? r.replace(/\/$/, '') : '/' }

for (const f of htmlFiles) {
  const route = routeOf(f); if (route === '/404' || route === '/_not-found') continue
  const html = readFileSync(f, 'utf8'); const e = (m) => errors.push(`${route}: ${m}`), w = (m) => warns.push(`${route}: ${m}`)
  const admin = route.startsWith('/admin')
  const robots = attr(html, /<meta name="robots" content="([^"]*)"/)
  if (admin) { if (!/noindex/.test(robots || '')) e('admin page must be noindex'); continue }
  pages.push(route)
  if (/noindex/.test(robots || '')) e('public page is noindex!')
  const title = attr(html, /<title[^>]*>([^<]*)<\/title>/)
  if (!title) e('missing <title>'); else { if (title.length < 20) w(`short title (${title.length})`); if (title.length > 75) w(`long title (${title.length} chars — may be truncated in results)`); titles.set(title, [...(titles.get(title) || []), route]) }
  const desc = attr(html, /<meta name="description" content="([^"]*)"/)
  if (!desc) e('missing meta description'); else { if (desc.length < 70) w(`short description (${desc.length})`); if (desc.length > 200) w(`long description (${desc.length})`); descs.set(desc, [...(descs.get(desc) || []), route]) }
  const canon = attr(html, /<link rel="canonical" href="([^"]*)"/)
  if (!canon) e('missing canonical'); else if (!/^https?:\/\//.test(canon)) e(`canonical not absolute: ${canon}`)
  const h1 = (html.match(/<h1[\s>]/g) || []).length
  if (h1 !== 1) e(`expected exactly 1 <h1>, found ${h1}`)
  if (!/<html[^>]*\slang="[a-z-]+"/i.test(html)) e('missing <html lang>')
  if (!/<meta name="viewport"/.test(html)) e('missing viewport meta')
  for (const p of ['og:title', 'og:description', 'og:image', 'og:url']) if (!new RegExp(`<meta property="${p}"`).test(html)) e(`missing ${p}`)
  if (!/<meta name="twitter:card"/.test(html)) e('missing twitter:card')
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  if (!ld.length) w('no JSON-LD structured data'); for (const m of ld) { try { JSON.parse(m[1]) } catch { e('invalid JSON-LD') } }
  const noAlt = (html.match(/<img\b(?![^>]*\balt=)[^>]*>/g) || []).length; if (noAlt) w(`${noAlt} <img> without alt`)
}
for (const [t, r] of titles) if (r.length > 1) errors.push(`duplicate <title> on ${r.join(', ')}`)
for (const [d, r] of descs) if (r.length > 1) errors.push(`duplicate meta description on ${r.join(', ')}`)

// robots.txt + sitemap.xml
const robots = existsSync(join(OUT, 'robots.txt')) ? readFileSync(join(OUT, 'robots.txt'), 'utf8') : ''
if (!robots) errors.push('robots.txt missing'); else {
  if (!/^Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/im.test(robots)) errors.push('robots.txt has no absolute Sitemap: line')
  if (!/Disallow:\s*\/admin/i.test(robots)) errors.push('robots.txt does not disallow /admin')
  if (/Disallow:\s*\/\s*$/im.test(robots)) errors.push('robots.txt blocks the whole site!')
}
const sm = existsSync(join(OUT, 'sitemap.xml')) ? readFileSync(join(OUT, 'sitemap.xml'), 'utf8') : ''
let locs = []
const BASE = (() => { try { return new URL(process.env.NEXT_PUBLIC_SITE_URL || '').pathname.replace(/\/+$/, '') } catch { return '' } })()
if (!sm) errors.push('sitemap.xml missing'); else {
  if (!/<urlset[^>]*sitemaps\.org/.test(sm)) errors.push('sitemap.xml is not a valid <urlset>')
  locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  if (locs.some((l) => l.includes('#'))) errors.push('sitemap contains #fragment URLs')
  if (locs.some((l) => l.includes('localhost'))) errors.push('sitemap contains localhost — set NEXT_PUBLIC_SITE_URL')
  if (locs.some((l) => l.includes('/admin'))) errors.push('sitemap lists /admin')
  if (new Set(locs).size !== locs.length) errors.push('sitemap has duplicate URLs')
  const paths = new Set(locs.map((l) => (new URL(l).pathname.replace(/\/$/, '').slice(BASE.length)) || '/'))
  for (const p of pages) if (!paths.has(p)) errors.push(`page ${p} is missing from sitemap.xml`)
  for (const p of paths) if (!pages.includes(p)) errors.push(`sitemap lists ${p} but no such page was exported`)
}
console.log(`SEO audit: ${pages.length} pages · sitemap ${locs.length} URLs · robots.txt ${robots ? 'ok' : 'MISSING'}`)
for (const w of warns) console.log(`  ! ${w}`)
for (const e of errors) console.log(`  ✖ ${e}`)
console.log(errors.length ? `\n✖ ${errors.length} error(s), ${warns.length} warning(s)` : `\n✔ no errors (${warns.length} warning(s))`)
process.exit(errors.length ? 1 : 0)
