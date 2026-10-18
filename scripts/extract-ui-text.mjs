// Builds src/config/ui-text-registry.json — the list of built-in headings / labels the admin can rename.
//   node scripts/extract-ui-text.mjs           → (re)write the registry
//   node scripts/extract-ui-text.mjs --check   → fail if the registry is out of date (used in CI)
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
const files = [...walk('src/components/site'), ...walk('src/app')].filter((f) => f.endsWith('.tsx'))
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, '\u00a0').replace(/&rsquo;/g, '’').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
const PROP = /\b(eyebrow|title|description|moreLabel)=\s*(?:"([^"]*)"|'([^']*)'|\{\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`([^`$]*)`)\s*\})/g
const nice = (f) => basename(f).replace(/\.tsx$/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())

const entries = new Map()
const add = (text, group, where) => { text = text.replace(/\s+/g, ' ').trim(); if (text && !entries.has(text)) entries.set(text, { text, group, where }) }
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  for (const block of src.matchAll(/<SectionHeading\b([\s\S]*?)\/>/g)) {
    for (const m of block[1].matchAll(PROP)) add(decode(m[2] ?? m[3] ?? m[4] ?? m[5] ?? m[6]), `${nice(f)} section`, m[1])
  }
}
// labels that are not SectionHeading props but are routed through tx()
for (const [text, where] of [['Start a Project', 'buttons everywhere'], ['Pages', 'top menu'], ['Dedicated pages', 'top menu'], ['Home', 'top menu'], ['View page', 'section links'], ['About me', 'homepage about card']]) add(text, 'Menu & buttons', where)

const list = [...entries.values()].sort((a, b) => a.group.localeCompare(b.group))
const json = JSON.stringify(list, null, 2) + '\n'
if (process.argv.includes('--check')) {
  const cur = existsSync('src/config/ui-text-registry.json') ? readFileSync('src/config/ui-text-registry.json', 'utf8') : ''
  if (cur !== json) { console.error('✖ src/config/ui-text-registry.json is out of date — run: node scripts/extract-ui-text.mjs'); process.exit(1) }
  console.log(`✔ ui-text registry up to date (${list.length} entries)`)
} else { writeFileSync('src/config/ui-text-registry.json', json); console.log(`✔ wrote ${list.length} entries`) }
