import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true })
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'MutationObserver', 'getComputedStyle', 'Element', 'Event', 'SVGElement', 'HTMLImageElement', 'requestAnimationFrame', 'cancelAnimationFrame', 'KeyboardEvent', 'MouseEvent', 'DocumentFragment', 'CustomEvent', 'NodeFilter', 'FocusEvent', 'HTMLInputElement', 'HTMLButtonElement'])
  Object.defineProperty(globalThis, k, { value: k === 'window' ? dom.window : (dom.window as any)[k], configurable: true, writable: true })
const noop = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
for (const k of ['IntersectionObserver', 'ResizeObserver']) Object.defineProperty(globalThis, k, { value: noop, configurable: true, writable: true })
;(dom.window as any).IntersectionObserver = noop; (dom.window as any).ResizeObserver = noop
;(dom.window as any).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
Object.defineProperty(globalThis, 'matchMedia', { value: (dom.window as any).matchMedia, configurable: true, writable: true })
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function main() {
  const React = await import('react')
  const { render, fireEvent, screen, waitFor } = await import('@testing-library/react')
  const P: any = await import('../src/config/profile')
  // simulate what the admin saved for the first project
  Object.assign(P.projects[0], { description: 'DETAILED-DESC-MARK', results: ['RESULT-MARK 98%'], images: ['/images/projects/sales-forecast-chart.jpg'], isDemo: false, caseStudyUrl: '/case-studies/x', visualCaption: 'CAP-MARK', featured: true })
  const { default: Projects } = await import('../src/components/site/projects')
  let n = 0, bad = 0; const ok = (name: string, c: boolean) => { n++; if (!c) bad++; console.log(`${c ? 'PASS' : 'FAIL'}  ${name}`) }
  const { container } = render(<Projects />)
  ok('card shows the featured badge', /★ Featured/.test(container.textContent || ''))
  const title = P.projects[0].title
  const btn = Array.from(container.querySelectorAll('article')).find((a) => a.textContent!.includes(title))!.querySelector('button')!
  fireEvent.click(btn)
  await waitFor(() => { if (!document.querySelector('[role=dialog]')) throw new Error('no dialog') })
  const dlg = document.querySelector('[role=dialog]')!.textContent || ''
  ok('dialog: detailed description', dlg.includes('DETAILED-DESC-MARK'))
  ok('dialog: results / metrics', dlg.includes('RESULT-MARK 98%') && /Results/.test(dlg))
  ok('dialog: image caption', dlg.includes('CAP-MARK'))
  ok('dialog: additional image gallery', !!document.querySelector('[role=dialog] img[src="/images/projects/sales-forecast-chart.jpg"]'))
  ok('dialog: case study link', !!document.querySelector('[role=dialog] a[href="/case-studies/x"]'))
  ok('dialog: demo warning hidden for a real (non-demo) project', !/Demonstration project on public/.test(dlg))
  console.log(`\n${bad ? '✖' : '✔'} ${n - bad}/${n} project-dialog checks passed`); process.exit(bad ? 1 : 0)
}
main().catch((e) => { console.error(String(e.stack || e).slice(0, 1500)); process.exit(1) })
