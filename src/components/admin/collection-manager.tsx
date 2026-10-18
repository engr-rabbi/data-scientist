'use client'

import { withBase } from '@/lib/base-path'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Eye, ImageIcon, Loader2, Pencil, Plus, Save, Star, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import * as P from '@/config/profile'
import { finalizeItems, getPath, isOn, setPath, validateItems, type CollectionDef, type FieldDef } from '@/config/collections'
import { sheetsStore, type ContentStore } from '@/lib/content-store'
import { JsonField, ImageField } from './json-editor'
import { MediaPickerModal } from './media-library'

type Obj = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const isPicture = (u: string) => !!u && !u.startsWith('diagram:')

/* ------------------------------ publish badge ------------------------------ */

export function PublishBadge({ onClick }: { onClick?: () => void }) {
  const [state, setState] = useState<'unknown' | 'live' | 'pending'>('unknown')
  useEffect(() => {
    void (async () => {
      try {
        const { fetchContentVersion } = await import('@/lib/api-client')
        const data = await fetchContentVersion()
        const r = await fetch(`${P.profile.siteUrl}/content-version.json?ts=${Date.now()}`)
        const live = r.ok ? (await r.json()).version : null
        setState(live && String(data) === live ? 'live' : 'pending')
      } catch { setState('unknown') }
    })()
  }, [])
  if (state === 'unknown') return null
  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-3 py-1 text-xs font-medium ${state === 'pending' ? 'border-amber-500/60 bg-amber-500/10 text-amber-700' : 'border-emerald-500/50 text-emerald-700'}`}>
      {state === 'pending' ? '● Changes not live yet — Publish' : '✔ Live site is up to date'}
    </button>
  )
}

/* --------------------------------- preview --------------------------------- */

/** Approximate card preview (the final design appears on the website after Publish). */
export function ItemPreview({ def, item }: { def: CollectionDef; item: Obj }) {
  const img = def.imageKey ? str(getPath(item, def.imageKey)) : ''
  const alt = def.imageAltKey ? str(getPath(item, def.imageAltKey)) : ''
  const caption = str(item.imageCaption) || str(item.visualCaption)
  const text = str(getPath(item, def.textKey ?? '')) || str(item.tagline) || str(item.problem) || str(item.summary)
  const chipsRaw = getPath(item, def.chipsKey ?? '') ?? item.items
  const chips = Array.isArray(chipsRaw) ? (chipsRaw as unknown[]).filter((c) => typeof c === 'string').slice(0, 5) as string[] : []
  return (
    <article className="overflow-hidden rounded-2xl border bg-white text-zinc-900 shadow-sm" aria-label="Preview">
      {isPicture(img) ? (
         
        <img src={withBase(img)} alt={alt || str(getPath(item, def.titleKey))} className="aspect-[16/9] w-full object-cover" />
      ) : def.imageKey ? (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-teal-600/80 to-zinc-900 text-white/80">
          {img.startsWith('diagram:') ? 'Built-in illustration' : <ImageIcon className="size-8" aria-hidden />}
        </div>
      ) : null}
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {def.subtitleKey && str(getPath(item, def.subtitleKey)) ? <Badge className="border-transparent bg-teal-50 text-teal-700">{str(getPath(item, def.subtitleKey))}</Badge> : null}
          {item.featured ? <Badge className="border-transparent bg-amber-400 text-amber-950">★ Featured</Badge> : null}
          {!isOn(item) ? <Badge variant="outline">{def.statusLabels[1]} — hidden on the site</Badge> : null}
        </div>
        <h3 className="text-lg font-semibold">{str(getPath(item, def.titleKey)) || <span className="text-zinc-400">Untitled</span>}</h3>
        {text ? <p className="line-clamp-3 text-sm text-zinc-600">{text}</p> : null}
        {chips.length > 0 ? <div className="flex flex-wrap gap-1.5">{chips.map((c) => <span key={c} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">{c}</span>)}</div> : null}
        {item.priceFrom != null && item.priceFrom !== '' ? <p className="text-sm font-medium text-teal-700">Starting from ${String(item.priceFrom)}</p> : null}
        {def.ctaKey && str(item[def.ctaKey]) ? <span className="inline-block rounded-md border border-teal-600 px-3 py-1 text-sm text-teal-700">{str(item[def.ctaKey])}</span> : null}
        {caption ? <p className="text-xs italic text-zinc-500">{caption}</p> : null}
      </div>
    </article>
  )
}

/* ----------------------------- field editors ------------------------------- */

function GalleryField({ label, help, value, onChange }: { label: string; help?: string; value: string[]; onChange: (v: string[]) => void }) {
  const [picking, setPicking] = useState(false)
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= value.length) return; const n = [...value]; [n[i], n[j]] = [n[j], n[i]]; onChange(n) }
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{label} <span className="font-normal text-muted-foreground">({value.length})</span></div>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
        {value.map((u, i) => (
          <div key={`${u}-${i}`} className="space-y-1 rounded-lg border p-1">
            { }
            <img src={withBase(u)} alt="" className="aspect-video w-full rounded object-cover" />
            <div className="flex justify-between">
              <Button type="button" size="icon" variant="ghost" aria-label="Move picture earlier" onClick={() => move(i, -1)}><ArrowUp className="size-3" /></Button>
              <Button type="button" size="icon" variant="ghost" aria-label="Move picture later" onClick={() => move(i, 1)}><ArrowDown className="size-3" /></Button>
              <Button type="button" size="icon" variant="ghost" aria-label="Remove picture" onClick={() => onChange(value.filter((_, k) => k !== i))}><Trash2 className="size-3 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={() => setPicking(true)}><Plus className="mr-1 size-4" />Add picture</Button>
      {picking && <MediaPickerModal onClose={() => setPicking(false)} onPick={(p) => { onChange([...value, p.url]); setPicking(false) }} />}
    </div>
  )
}

function FieldEditor({ field, item, onChange }: { field: FieldDef; item: Obj; onChange: (patch: Obj) => void }) {
  const value = getPath(item, field.key)
  const set = (v: unknown, extra: Obj = {}) => onChange({ [field.key]: v, ...extra })
  const label = <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
  const help = field.help ? <span className="block text-xs text-muted-foreground/80">{field.help}</span> : null
  switch (field.type) {
    case 'text':
      return <label className="block space-y-1">{label}<Input value={str(value)} placeholder={field.placeholder} onChange={(e) => set(e.target.value)} />{help}</label>
    case 'textarea':
      return <label className="block space-y-1">{label}<Textarea rows={field.rows ?? 3} value={str(value)} onChange={(e) => set(e.target.value)} />{help}</label>
    case 'number':
      return <label className="block space-y-1">{label}<Input type="number" value={value == null ? '' : String(value)} onChange={(e) => set(e.target.value === '' ? null : Number(e.target.value))} />{help}</label>
    case 'select': {
      const opts = field.options?.() ?? []
      const all = value && !opts.includes(str(value)) ? [str(value), ...opts] : opts
      return <label className="block space-y-1">{label}<select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={str(value)} onChange={(e) => set(e.target.value)}>{all.map((o) => <option key={o}>{o}</option>)}</select>{help}</label>
    }
    case 'checkbox':
      return <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 size-4" checked={value === true} onChange={(e) => set(e.target.checked)} /><span>{field.label}{help}</span></label>
    case 'strings':
      return <div><JsonField label={field.label} value={Array.isArray(value) ? value : []} onChange={(v) => set(v)} />{help}</div>
    case 'json':
      return <div><JsonField label={field.label} value={value ?? []} onChange={(v) => set(v)} />{help}</div>
    case 'images':
      return <GalleryField label={field.label} help={field.help} value={Array.isArray(value) ? (value as string[]) : []} onChange={(v) => set(v)} />
    case 'image': {
      const alt = field.altKey ? str(getPath(item, field.altKey)) : ''
      const url = str(value)
      return (
        <div className="space-y-2">
          <ImageField label={field.label} value={url} onChange={(v) => set(v)}
            onPick={(p) => onChange({ ...(field.altKey && !alt && p.alt ? { [field.altKey]: p.alt } : {}), ...(field.captionKey && p.caption && !str(getPath(item, field.captionKey)) ? { [field.captionKey]: p.caption } : {}) })} />
          {help}
          {field.altKey && (
            <label className="block space-y-1">
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">Alt text — describes the picture (important for SEO & accessibility)
                {isPicture(url) && !alt && <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="size-3" />missing</span>}</span>
              <Input value={alt} placeholder="e.g. Sales analytics dashboard with monthly revenue chart" onChange={(e) => onChange({ [field.altKey!]: e.target.value })} />
            </label>
          )}
          {field.captionKey && (
            <label className="block space-y-1"><span className="text-xs font-medium text-muted-foreground">Image caption (optional)</span>
              <Input value={str(getPath(item, field.captionKey))} onChange={(e) => onChange({ [field.captionKey!]: e.target.value })} /></label>
          )}
        </div>
      )
    }
  }
}

/* ---------------------------------- manager -------------------------------- */

export function CollectionManager({ def, store = sheetsStore, onNavigate }: { def: CollectionDef; store?: ContentStore; onNavigate?: (tab: string) => void }) {
  const [items, setItems] = useState<Obj[] | null>(null)
  const [baseline, setBaseline] = useState('')
  const [edit, setEdit] = useState<number | null>(null)
  const [preview, setPreview] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'on' | 'off'>('all')
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<{ id: number; value: unknown; saved_at: string }[]>([])

  const load = useCallback(async () => {
    try {
      const stored = await store.load(def.key)
      const base = (Array.isArray(stored) ? stored : structuredClone((P as unknown as Record<string, unknown>)[def.key] ?? [])) as Obj[]
      setItems(base); setBaseline(JSON.stringify(base)); setEdit(null); setMsg(null)
      setHistory(await store.history(def.key).catch(() => []))
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); setItems([]) }
  }, [def.key, store])
  useEffect(() => { setItems(null); void load() }, [load])

  const dirty = items !== null && JSON.stringify(items) !== baseline
  const list = items ?? []
  const patchItem = (i: number, patch: Obj) => setItems((cur) => (cur ?? []).map((it, k) => (k === i ? Object.entries(patch).reduce<Obj>((acc, [p, v]) => setPath(acc, p, v), it) : it)))
  const move = (i: number, d: -1 | 1) => setItems((cur) => { const a = [...(cur ?? [])]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a })
  const moveTo = (i: number, pos: number) => setItems((cur) => { const a = [...(cur ?? [])]; const to = Math.min(Math.max(pos, 1), a.length) - 1; const [it] = a.splice(i, 1); a.splice(to, 0, it); return a })
  const remove = (i: number) => { if (!confirm(`Delete “${str(list[i][def.titleKey]) || 'this ' + def.singular}”? It disappears from the website after you Save and Publish.`)) return; setItems((cur) => (cur ?? []).filter((_, k) => k !== i)); setEdit(null) }
  const add = () => {
    const it = def.blank()
    for (const k of def.idKeys ?? []) it[k] = `new-${Date.now().toString(36)}`
    setItems((cur) => [...(cur ?? []), it]); setEdit(list.length)
  }

  async function save() {
    const problems = validateItems(def, list)
    if (problems.length) return setMsg({ ok: false, text: `Cannot save yet — ${problems.join(' ')}` })
    setSaving(true)
    try {
      const clean = finalizeItems(def, list)
      await store.save(def.key, clean)
      setItems(clean); setBaseline(JSON.stringify(clean))
      const noAlt = def.imageKey && def.imageAltKey ? clean.filter((it) => isPicture(str(getPath(it, def.imageKey!))) && !str(getPath(it, def.imageAltKey!))).length : 0
      setMsg({ ok: true, text: `Saved ✔ — to show it on the live website, press Publish.${noAlt ? ` (${noAlt} picture${noAlt > 1 ? 's' : ''} still without alt text — good for SEO to add.)` : ''}` })
      setHistory(await store.history(def.key).catch(() => []))
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }) }
    setSaving(false)
  }

  const rows = useMemo(() => list.map((item, index) => ({ item, index })).filter(({ item }) =>
    (filter === 'all' || (filter === 'on') === isOn(item)) &&
    (!query || JSON.stringify(item).toLowerCase().includes(query.toLowerCase()))), [list, filter, query])

  if (items === null) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading…</div>

  const header = (
    <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-2 border-b bg-background/95 px-1 py-2 backdrop-blur">
      {edit !== null && <Button type="button" variant="ghost" size="sm" onClick={() => setEdit(null)}><ArrowLeft className="mr-1 size-4" />Back to list</Button>}
      <h2 className="mr-auto text-xl font-semibold">{def.icon} {def.label}{dirty && <span className="ml-2 text-xs font-normal text-amber-600">● unsaved changes</span>}</h2>
      <PublishBadge onClick={() => onNavigate?.('publish')} />
      {history.length > 0 && (
        <select aria-label="Restore an older version" className="h-9 rounded-md border bg-background px-2 text-sm" value="" onChange={(e) => { const h = history.find((x) => String(x.id) === e.target.value); if (h && Array.isArray(h.value)) { setItems(structuredClone(h.value as Obj[])); setMsg({ ok: true, text: 'Older version loaded — press Save to keep it.' }) } }}>
          <option value="">↶ Restore version…</option>{history.map((h) => <option key={h.id} value={h.id}>{new Date(h.saved_at).toLocaleString()}</option>)}
        </select>
      )}
      {dirty && <Button type="button" size="sm" variant="outline" onClick={() => { setItems(JSON.parse(baseline)); setEdit(null); setMsg(null) }}>Discard</Button>}
      <Button type="button" size="sm" onClick={save} disabled={saving || !dirty}>{saving ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Save className="mr-1 size-4" />}Save changes</Button>
    </div>
  )
  const banner = msg && (
    <p className={`rounded-md border p-3 text-sm ${msg.ok ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
      {msg.text} {msg.ok && onNavigate && <button type="button" className="ml-1 underline" onClick={() => onNavigate('publish')}>Go to Publish →</button>}
    </p>
  )

  /* ------------------------------ edit screen ------------------------------ */
  if (edit !== null && list[edit]) {
    const item = list[edit]
    return (
      <section className="space-y-3">
        {header}{banner}
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" className="size-4" checked={isOn(item)} onChange={(e) => patchItem(edit, { published: e.target.checked })} />{def.statusLabels[0]}</label>
              {def.featured && <label className="flex items-center gap-2"><input type="checkbox" className="size-4" checked={item.featured === true} onChange={(e) => patchItem(edit, { featured: e.target.checked })} />★ Featured</label>}
              <label className="ml-auto flex items-center gap-2">Display order
                <Input type="number" min={1} max={list.length} className="h-8 w-20" value={edit + 1} onChange={(e) => { const n = Number(e.target.value); if (n >= 1) { moveTo(edit, n); setEdit(Math.min(Math.max(n, 1), list.length) - 1) } }} /></label>
            </div>
            {def.sections.map((s) => (
              <fieldset key={s.title} className="space-y-3 rounded-xl border p-4">
                <legend className="px-1 text-sm font-semibold">{s.title}</legend>
                {s.fields.map((f) => <FieldEditor key={f.key} field={f} item={item} onChange={(patch) => patchItem(edit, patch)} />)}
              </fieldset>
            ))}
            <div className="flex gap-2">
              <Button type="button" onClick={save} disabled={saving || !dirty}><Save className="mr-1 size-4" />Save changes</Button>
              <Button type="button" variant="outline" onClick={() => setEdit(null)}>Back to list</Button>
              <Button type="button" variant="destructive" className="ml-auto" onClick={() => remove(edit)}><Trash2 className="mr-1 size-4" />Delete</Button>
            </div>
          </div>
          <aside className="lg:sticky lg:top-16 lg:self-start">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview</div>
            <ItemPreview def={def} item={item} />
            <p className="mt-2 text-xs text-muted-foreground">Approximate — the exact design appears on the website after Publish.</p>
          </aside>
        </div>
      </section>
    )
  }

  /* ------------------------------- list screen ------------------------------ */
  return (
    <section className="space-y-3">
      {header}{banner}
      {def.hint && <p className="text-sm text-muted-foreground">{def.hint} Use ↑↓ to change the display order, then <b>Save changes</b> and <b>Publish</b>.</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={add}><Plus className="mr-1 size-4" />Add new {def.singular}</Button>
        <select aria-label="Filter by status" className="h-9 rounded-md border bg-background px-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="all">All ({list.length})</option><option value="on">{def.statusLabels[0]} ({list.filter(isOn).length})</option><option value="off">{def.statusLabels[1]} ({list.filter((i) => !isOn(i)).length})</option>
        </select>
        <Input className="h-9 w-48" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {!rows.length && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing here yet — click “Add new {def.singular}”.</p>}
      <ul className="space-y-2">
        {rows.map(({ item, index }) => {
          const img = def.imageKey ? str(getPath(item, def.imageKey)) : ''
          return (
            <li key={index} data-testid="row" className={`flex flex-wrap items-center gap-3 rounded-xl border p-2.5 ${isOn(item) ? '' : 'bg-muted/40 opacity-80'}`}>
              <span className="w-7 text-center text-xs text-muted-foreground">{index + 1}</span>
              {def.imageKey !== undefined && (isPicture(img)
                 
                ? <img src={withBase(img)} alt="" className="h-12 w-20 shrink-0 rounded-md border object-cover" />
                : <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-md border bg-muted text-lg" aria-hidden>{def.icon}</span>)}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{str(getPath(item, def.titleKey)) || <em className="text-muted-foreground">Untitled</em>}</div>
                {def.subtitleKey && <div className="truncate text-xs text-muted-foreground">{str(getPath(item, def.subtitleKey))}</div>}
              </div>
              {item.featured === true && <Badge className="border-transparent bg-amber-400 text-amber-950">★ Featured</Badge>}
              <Button type="button" size="sm" variant={isOn(item) ? 'secondary' : 'outline'} aria-pressed={isOn(item)} title="Click to switch" onClick={() => patchItem(index, { published: !isOn(item) })}>{isOn(item) ? def.statusLabels[0] : def.statusLabels[1]}</Button>
              {def.featured && <Button type="button" size="icon" variant="ghost" aria-label={item.featured ? 'Remove from featured' : 'Mark as featured'} onClick={() => patchItem(index, { featured: item.featured !== true })}><Star className={`size-4 ${item.featured ? 'fill-amber-400 text-amber-500' : ''}`} /></Button>}
              <Button type="button" size="icon" variant="ghost" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="size-4" /></Button>
              <Button type="button" size="icon" variant="ghost" aria-label="Move down" disabled={index === list.length - 1} onClick={() => move(index, 1)}><ArrowDown className="size-4" /></Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setPreview(index)}><Eye className="mr-1 size-4" />Preview</Button>
              <Button type="button" size="sm" onClick={() => setEdit(index)}><Pencil className="mr-1 size-4" />Edit</Button>
              <Button type="button" size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(index)}><Trash2 className="size-4 text-destructive" /></Button>
            </li>
          )
        })}
      </ul>
      <Button type="button" variant="outline" onClick={add}><Plus className="mr-1 size-4" />Add new {def.singular}</Button>

      {preview !== null && list[preview] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Preview" onClick={() => setPreview(null)}>
          <div className="w-full max-w-md space-y-3 rounded-xl bg-background p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center"><h3 className="mr-auto font-semibold">Preview</h3><Button type="button" size="icon" variant="ghost" aria-label="Close preview" onClick={() => setPreview(null)}><X className="size-4" /></Button></div>
            <ItemPreview def={def} item={list[preview]} />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => { setEdit(preview); setPreview(null) }}><Pencil className="mr-1 size-4" />Edit</Button>
              {def.liveHref && <Button asChild size="sm" variant="outline"><a href={def.liveHref(list[preview])} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 size-4" />View on website</a></Button>}
            </div>
            <p className="text-xs text-muted-foreground">Approximate preview. “View on website” shows what is currently live.</p>
          </div>
        </div>
      )}
    </section>
  )
}
