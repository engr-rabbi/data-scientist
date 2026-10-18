import { mergeHomeSections, resolveHomeSections } from '../src/lib/home-sections'
import { HOME_SECTION_IDS } from '../src/config/profile'

let n = 0, bad = 0
const ok = (name: string, c: boolean, x = '') => { n++; if (!c) bad++; console.log(`${c ? 'PASS' : 'FAIL'}  ${name} ${c ? '' : x}`) }
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const ALL = ['a', 'b', 'c', 'd', 'e'] as const
ok('no config → built-in order', eq(resolveHomeSections([], ALL), ['a', 'b', 'c', 'd', 'e']))
ok('full config is respected (reorder + hide)', eq(resolveHomeSections([{ id: 'c', visible: true }, { id: 'a', visible: false }, { id: 'b' }, { id: 'd' }, { id: 'e' }], ALL), ['c', 'b', 'd', 'e']))
// the real-world case: a layout saved BEFORE the section existed
const saved = [{ id: 'a' }, { id: 'b' }, { id: 'd' }, { id: 'e' }]
ok('section missing from a saved layout lands after its predecessor, not at the end', eq(resolveHomeSections(saved, ALL), ['a', 'b', 'c', 'd', 'e']))
ok('…also when the admin reordered the others', eq(resolveHomeSections([{ id: 'e' }, { id: 'b' }, { id: 'a' }, { id: 'd' }], ALL), ['e', 'b', 'c', 'a', 'd']))
ok('a hidden predecessor still holds the position', eq(resolveHomeSections([{ id: 'a' }, { id: 'b', visible: false }, { id: 'd' }, { id: 'e' }], ALL), ['a', 'c', 'd', 'e']))
ok('missing first section goes first', eq(resolveHomeSections([{ id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }], ALL), ['a', 'b', 'c', 'd', 'e']))
ok('unknown ids and duplicates are ignored', eq(resolveHomeSections([{ id: 'zzz' }, { id: 'a' }, { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }], ALL), ['a', 'b', 'c', 'd', 'e']))

// the actual site config
const ids = HOME_SECTION_IDS as readonly string[]
const order = resolveHomeSections([], ids)
ok('Kaggle section sits immediately after Projects & Case Work (built-in order)', order[order.indexOf('projects') + 1] === 'kaggle')
const legacy = ids.filter((i) => i !== 'kaggle').map((id) => ({ id, visible: true }))
const legacyOrder = resolveHomeSections(legacy, ids)
ok('…and for an admin layout saved before the Kaggle section existed', legacyOrder[legacyOrder.indexOf('projects') + 1] === 'kaggle')

// the admin editor shows the merged list
const rows = (xs: string[]) => xs.map((id) => ({ id, label: id.toUpperCase(), visible: true }))
const merged = mergeHomeSections(rows(['a', 'b', 'd', 'e']).map((r) => r.id === 'b' ? { ...r, visible: false } : r), rows([...ALL]))
ok('admin editor: merged list gains the new row in place and keeps saved flags/labels', eq(merged.map((r) => r.id), ['a', 'b', 'c', 'd', 'e']) && merged[1].visible === false && merged[2].label === 'C')

console.log(`\n${bad ? '✖' : '✔'} ${n - bad}/${n} home-section checks passed`); process.exit(bad ? 1 : 0)
