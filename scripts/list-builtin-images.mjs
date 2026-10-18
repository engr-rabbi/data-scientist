// Lists the pictures that ship with the site (public/images/**) so the admin picker can offer them.
import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
const root = 'public/images'
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
const list = existsSync(root)
  ? walk(root).filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f)).sort().map((f) => ({ url: '/' + relative('public', f).replace(/\\/g, '/'), name: relative(root, f).replace(/\\/g, '/') }))
  : []
writeFileSync('src/config/builtin-images.json', JSON.stringify(list, null, 2) + '\n')
console.log(`✔ ${list.length} built-in image(s) listed`)
