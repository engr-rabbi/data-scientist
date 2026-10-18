'use client'

import { useCallback, useEffect, useState } from 'react'
import { History, Loader2, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import * as P from '@/config/profile'
import { collections } from '@/config/collections'
import { adminCall } from '@/lib/admin-api'
import { mergeHomeSections } from '@/lib/home-sections'
import registry from '@/config/ui-text-registry.json'
import { JsonField, RawJson } from './json-editor'

/** Every editable website section: key in site_content → its current code default. */
const DEFAULTS: Record<string, unknown> = {
  seo: P.seo, pageSeo: P.pageSeo, homeSections: P.homeSections, homeOnlyLinks: P.homeOnlyLinks, uiText: P.uiText, profile: P.profile, social: P.social, bookingSettings: P.bookingSettings,
  sitePages: P.sitePages, navLinks: P.navLinks, allNavLinks: P.allNavLinks,
  about: P.about, trustBar: P.trustBar, careerJourney: P.careerJourney, processFlow: P.processFlow,
  beforeAfter: P.beforeAfter, transformationFlow: P.transformationFlow,
  services: P.services, solutions: P.solutions, pricingModels: P.pricingModels, priceFactors: P.priceFactors,
  estimateOptions: P.estimateOptions, pricingNote: P.pricingNote, estimateRushNote: P.estimateRushNote, estimateDisclaimer: P.estimateDisclaimer,
  projects: P.projects, projectCategories: [...P.projectCategories], caseStudies: P.caseStudies, insights: P.insights,
  kaggleActivities: P.kaggleActivities, notableRepos: P.notableRepos, platforms: P.platforms,
  skillGroups: P.skillGroups, experience: P.experience, credentials: P.credentials, memberships: P.memberships,
  testimonialsPlaceholder: P.testimonialsPlaceholder,
  faqs: P.faqs, faqCategories: [...P.faqCategories], projectCategoriesForm: P.projectCategoriesForm,
  budgetRanges: P.budgetRanges, contactMethods: P.contactMethods,
}

const GROUPS: { title: string; items: [string, string][] }[] = [
  { title: 'Homepage layout & wording', items: [['homeSections', 'Homepage sections — show / hide / reorder'], ['uiText', 'Section headings & button labels — rename'], ['navLinks', 'Top menu links — add / remove / rename'], ['homeOnlyLinks', '“Pages” menu — extra homepage links']] },
  { title: 'Site, SEO & contact', items: [['seo', 'Global SEO (title, description, keywords)'], ['pageSeo', 'Per-page SEO (title / description / image)'], ['profile', 'Profile & contact details'], ['social', 'Social links'], ['bookingSettings', 'Booking rules (hours, days, holidays)']] },
  { title: 'Pages & navigation', items: [['sitePages', 'Dedicated pages — “Pages” menu entries'], ['allNavLinks', 'Full menu / footer links']] },
  { title: 'Home & About', items: [['about', 'About'], ['trustBar', 'Trust bar'], ['careerJourney', 'Career journey'], ['processFlow', 'Process'], ['beforeAfter', 'Before / after'], ['transformationFlow', 'Transformation flow']] },
  { title: 'Services & pricing', items: [['services', 'Services — cards, text & pictures'], ['solutions', 'Solutions'], ['pricingModels', 'Pricing models'], ['priceFactors', 'Price factors'], ['estimateOptions', 'Estimator options'], ['pricingNote', 'Pricing note'], ['estimateRushNote', 'Rush note'], ['estimateDisclaimer', 'Estimate disclaimer']] },
  { title: 'Portfolio', items: [['projects', 'Projects'], ['projectCategories', 'Project filter categories'], ['caseStudies', 'Case studies'], ['insights', 'Insights / articles'], ['kaggleActivities', 'Kaggle activity'], ['notableRepos', 'GitHub repos'], ['platforms', 'Platforms']] },
  { title: 'Credentials', items: [['skillGroups', 'Skills'], ['experience', 'Experience'], ['credentials', 'Certifications'], ['memberships', 'Memberships'], ['testimonialsPlaceholder', 'Testimonials text']] },
  { title: 'FAQ & forms', items: [['faqs', 'FAQs'], ['faqCategories', 'FAQ categories'], ['projectCategoriesForm', 'Inquiry form: service categories'], ['budgetRanges', 'Budget ranges'], ['contactMethods', 'Contact methods']] },
]

// Content types that have their own "list → add → edit → preview" screen are not repeated here.
const MANAGED = new Set(collections.map((c) => c.key))
const VISIBLE_GROUPS = GROUPS.map((g) => ({ ...g, items: g.items.filter(([k]) => !MANAGED.has(k)) })).filter((g) => g.items.length > 0)

type DbRow = { key: string; value: unknown; updated_at: string }
type Hist = { id: number; value: unknown; saved_at: string }
const sameKind = (a: unknown, b: unknown) => Array.isArray(a) === Array.isArray(b) && typeof a === typeof b

async function loadHistory(key: string): Promise<Hist[]> {
  try { return (await adminCall<{ items: Hist[] }>('contentHistory', { key })).items } catch { return [] }
}

export function ContentPanel({ initialKey = 'seo' }: { initialKey?: string }) {
  const [rows, setRows] = useState<Record<string, DbRow>>({})
  const [selected, setSelected] = useState(initialKey)
  const [draft, setDraft] = useState<unknown>(DEFAULTS[initialKey])
  const [version, setVersion] = useState(0)
  const [mode, setMode] = useState<'form' | 'json'>('form')
  const [history, setHistory] = useState<Hist[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [dirty, setDirty] = useState(false)

  const load = useCallback(async (key: string, source?: Record<string, DbRow>) => {
    const map = source ?? rows
    const base = map[key]?.value ?? DEFAULTS[key]
    // A homepage layout saved before a section existed (e.g. "Kaggle") still lists it, in its built-in place.
    const value = key === 'homeSections' && Array.isArray(base) ? mergeHomeSections(base as SectionRow[], P.defaultHomeSections) : base
    setDraft(structuredClone(value))
    setVersion((v) => v + 1); setDirty(false); setMsg(null)
    setHistory(await loadHistory(key))
  }, [rows])

  useEffect(() => {
    void (async () => {
      let items: DbRow[]
      try { items = (await adminCall<{ items: DbRow[] }>('contentAll')).items } catch (e) { return setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) }) }
      const map = Object.fromEntries(items.map((r) => [r.key, r]))
      setRows(map); await load(initialKey, map)
    })()
     
  }, [])

  function choose(key: string) {
    if (dirty && !confirm('You have unsaved changes in this section. Discard them?')) return
    setSelected(key); void load(key)
  }

  async function save() {
    if (!sameKind(draft, DEFAULTS[selected])) return setMsg({ ok: false, text: 'The structure changed (e.g. a list became text). Fix it in JSON view first.' })
    setBusy(true)
    const value = selected === 'profile' && draft && typeof draft === 'object' ? { ...(draft as object), siteUrl: undefined } : draft
    let saved: DbRow
    try { saved = (await adminCall<{ item: DbRow }>('contentSave', { key: selected, value })).item } catch (e) { setBusy(false); return setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) }) }
    setBusy(false)
    const next = { ...rows, [selected]: saved }
    setRows(next); setDirty(false)
    setMsg({ ok: true, text: 'Saved to your Google Sheet. Open “Publish” to put it on the live site (automatic within ~30 min).' })
    setHistory(await loadHistory(selected))
  }

  async function reset() {
    if (!confirm('Remove your edits for this section and go back to the built-in default?')) return
    try { await adminCall('contentDelete', { key: selected }) } catch (e) { return setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) }) }
    const next = { ...rows }; delete next[selected]; setRows(next)
    setDraft(structuredClone(DEFAULTS[selected])); setVersion((v) => v + 1); setDirty(false)
    setMsg({ ok: true, text: 'Reset. The default content returns after the next publish.' })
  }

  const edit = (v: unknown) => { setDraft(v); setDirty(true) }
  const label = GROUPS.flatMap((g) => g.items).find(([k]) => k === selected)?.[1] ?? selected

  return (
    <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
      <nav className="space-y-4 text-sm lg:max-h-[75vh] lg:overflow-y-auto lg:pr-2">
        {VISIBLE_GROUPS.map((g) => (
          <div key={g.title}>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.title}</div>
            {g.items.map(([k, l]) => (
              <button key={k} onClick={() => choose(k)}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-muted ${selected === k ? 'bg-primary/10 font-medium text-primary' : ''}`}>
                <span>{l}</span>{rows[k] && <span title="Edited" className="size-2 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="min-w-0 space-y-3">
        <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-2 border-b bg-background/95 px-1 py-2 backdrop-blur">
          <h2 className="mr-auto text-lg font-semibold">{label}{dirty && <span className="ml-2 text-xs font-normal text-amber-600">● unsaved</span>}</h2>
          <Button size="sm" variant={mode === 'form' ? 'default' : 'outline'} onClick={() => { setMode('form'); setVersion((v) => v + 1) }}>Form</Button>
          <Button size="sm" variant={mode === 'json' ? 'default' : 'outline'} onClick={() => { setMode('json'); setVersion((v) => v + 1) }}>JSON</Button>
          {history.length > 0 && (
            <select className="h-9 rounded-md border bg-background px-2 text-sm" value="" onChange={(e) => { const h = history.find((x) => String(x.id) === e.target.value); if (h) { setDraft(structuredClone(h.value)); setVersion((v) => v + 1); setDirty(true); setMsg({ ok: true, text: 'Older version loaded — press Save to keep it.' }) } }}>
              <option value="">↶ Restore version…</option>
              {history.map((h) => <option key={h.id} value={h.id}>{new Date(h.saved_at).toLocaleString()}</option>)}
            </select>
          )}
          {rows[selected] && <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="mr-1 size-4" />Reset to default</Button>}
          <Button size="sm" onClick={save} disabled={busy || !dirty}>{busy ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Save className="mr-1 size-4" />}Save</Button>
        </div>
        {msg && <p className={`rounded-md border p-3 text-sm ${msg.ok ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>{msg.text}</p>}
        {rows[selected] && <p className="flex items-center gap-1 text-xs text-muted-foreground"><History className="size-3" />Last saved {new Date(rows[selected].updated_at).toLocaleString()}</p>}

        {selected === 'homeSections' && mode === 'form' ? (
          <HomeSectionsEditor key={`${selected}-${version}`} value={(draft ?? []) as SectionRow[]} onChange={edit} />
        ) : selected === 'uiText' && mode === 'form' ? (
          <UiTextEditor key={`${selected}-${version}`} value={(draft ?? {}) as Record<string, string>} onChange={edit} />
        ) : selected === 'pageSeo' && mode === 'form' ? (
          <PageSeoEditor key={`${selected}-${version}`} value={(draft ?? {}) as PageSeoMap} onChange={edit} />
        ) : mode === 'form' ? (
          <div key={`${selected}-${version}`} className="space-y-3"><JsonField value={draft} onChange={edit} /></div>
        ) : (
          <RawJson key={`${selected}-${version}`} value={draft} onChange={edit} />
        )}
        {selected === 'profile' && <p className="text-xs text-muted-foreground">The website address (siteUrl) is set in the GitHub variable NEXT_PUBLIC_SITE_URL and cannot be changed here.</p>}
      </div>
    </div>
  )
}

/* ---------------------- per-page SEO (title / description) ---------------- */

type PageSeoMap = Record<string, { title?: string; description?: string; image?: string }>

function PageSeoEditor({ value, onChange }: { value: PageSeoMap; onChange: (v: PageSeoMap) => void }) {
  const pages: { path: string; title: string; description: string }[] = [
    { path: '/', title: P.seo.title, description: P.seo.description },
    ...P.sitePages.map((p) => ({ path: p.href, title: p.title, description: p.description })),
    ...P.caseStudies.map((c) => ({ path: `/case-studies/${c.slug}`, title: c.title, description: '' })),
  ]
  const set = (path: string, field: 'title' | 'description' | 'image', v: string) => {
    const cur = { ...(value[path] ?? {}), [field]: v }
    if (!v) delete cur[field]
    const next = { ...value }
    if (Object.keys(cur).length) next[path] = cur; else delete next[path]
    onChange(next)
  }
  const counter = (n: number, ideal: number) => <span className={n > ideal ? 'text-amber-600' : 'text-muted-foreground'}>{n}/{ideal}</span>
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Leave a field empty to keep the built-in text (shown as the placeholder). Search engines show about 60 characters of the title and 155 of the description.</p>
      {pages.map((p) => {
        const o = value[p.path] ?? {}
        return (
          <details key={p.path} className="rounded-lg border border-border/60" open={Boolean(value[p.path])}>
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">{p.path} {value[p.path] && <span className="ml-1 text-xs text-primary">● customised</span>}</summary>
            <div className="space-y-3 border-t border-border/60 p-3">
              <label className="block space-y-1"><span className="flex justify-between text-xs font-medium text-muted-foreground">Title {counter((o.title ?? p.title).length, 60)}</span>
                <Input value={o.title ?? ''} placeholder={p.title} onChange={(e) => set(p.path, 'title', e.target.value)} /></label>
              <label className="block space-y-1"><span className="flex justify-between text-xs font-medium text-muted-foreground">Meta description {counter((o.description ?? p.description).length, 160)}</span>
                <Textarea rows={3} value={o.description ?? ''} placeholder={p.description || 'Built-in description'} onChange={(e) => set(p.path, 'description', e.target.value)} /></label>
              <label className="block space-y-1"><span className="text-xs font-medium text-muted-foreground">Social share image URL (1200×630 recommended — upload in Media)</span>
                <Input value={o.image ?? ''} placeholder="/og-image.png" onChange={(e) => set(p.path, 'image', e.target.value)} /></label>
            </div>
          </details>
        )
      })}
    </div>
  )
}

/* ------------------- homepage sections: show / hide / reorder ------------------- */

type SectionRow = { id: string; label: string; visible: boolean }

export function HomeSectionsEditor({ value, onChange }: { value: SectionRow[]; onChange: (v: SectionRow[]) => void }) {
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const toggle = (i: number) => onChange(value.map((r, k) => (k === i ? { ...r, visible: !r.visible } : r)))
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Tick = shown on the homepage. Use the arrows to change the order. A hidden section disappears from the page — remember to also remove its link under
        “Top menu links” if you do not want a menu item pointing to it. (Dedicated pages like /services stay available.)
      </p>
      {value.map((r, i) => (
        <div key={r.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${r.visible ? '' : 'bg-muted/40 text-muted-foreground'}`}>
          <input type="checkbox" className="size-4" checked={r.visible} onChange={() => toggle(i)} aria-label={`Show ${r.label}`} />
          <span className="w-6 text-xs text-muted-foreground">{i + 1}</span>
          <span className="flex-1 text-sm font-medium">{r.label}{!r.visible && <em className="ml-2 text-xs font-normal">hidden</em>}</span>
          <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)}>↓</Button>
        </div>
      ))}
    </div>
  )
}

/* -------------- headings & button labels: "original text → your text" ------------- */

type RegistryRow = { text: string; group: string; where: string }

export function UiTextEditor({ value, onChange }: { value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const [query, setQuery] = useState('')
  const [custom, setCustom] = useState({ from: '', to: '' })
  const rows = registry as RegistryRow[]
  const known = new Set(rows.map((r) => r.text))
  const set = (text: string, v: string) => {
    const next = { ...value }
    if (v.trim()) next[text] = v; else delete next[text]
    onChange(next)
  }
  const q = query.trim().toLowerCase()
  const visible = rows.filter((r) => !q || r.text.toLowerCase().includes(q) || (value[r.text] ?? '').toLowerCase().includes(q) || r.group.toLowerCase().includes(q))
  const groups = [...new Set(visible.map((r) => r.group))]
  const extra = Object.keys(value).filter((k) => !known.has(k))
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Left: the built-in text. Right: type your own wording — leave empty to keep the original. Applies on every page where that text appears.
        <b> {Object.keys(value).length}</b> customised.
      </p>
      <Input placeholder="Search headings…" value={query} onChange={(e) => setQuery(e.target.value)} />
      {groups.map((g) => (
        <fieldset key={g} className="space-y-2 rounded-lg border border-border/60 p-3">
          <legend className="px-1 text-sm font-semibold">{g}</legend>
          {visible.filter((r) => r.group === g).map((r) => (
            <div key={r.text} className="grid gap-1 md:grid-cols-2 md:gap-3">
              <div className="text-xs text-muted-foreground"><span className="mr-1 rounded bg-muted px-1">{r.where}</span>{r.text}</div>
              {r.text.length > 90
                ? <Textarea rows={3} value={value[r.text] ?? ''} placeholder={r.text} onChange={(e) => set(r.text, e.target.value)} />
                : <Input value={value[r.text] ?? ''} placeholder={r.text} onChange={(e) => set(r.text, e.target.value)} />}
            </div>
          ))}
        </fieldset>
      ))}
      <fieldset className="space-y-2 rounded-lg border border-border/60 p-3">
        <legend className="px-1 text-sm font-semibold">Other replacements</legend>
        {extra.map((k) => (
          <div key={k} className="grid items-center gap-1 md:grid-cols-[1fr_1fr_auto] md:gap-3">
            <div className="text-xs text-muted-foreground">{k}</div>
            <Input value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} />
            <Button type="button" variant="ghost" size="sm" onClick={() => set(k, '')}>Remove</Button>
          </div>
        ))}
        <div className="grid items-center gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Exact original text…" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
          <Input placeholder="Replace with…" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
          <Button type="button" size="sm" variant="outline" disabled={!custom.from.trim() || !custom.to.trim()} onClick={() => { set(custom.from, custom.to); setCustom({ from: '', to: '' }) }}>Add</Button>
        </div>
        <p className="text-xs text-muted-foreground">Works for any section heading text; other text only if it is in the list above.</p>
      </fieldset>
    </div>
  )
}
