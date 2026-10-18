import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'MutationObserver', 'getComputedStyle', 'Element', 'Event', 'SVGElement'])
  Object.defineProperty(globalThis, k, { value: k === 'window' ? dom.window : (dom.window as any)[k], configurable: true, writable: true })
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
;(globalThis as any).confirm = () => true

async function main() {
  const React = await import('react')
  const { render, fireEvent, cleanup, screen, within, waitFor } = await import('@testing-library/react')
  const { CollectionManager, ItemPreview } = await import('../src/components/admin/collection-manager')
  const { collections, finalizeItems, validateItems, getPath, setPath, slugify } = await import('../src/config/collections')
  const P: any = await import('../src/config/profile')

  let n = 0, bad = 0
  const ok = (name: string, c: boolean, x = '') => { n++; if (!c) bad++; console.log(`${c ? 'PASS' : 'FAIL'}  ${name} ${x}`) }
  const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const memStore = (seed: Record<string, unknown> = {}) => {
    const data = new Map<string, unknown>(Object.entries(seed)); let saves = 0
    return { data, get saves() { return saves }, load: async (k: string) => (data.has(k) ? clone(data.get(k)) : null), save: async (k: string, v: unknown) => { saves++; data.set(k, clone(v)) }, history: async () => [] as any[] }
  }
  const mount = async (def: any, store: any) => { const r = render(<CollectionManager def={def} store={store} />); await waitFor(() => { if (!r.container.querySelector('ul, p.rounded-xl')) throw new Error('loading') }); return r }
  const rowsOf = (c: HTMLElement) => Array.from(c.querySelectorAll('[data-testid=row]')) as HTMLElement[]
  const click = (el: Element) => fireEvent.click(el)
  const field = (def: any, key: string) => def.sections.flatMap((s: any) => s.fields).find((f: any) => f.key === key)

  console.log('== every content type: list, edit, save (real website data) ==')
  for (const def of collections) {
    const defaults: any[] = P[def.key]; const store = memStore(); let pass = true, why = ''
    try {
      const { container } = await mount(def, store)
      const rows = rowsOf(container)
      if (rows.length !== defaults.length) { pass = false; why = `rows ${rows.length} ≠ ${defaults.length}` }
      if (pass && defaults.length) {
        const first = String(getPath(defaults[0], def.titleKey))
        if (!rows[0].textContent!.includes(first.slice(0, 20))) { pass = false; why = 'title not shown' }
        click(within(rows[0]).getByText('Edit'))
        const tf = field(def, def.titleKey)
        fireEvent.change(screen.getByLabelText(new RegExp('^' + esc(tf.label))), { target: { value: 'EDITED TITLE' } })
        click(screen.getAllByText('Save changes')[0])
        await waitFor(() => { if (!store.saves) throw new Error('not saved') })
        const saved = store.data.get(def.key) as any[]
        const expected = clone(defaults); expected[0] = setPath(expected[0], def.titleKey, 'EDITED TITLE')
        if (JSON.stringify(saved) !== JSON.stringify(expected)) { pass = false; why = 'saved data differs from original apart from the title' }
      }
    } catch (e) { pass = false; why = String((e as Error).message).slice(0, 100) }
    ok(`${def.label} (${defaults.length} items)`, pass, why); cleanup()
  }

  console.log('\n== services: status, featured, order, delete, add ==')
  const sdef = collections.find((c) => c.key === 'services')!
  { const store = memStore(); const { container } = await mount(sdef, store); const N = P.services.length
    click(within(rowsOf(container)[1]).getByText('Active')); ok('click “Active” switches a service to Inactive', within(rowsOf(container)[1]).getByText('Inactive') !== null)
    click(within(rowsOf(container)[2]).getByLabelText('Mark as featured')); ok('star marks a service as featured', !!within(rowsOf(container)[2]).queryByText('★ Featured'))
    click(within(rowsOf(container)[0]).getByLabelText('Move down')); ok('↓ reorders the list', rowsOf(container)[0].textContent!.includes(P.services[1].title.slice(0, 15)))
    click(within(rowsOf(container)[N - 1]).getByLabelText('Delete'))
    ok('delete removes the item', rowsOf(container).length === N - 1)
    click(screen.getAllByText('Save changes')[0]); await waitFor(() => { if (!store.saves) throw new Error('x') })
    const saved = store.data.get('services') as any[]
    ok('saved: order, status and featured persisted', saved.length === N - 1 && saved[0].id === P.services[1].id && saved.find((s: any) => s.id === P.services[2].id).featured === true)
    ok('saved: inactive service has published=false (hidden on the site)', saved.some((s: any) => s.published === false))
    ok('saved: numbers renumbered 01..n', saved.every((s: any, i: number) => s.number === String(i + 1).padStart(2, '0')))
    cleanup() }
  { const store = memStore(); const { container } = await mount(sdef, store); const N = P.services.length
    click(screen.getAllByText(/Add new service/)[0])
    click(screen.getAllByText('Save changes')[0]); await Promise.resolve()
    ok('saving a nameless new service is blocked with a clear message', /required/i.test(container.textContent || '') && store.saves === 0)
    fireEvent.change(screen.getByLabelText(/^Service name/), { target: { value: 'Data Engineering & Pipelines' } })
    fireEvent.change(screen.getByLabelText(/^Short description/), { target: { value: 'Reliable pipelines.' } })
    fireEvent.change(screen.getByLabelText(/^CTA link/), { target: { value: '/start-a-project' } })
    fireEvent.change(screen.getByLabelText(/^Alt text/), { target: { value: 'ignored without image' } })
    click(screen.getAllByText('Save changes')[0]); await waitFor(() => { if (!store.saves) throw new Error('x') })
    const saved = (store.data.get('services') as any[]); const added = saved[saved.length - 1]
    ok('new service is saved with generated id, number and defaults', saved.length === N + 1 && added.id === 'data-engineering-and-pipelines' && added.number === String(N + 1).padStart(2, '0') && added.published === true && added.ctaLink === '/start-a-project')
    cleanup() }

  console.log('\n== picture fields (alt text / caption) ==')
  { const seed = clone(P.services); seed[0].image = 'https://x.supabase.co/storage/v1/object/public/site-media/a.webp'; const store = memStore({ services: seed })
    const { container } = await mount(sdef, store)
    ok('list row shows the thumbnail', !!rowsOf(container)[0].querySelector('img[src$="a.webp"]'))
    click(within(rowsOf(container)[0]).getByText('Edit'))
    ok('warns when a picture has no alt text', /missing/.test(container.textContent || ''))
    fireEvent.change(screen.getByLabelText(/^Alt text/), { target: { value: 'Dashboard with revenue chart' } })
    fireEvent.change(screen.getByLabelText(/^Image caption/), { target: { value: 'Monthly revenue' } })
    ok('live preview uses the alt text and caption', !!container.querySelector('article img[alt="Dashboard with revenue chart"]') && /Monthly revenue/.test(container.querySelector('article')!.textContent || ''))
    click(screen.getByText('Remove picture')); ok('Remove picture clears the image', !container.querySelector('article img'))
    click(screen.getAllByText('Save changes')[0]); await waitFor(() => { if (!store.saves) throw new Error('x') })
    const s0 = (store.data.get('services') as any[])[0]; ok('saved: image cleared, alt/caption kept', s0.image === '' && s0.imageAlt === 'Dashboard with revenue chart' && s0.imageCaption === 'Monthly revenue')
    cleanup() }
  { const pdef = collections.find((c) => c.key === 'projects')!; const seed = clone(P.projects); seed[0].images = ['https://x/1.webp', 'https://x/2.webp']; const store = memStore({ projects: seed })
    const { container } = await mount(pdef, store); click(within(rowsOf(container)[0]).getByText('Edit'))
    ok('project gallery lists additional images', container.querySelectorAll('img[src="https://x/1.webp"], img[src="https://x/2.webp"]').length >= 2)
    click(screen.getAllByLabelText('Remove picture')[0]); click(screen.getAllByText('Save changes')[0]); await waitFor(() => { if (!store.saves) throw new Error('x') })
    ok('removing a gallery image persists', JSON.stringify((store.data.get('projects') as any[])[0].images) === '["https://x/2.webp"]')
    fireEvent.change(screen.getByLabelText(/^Project category/), { target: { value: 'Research' } })
    fireEvent.click(screen.getByLabelText(/Demonstration project/)); click(screen.getAllByText('Save changes')[0]); await waitFor(() => { if ((store as any).saves < 2) throw new Error('x') })
    const p0 = (store.data.get('projects') as any[])[0]; ok('project category + demo flag editable', p0.category === 'Research' && typeof p0.isDemo === 'boolean')
    cleanup() }

  console.log('\n== preview, search, filter, display order ==')
  { const store = memStore(); const { container } = await mount(sdef, store)
    click(within(rowsOf(container)[0]).getByText('Preview')); const dlg = screen.getByRole('dialog')
    ok('Preview dialog shows the card + link to the live page', dlg.textContent!.includes(P.services[0].title.slice(0, 20)) && !!dlg.querySelector('a[href="/services"]'))
    click(screen.getByLabelText('Close preview'))
    fireEvent.change(container.querySelector('input[placeholder="Search…"]')!, { target: { value: 'forecast' } }); ok('search narrows the list', rowsOf(container).length >= 1 && rowsOf(container).length < P.services.length)
    fireEvent.change(container.querySelector('input[placeholder="Search…"]')!, { target: { value: '' } })
    click(within(rowsOf(container)[3]).getByText('Edit')); const orderInput = container.querySelector('input[type=number][max]') as HTMLInputElement
    fireEvent.change(orderInput, { target: { value: '1' } }); click(screen.getAllByText('Back to list')[0])
    ok('“Display order” field moves the item to that position', rowsOf(container)[0].textContent!.includes(P.services[3].title.slice(0, 15)))
    cleanup() }
  { const store = memStore({ testimonials: [{ name: 'Jane', role: 'CTO', company: 'Acme', quote: 'Great work', photo: '', photoAlt: '', sourceUrl: '', published: true }] })
    const tdef = collections.find((c) => c.key === 'testimonials')!; const { container } = await mount(tdef, store)
    ok('testimonials load from the database', rowsOf(container).length === 1 && /Jane/.test(container.textContent || '')); cleanup() }
  { const store = memStore(); store.history = async () => [{ id: 1, value: clone(P.services).slice(0, 2), saved_at: new Date().toISOString() }]
    const { container } = await mount(sdef, store); fireEvent.change(screen.getByLabelText('Restore an older version'), { target: { value: '1' } })
    ok('Restore version loads an older list (unsaved until Save)', rowsOf(container).length === 2 && /unsaved/.test(container.textContent || '')); cleanup() }

  console.log('\n== pure helpers ==')
  ok('finalizeItems: unique slugs for duplicate titles', (() => { const r = finalizeItems(sdef, [{ title: 'Same', id: '' }, { title: 'Same', id: 'new-abc' }, { title: 'Same', id: 'same' }]); return r[2].id === 'same' && r[0].id === 'same-2' && r[1].id === 'same-3' })())
  ok('validateItems flags empty titles', validateItems(sdef, [{ title: ' ' }, { title: 'ok' }]).length === 1)
  ok('slugify', slugify('AI / LLM / RAG Solutions & More') === 'ai-llm-rag-solutions-and-more')
  ok('setPath is immutable + nested', (() => { const a = { detail: { x: 1 } }; const b = setPath(a, 'detail.y', 2) as any; return b.detail.y === 2 && !('y' in a.detail) })())
  ok('ItemPreview renders for every type', collections.every((d) => { const { container } = render(<ItemPreview def={d} item={d.blank()} />); const okk = !!container.querySelector('article'); cleanup(); return okk }))
  console.log(`\n${bad ? '✖' : '✔'} ${n - bad}/${n} collection-manager checks passed`); process.exit(bad ? 1 : 0)
}
main().catch((e) => { console.error(e); process.exit(1) })
