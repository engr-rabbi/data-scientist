import { normalizeKind, safeUrl, selectForHome } from '../src/lib/kaggle'
import { kaggleActivities } from '../src/config/profile'

let n = 0, bad = 0
const ok = (name: string, c: boolean, x: unknown = '') => { n++; if (!c) bad++; console.log(`${c ? 'PASS' : 'FAIL'}  ${name} ${c ? '' : JSON.stringify(x)}`) }

ok('legacy "Dataset analysis" displays as Dataset', normalizeKind('Dataset analysis') === 'Dataset')
ok('Competition / Notebook kept', normalizeKind('Competition') === 'Competition' && normalizeKind('Notebook') === 'Notebook')
ok('unknown / missing → Dataset (never crashes)', normalizeKind('???') === 'Dataset' && normalizeKind(undefined) === 'Dataset')

ok('safeUrl accepts https', safeUrl(' https://www.kaggle.com/x ') === 'https://www.kaggle.com/x')
ok('safeUrl rejects empty, javascript:, relative, spaces', safeUrl('') === null && safeUrl(undefined) === null && safeUrl('javascript:alert(1)') === null && safeUrl('/kaggle') === null && safeUrl('https://a b') === null)

type It = { kind: string; featured?: boolean; id: number }
const mk = (kinds: string[], featured: number[] = []): It[] => kinds.map((kind, id) => ({ kind, id, featured: featured.includes(id) }))
const ids = (xs: It[]) => xs.map((x) => x.id)
const sel = (xs: It[], l: number) => selectForHome(xs as never, l) as unknown as It[]

ok('under the cap → everything, same order', JSON.stringify(ids(sel(mk(['Competition', 'Notebook']), 6))) === '[0,1]')
const eight = mk(['Competition', 'Competition', 'Competition', 'Competition', 'Notebook', 'Notebook', 'Notebook', 'Dataset analysis'])
const r = sel(eight, 6)
ok('cap respected', r.length === 6, ids(r))
ok('result stays in display order', JSON.stringify(ids(r)) === JSON.stringify([...ids(r)].sort((a, b) => a - b)), ids(r))
ok('every category is represented when it fits', ['Competition', 'Notebook', 'Dataset'].every((k) => r.some((x) => normalizeKind(x.kind) === k)), ids(r))
ok('featured items win the limited slots', JSON.stringify(ids(sel(mk(['Competition', 'Competition', 'Notebook', 'Notebook', 'Dataset'], [3, 4]), 2))) === '[3,4]')
ok('limit 0 → nothing', sel(eight, 0).length === 0)
ok('does not mutate input', ids(eight).join() === '0,1,2,3,4,5,6,7')

// real data: nothing invented
const bad1 = kaggleActivities.filter((a) => a.kaggleUrl || a.result)
ok('built-in items carry NO unverified Kaggle URL or result', bad1.length === 0, bad1.map((a) => a.title))
ok('built-in items all have a verified GitHub repo URL', kaggleActivities.every((a) => /^https:\/\/github\.com\//.test(a.repoUrl)))

console.log(`\n${bad ? '✖' : '✔'} ${n - bad}/${n} kaggle checks passed`); process.exit(bad ? 1 : 0)
