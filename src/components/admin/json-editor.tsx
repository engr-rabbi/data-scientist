'use client'

import { withBase } from '@/lib/base-path'
import { useState } from 'react'
import { ArrowDown, ArrowUp, Copy, ImageIcon, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MediaPickerModal, type PickedImage } from './media-library'

/**
 * Generic, schema-less form editor for JSON content. It derives the form from
 * the shape of the current value, so EVERY website section (services,
 * projects, FAQs, pricing, SEO …) can be edited without a hand-built form.
 */
type J = unknown
type Obj = Record<string, J>
const isObj = (v: J): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const prettyKey = (k: string) =>
  k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase())

/** An "empty" value with the same shape — used for the “Add item” button. */
export function blankLike(v: J): J {
  if (typeof v === 'string') return ''
  if (typeof v === 'number') return 0
  if (typeof v === 'boolean') return false
  if (Array.isArray(v)) return []
  if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankLike(x)]))
  return ''
}

function itemTitle(item: J, index: number): string {
  if (typeof item === 'string' || typeof item === 'number') return String(item).slice(0, 70)
  if (isObj(item)) {
    for (const k of ['title', 'name', 'label', 'q', 'question', 'role', 'slug', 'platform', 'category', 'id']) {
      if (typeof item[k] === 'string' && item[k]) return (item[k] as string).slice(0, 70)
    }
    const first = Object.values(item).find((x) => typeof x === 'string' && x)
    if (typeof first === 'string') return first.slice(0, 70)
  }
  return `Item ${index + 1}`
}

const isPrimitiveList = (a: J[]) => a.every((x) => typeof x === 'string' || typeof x === 'number')

/** Field names that hold a picture URL → rendered with a preview + picker. */
const IMAGE_KEY = /^(image|photo|picture|visual|thumbnail|cover|logo|avatar|ogImage|heroImage|img)$/i

export function ImageField({ label, value, onChange, onPick }: { label?: string; value: string; onChange: (v: string) => void; onPick?: (p: PickedImage) => void }) {
  const [picking, setPicking] = useState(false)
  return (
    <div className="space-y-2">
      {label && <span className="text-xs font-medium text-muted-foreground">{label} <span className="font-normal">(picture)</span></span>}
      <div className="flex items-start gap-3">
        <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
          {value
             
            ? <img src={withBase(value)} alt="" className="h-full w-full object-cover" />
            : <ImageIcon className="size-6 text-muted-foreground" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input value={value} placeholder="https://… or /images/…  (or choose below)" onChange={(e) => onChange(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setPicking(true)}><ImageIcon className="mr-1 size-4" />Choose / upload</Button>
            {value && <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}><Trash2 className="mr-1 size-4" />Remove picture</Button>}
          </div>
        </div>
      </div>
      {picking && <MediaPickerModal onClose={() => setPicking(false)} onPick={(p) => { onChange(p.url); onPick?.(p); setPicking(false) }} />}
    </div>
  )
}

export function JsonField({ label, value, onChange, fieldKey }: { label?: string; value: J; onChange: (v: J) => void; fieldKey?: string }) {
  if (fieldKey && IMAGE_KEY.test(fieldKey) && (typeof value === 'string' || value == null)) {
    return <ImageField label={label} value={(value as string | null | undefined) ?? ''} onChange={onChange} />
  }
  if (typeof value === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="size-4" />
        <span className="font-medium">{label}</span>
      </label>
    )
  }
  if (typeof value === 'number') {
    return (
      <Labeled label={label}>
        <Input type="number" value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Number(e.target.value))} />
      </Labeled>
    )
  }
  if (typeof value === 'string' || value === null || value === undefined) {
    const s = (value as string | null | undefined) ?? ''
    return (
      <Labeled label={label}>
        {s.length > 80 || s.includes('\n') ? (
          <Textarea value={s} rows={Math.min(12, Math.max(3, Math.ceil(s.length / 90)))} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <Input value={s} onChange={(e) => onChange(e.target.value)} />
        )}
      </Labeled>
    )
  }
  if (Array.isArray(value)) return <ArrayField label={label} value={value} onChange={onChange} />
  if (isObj(value)) {
    return (
      <fieldset className="space-y-3 rounded-lg border border-border/60 p-3">
        {label && <legend className="px-1 text-sm font-semibold">{label}</legend>}
        {Object.entries(value).map(([k, v]) => (
          <JsonField key={k} fieldKey={k} label={prettyKey(k)} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} />
        ))}
      </fieldset>
    )
  }
  return null
}

function Labeled({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      {children}
    </label>
  )
}

function ArrayField({ label, value, onChange }: { label?: string; value: J[]; onChange: (v: J) => void }) {
  const set = (i: number, v: J) => onChange(value.map((x, j) => (j === i ? v : x)))
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i))
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  if (isPrimitiveList(value)) {
    const numeric = value.length > 0 && value.every((x) => typeof x === 'number')
    return (
      <div className="space-y-2">
        {label && <div className="text-sm font-semibold">{label} <span className="font-normal text-muted-foreground">({value.length})</span></div>}
        {value.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              type={numeric ? 'number' : 'text'}
              value={String(item)}
              onChange={(e) => set(i, numeric ? Number(e.target.value) : e.target.value)}
            />
            <Button type="button" variant="ghost" size="icon" aria-label="Move up" onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Move down" onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => remove(i)}><Trash2 className="size-4 text-destructive" /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, numeric ? 0 : ''])}><Plus className="mr-1 size-4" />Add</Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-semibold">{label} <span className="font-normal text-muted-foreground">({value.length})</span></div>}
      {value.map((item, i) => (
        <details key={i} className="group rounded-lg border border-border/60 bg-card/40">
          <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium">
            <span className="w-6 text-xs text-muted-foreground">{i + 1}.</span>
            <span className="flex-1 truncate">{itemTitle(item, i)}</span>
            <span className="flex gap-1" onClick={(e) => e.preventDefault()}>
              <Button type="button" variant="ghost" size="icon" aria-label="Move up" onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Move down" onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Duplicate" onClick={() => onChange([...value.slice(0, i + 1), structuredClone(item), ...value.slice(i + 1)])}><Copy className="size-4" /></Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Delete" onClick={() => { if (confirm('Delete this item?')) remove(i) }}><Trash2 className="size-4 text-destructive" /></Button>
            </span>
          </summary>
          <div className="space-y-3 border-t border-border/60 p-3">
            <JsonField value={item} onChange={(v) => set(i, v)} />
          </div>
        </details>
      ))}
      <Button
        type="button" variant="outline" size="sm"
        onClick={() => onChange([...value, value.length ? blankLike(value[value.length - 1]) : {}])}
      ><Plus className="mr-1 size-4" />Add item</Button>
    </div>
  )
}

/** Raw JSON editor with live validation — the escape hatch for any structure. */
export function RawJson({ value, onChange }: { value: J; onChange: (v: J) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2))
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="space-y-2">
      <Textarea
        className="font-mono text-xs"
        rows={22}
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value)
          try { onChange(JSON.parse(e.target.value)); setError(null) } catch (err) { setError((err as Error).message) }
        }}
      />
      {error ? <p className="text-xs text-destructive">Invalid JSON: {error}</p> : <p className="text-xs text-emerald-600">Valid JSON</p>}
    </div>
  )
}
