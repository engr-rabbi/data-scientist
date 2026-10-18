import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'MutationObserver', 'getComputedStyle', 'Element', 'Event', 'SVGElement'])
  Object.defineProperty(globalThis, k, { value: k === 'window' ? dom.window : (dom.window as any)[k] ?? (k === 'document' ? dom.window.document : undefined), configurable: true, writable: true })
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
async function main() {
const React = await import('react')
const { render, fireEvent, cleanup, screen } = await import('@testing-library/react')
const { JsonField, RawJson, blankLike } = await import('../src/components/admin/json-editor')
const P: any = await import('../src/config/profile')

let n = 0, bad = 0
const ok = (name: string, c: boolean, x = '') => { n++; if (!c) bad++; console.log(`${c ? 'PASS' : 'FAIL'}  ${name} ${x}`) }
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

function Harness({ initial, spy }: { initial: unknown; spy: { v: unknown; calls: number } }) {
  const [v, setV] = React.useState(initial)
  spy.v = v
  return <JsonField value={v} onChange={(nv) => { spy.calls++; setV(nv) }} />
}
const open = (c: HTMLElement) => c.querySelectorAll('details').forEach((d) => d.setAttribute('open', ''))

const sections: Record<string, unknown> = {
  seo: P.seo, pageSeo: P.pageSeo, profile: P.profile, social: P.social, bookingSettings: P.bookingSettings, sitePages: P.sitePages, navLinks: P.navLinks,
  allNavLinks: P.allNavLinks, about: P.about, trustBar: P.trustBar, careerJourney: P.careerJourney, processFlow: P.processFlow, beforeAfter: P.beforeAfter,
  transformationFlow: P.transformationFlow, services: P.services, solutions: P.solutions, pricingModels: P.pricingModels, priceFactors: P.priceFactors,
  estimateOptions: P.estimateOptions, pricingNote: P.pricingNote, estimateRushNote: P.estimateRushNote, estimateDisclaimer: P.estimateDisclaimer,
  projects: P.projects, projectCategories: [...P.projectCategories], caseStudies: P.caseStudies, insights: P.insights, kaggleActivities: P.kaggleActivities,
  notableRepos: P.notableRepos, platforms: P.platforms, skillGroups: P.skillGroups, experience: P.experience, credentials: P.credentials,
  memberships: P.memberships, testimonialsPlaceholder: P.testimonialsPlaceholder, faqs: P.faqs, faqCategories: [...P.faqCategories],
  projectCategoriesForm: P.projectCategoriesForm, budgetRanges: P.budgetRanges, contactMethods: P.contactMethods,
}

// first leaf string that the form renders as a text input/textarea, found by walking the JSON
function firstStringPath(v: unknown, path: (string | number)[] = []): (string | number)[] | null {
  if (typeof v === 'string' && v.length > 0) return path
  if (Array.isArray(v)) for (let i = 0; i < v.length; i++) { const r = firstStringPath(v[i], [...path, i]); if (r) return r }
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { const r = firstStringPath(x, [...path, k]); if (r) return r }
  return null
}
const setAt = (root: any, path: (string | number)[], val: string) => { if (path.length === 0) return val; const r = clone(root); let o = r; path.slice(0, -1).forEach((p) => (o = o[p])); o[path[path.length - 1]] = val; return r }

console.log('== every website section renders and round-trips ==')
for (const [key, def] of Object.entries(sections)) {
  const original = clone(def); const spy = { v: original as unknown, calls: 0 }
  let rendered = false
  try { const { container } = render(<Harness initial={original} spy={spy} />); open(container); rendered = true
    const untouched = JSON.stringify(spy.v) === JSON.stringify(def) && spy.calls === 0
    const p = firstStringPath(def)
    let edited = true
    if (p) {
      const el = Array.from(container.querySelectorAll('input[type=text], input:not([type]), textarea')).find((e: any) => e.value === (p.reduce((o: any, k) => o[k], def) as string)) as HTMLInputElement | undefined
      if (!el) edited = false
      else { fireEvent.change(el, { target: { value: 'EDITED-X' } }); edited = JSON.stringify(spy.v) === JSON.stringify(setAt(def, p, 'EDITED-X')) }
    }
    ok(`${key}`, rendered && untouched && edited, p ? `(edit @ ${p.join('.')})` : '(empty — no text leaf)')
  } catch (e) { ok(`${key}`, false, String((e as Error).message).slice(0, 120)) }
  cleanup()
}

console.log('\n== list operations on real data (services) ==')
{ const spy = { v: clone(P.services) as any, calls: 0 }; const { container } = render(<Harness initial={clone(P.services)} spy={spy} />)
  const len = P.services.length
  fireEvent.click(screen.getByText('Add item')); ok('Add item appends a blank service with the same fields', spy.v.length === len + 1 && JSON.stringify(Object.keys(spy.v[len])) === JSON.stringify(Object.keys(P.services[len - 1])) && spy.v[len].title === '')
  fireEvent.click(container.querySelectorAll('button[aria-label="Duplicate"]')[0]); ok('Duplicate inserts a deep copy after item 1', spy.v.length === len + 2 && spy.v[1].title === spy.v[0].title && spy.v[1] !== spy.v[0])
  fireEvent.click(container.querySelectorAll('button[aria-label="Move down"]')[0]); ok('Move down reorders', spy.v[0].title === P.services[0].title && spy.v.length === len + 2)
  const before = spy.v.length; (globalThis as any).confirm = () => true
  fireEvent.click(container.querySelectorAll('button[aria-label="Delete"]')[0]); ok('Delete removes an item (after confirm)', spy.v.length === before - 1)
  cleanup() }
console.log('\n== primitive lists (SEO keywords) ==')
{ const spy = { v: clone(P.seo) as any, calls: 0 }; const { container } = render(<Harness initial={clone(P.seo)} spy={spy} />); const k = P.seo.keywords.length
  fireEvent.click(screen.getByText('Add')); ok('Add keyword', spy.v.keywords.length === k + 1)
  fireEvent.click(container.querySelectorAll('button[aria-label="Remove"]')[0]); ok('Remove keyword', spy.v.keywords.length === k && spy.v.keywords[0] === P.seo.keywords[1])
  cleanup() }
console.log('\n== booleans / numbers / raw JSON ==')
{ const spy = { v: { on: true, n: 5, s: 'x' } as any, calls: 0 }; const { container } = render(<Harness initial={spy.v} spy={spy} />)
  fireEvent.click(container.querySelector('input[type=checkbox]')!); ok('checkbox toggles boolean', spy.v.on === false)
  fireEvent.change(container.querySelector('input[type=number]')!, { target: { value: '42' } }); ok('number input keeps type number', spy.v.n === 42)
  cleanup() }
{ let last: unknown = null; const { container } = render(<RawJson value={{ a: 1 }} onChange={(v) => (last = v)} />); const ta = container.querySelector('textarea')!
  fireEvent.change(ta, { target: { value: '{"a": ' } }); ok('raw JSON: invalid text flagged, value not emitted', /Invalid JSON/.test(container.textContent || '') && last === null)
  fireEvent.change(ta, { target: { value: '{"a": 2}' } }); ok('raw JSON: valid text emitted', JSON.stringify(last) === '{"a":2}'); cleanup() }

console.log('\n== picture field (services) ==')
{ const spy = { v: clone(P.services) as any, calls: 0 }; const { container } = render(<Harness initial={clone(P.services)} spy={spy} />); open(container)
  const pickers = screen.getAllByText('Choose / upload')
  ok('every service shows a picture field (preview + picker)', pickers.length === P.services.length, `(${pickers.length})`)
  const urlInputs = Array.from(container.querySelectorAll('input[placeholder^="https://"]')) as HTMLInputElement[]
  fireEvent.change(urlInputs[0], { target: { value: 'https://x.supabase.co/storage/v1/object/public/site-media/a.jpg' } })
  ok('typing / pasting a URL sets service.image', spy.v[0].image === 'https://x.supabase.co/storage/v1/object/public/site-media/a.jpg')
  ok('preview <img> appears once a picture is set', container.querySelectorAll('img[src*="a.jpg"]').length === 1)
  fireEvent.click(screen.getByText('Remove picture')); ok('Remove picture clears it', spy.v[0].image === '')
  fireEvent.click(screen.getByText('Add item')); ok('a NEW service also gets an empty picture field', spy.v[spy.v.length - 1].image === '')
  cleanup() }

console.log('\n== homepage sections editor ==')
{ const { HomeSectionsEditor, UiTextEditor } = await import('../src/components/admin/content-panel')
  const { resolveHomeSections } = await import('../src/lib/home-sections')
  const { tx } = await import('../src/lib/ui-text')
  function Wrap({ initial, spy, Comp }: any) { const [v, setV] = React.useState(initial); spy.v = v; return <Comp value={v} onChange={(nv: unknown) => { spy.calls++; setV(nv) }} /> }
  const spy = { v: clone(P.homeSections) as any, calls: 0 }; const { container } = render(<Wrap initial={clone(P.homeSections)} spy={spy} Comp={HomeSectionsEditor} />)
  const boxes = container.querySelectorAll('input[type=checkbox]'); const pi = P.homeSections.findIndex((r: any) => r.id === 'pricing'); fireEvent.click(boxes[pi]); ok('untick hides a section', pi >= 0 && spy.v[pi].id === 'pricing' && spy.v[pi].visible === false)
  ok('Kaggle row is listed right after Projects & Case Work in the editor', P.homeSections[P.homeSections.findIndex((r: any) => r.id === 'projects') + 1]?.id === 'kaggle')
  fireEvent.click(container.querySelectorAll('button[aria-label="Move down"]')[2]); ok('move down reorders (services ↔ solutions)', spy.v[2].id === 'solutions' && spy.v[3].id === 'services')
  ok('first row cannot move up', (container.querySelectorAll('button[aria-label="Move up"]')[0] as HTMLButtonElement).disabled)
  cleanup()
  ok('resolveHomeSections: hidden dropped, order kept', JSON.stringify(resolveHomeSections([{ id: 'b', visible: true }, { id: 'a', visible: false }, { id: 'c' }], ['a', 'b', 'c'])) === '["b","c"]')
  ok('resolveHomeSections: unknown ids ignored, missing ids slotted into their built-in place, dupes ignored', JSON.stringify(resolveHomeSections([{ id: 'zzz' }, { id: 'c' }, { id: 'c' }], ['a', 'b', 'c'])) === '["a","b","c"]')
  ok('resolveHomeSections: empty config → default order', JSON.stringify(resolveHomeSections([], ['a', 'b'])) === '["a","b"]')

  console.log('\n== headings & labels editor ==')
  const sp2 = { v: {} as Record<string, string>, calls: 0 }; const r2 = render(<Wrap initial={{}} spy={sp2} Comp={UiTextEditor} />)
  const inputs = () => Array.from(r2.container.querySelectorAll('input, textarea')) as HTMLInputElement[]
  const row = (text: string) => inputs().find((i) => i.placeholder === text)!
  ok('every built-in heading is listed (incl. all you named)', ['What I Can Do For You', 'Projects & Case Work', 'Deep Dives', 'A Background Wider Than Freelancing', 'A Focused, Verified Toolkit', 'Verified Credentials', 'Professional Profiles', 'Pricing', 'Notes From the Field', 'About me', 'Start a Project', 'Book a Free 30-Minute Intro Call', 'Pages'].every((t) => !!row(t)))
  fireEvent.change(row('Deep Dives'), { target: { value: 'Case Studies' } }); ok('rename stores {original: replacement}', sp2.v['Deep Dives'] === 'Case Studies')
  fireEvent.change(row('Deep Dives'), { target: { value: '   ' } }); ok('clearing restores the original (key removed)', !('Deep Dives' in sp2.v))
  fireEvent.change(r2.container.querySelector('input[placeholder="Search headings…"]')!, { target: { value: 'toolkit' } })
  ok('search filters the list', inputs().filter((i) => i.placeholder && i.placeholder !== 'Search headings…' && !i.placeholder.startsWith('Exact') && !i.placeholder.startsWith('Replace')).length <= 3 && !!row('A Focused, Verified Toolkit'))
  fireEvent.change(r2.container.querySelector('input[placeholder="Exact original text…"]')!, { target: { value: 'Some Old Heading' } })
  fireEvent.change(r2.container.querySelector('input[placeholder="Replace with…"]')!, { target: { value: 'New Heading' } })
  fireEvent.click(screen.getByText('Add')); ok('custom replacement can be added', sp2.v['Some Old Heading'] === 'New Heading')
  fireEvent.click(screen.getByText('Remove')); ok('custom replacement can be removed', !('Some Old Heading' in sp2.v))
  cleanup()
  ok('tx(): replaced / untouched / empty-ignored', (() => { const u: any = P.uiText; u['A'] = 'B'; u['C'] = '  '; const r = tx('A') === 'B' && tx('Z') === 'Z' && tx('C') === 'C' && tx(undefined) === undefined; delete u['A']; delete u['C']; return r })()) }

ok('blankLike keeps shape', JSON.stringify(blankLike({ a: 'x', b: [1], c: { d: true, e: 3 } })) === '{"a":"","b":[],"c":{"d":false,"e":0}}')
console.log(`\n${bad ? "✖" : "✔"} ${n - bad}/${n} editor checks passed`); process.exit(bad ? 1 : 0)

}
main().catch((e) => { console.error(e); process.exit(1) })
