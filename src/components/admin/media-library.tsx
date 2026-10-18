'use client'

import { withBase } from '@/lib/base-path'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, ImageOff, Loader2, RefreshCw, Replace, Trash2, Upload, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import builtin from '@/config/builtin-images.json'
import { assetUrl, deleteAsset, formatBytes, findUsage, listAssets, replaceImage, updateAssetMeta, uploadImage, type MediaAsset } from '@/lib/media'

/** What a picker hands back when the admin chooses a picture. */
export interface PickedImage { url: string; alt: string; caption: string }

function useAssets() {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(async () => {
    setLoading(true)
    try { setAssets(await listAssets()); setError(null) } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    setLoading(false)
  }, [])
  useEffect(() => { void reload() }, [reload])
  return { assets, setAssets, loading, error, reload }
}

/** Uploads several files, reporting duplicates instead of storing them twice. */
async function uploadMany(files: File[], say: (m: string) => void): Promise<MediaAsset[]> {
  const out: MediaAsset[] = []
  const notes: string[] = []
  for (const f of files) {
    try {
      const { asset, duplicate } = await uploadImage(f)
      out.push(asset)
      notes.push(duplicate ? `“${f.name}” is already in the library — reused it (nothing stored twice).` : `“${f.name}” uploaded.`)
    } catch (e) { notes.push((e as Error).message) }
  }
  say(notes.join('  '))
  return out
}

/* ------------------------------- media panel ------------------------------ */

export function MediaPanel() {
  const { assets, loading, error, reload } = useAssets()
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<MediaAsset | null>(null)
  const [query, setQuery] = useState('')
  const [drag, setDrag] = useState(false)

  const shown = assets.filter((a) => !query || `${a.file_name} ${a.alt ?? ''} ${a.caption ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  const total = assets.reduce((n, a) => n + a.size_bytes, 0)

  async function handle(files: File[]) {
    if (!files.length) return
    setBusy(true); setMsg(null)
    await uploadMany(files, setMsg)
    setBusy(false); await reload()
  }

  return (
    <section className="space-y-4" onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); void handle([...e.dataTransfer.files]) }}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Media library</h2>
          <p className="text-sm text-muted-foreground">{assets.length} pictures · {formatBytes(total)} used · the same picture is never stored twice; large pictures are resized automatically.</p>
        </div>
        <div className="flex items-center gap-2">
          {(loading || busy) && <Loader2 className="size-4 animate-spin" />}
          <Input className="h-9 w-44" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button variant="outline" size="sm" onClick={reload}><RefreshCw className="size-4" /></Button>
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            <Upload className="size-4" />Upload pictures
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void handle([...(e.target.files ?? [])]); e.target.value = '' }} />
          </label>
        </div>
      </header>
      {(error || msg) && <p className={`rounded-md border p-3 text-sm ${error ? 'border-destructive/40 text-destructive' : 'bg-muted/40'}`}>{error ?? msg}</p>}
      <div className={`rounded-xl border-2 border-dashed p-3 transition ${drag ? 'border-primary bg-primary/5' : 'border-transparent'}`}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {shown.map((a) => (
            <button key={a.id} onClick={() => setOpen(a)} className="space-y-1.5 rounded-xl border p-2 text-left hover:border-primary">
              { }
              <img src={assetUrl(a)} alt={a.alt || a.file_name} className="aspect-video w-full rounded-lg object-cover" loading="lazy" />
              <div className="truncate text-xs">{a.file_name}</div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                {formatBytes(a.size_bytes)}{a.width ? ` · ${a.width}×${a.height}` : ''}
                {!a.alt && <Badge variant="outline" className="ml-auto border-amber-500/60 text-amber-700">no alt text</Badge>}
              </div>
            </button>
          ))}
        </div>
        {!shown.length && !loading && <p className="p-6 text-center text-sm text-muted-foreground">No pictures yet — click “Upload pictures” or drop files here.</p>}
      </div>
      {open && <AssetDetail asset={open} onClose={() => setOpen(null)} onChanged={async () => { await reload() }} />}
    </section>
  )
}

function AssetDetail({ asset, onClose, onChanged }: { asset: MediaAsset; onClose: () => void; onChanged: () => Promise<void> }) {
  const [alt, setAlt] = useState(asset.alt ?? '')
  const [caption, setCaption] = useState(asset.caption ?? '')
  const [usage, setUsage] = useState<{ key: string; count: number }[] | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  const replaceRef = useRef<HTMLInputElement>(null)
  useEffect(() => { findUsage(asset).then(setUsage).catch((e) => setMsg((e as Error).message)) }, [asset])

  const run = async (fn: () => Promise<void>, ok?: string) => {
    setBusy(true); setMsg(null)
    try { await fn(); if (ok) setMsg(ok); await onChanged() } catch (e) { setMsg((e as Error).message) }
    setBusy(false)
  }
  async function del() {
    const where = usage?.length ? `\n\nIt is used in: ${usage.map((u) => `${u.key} (${u.count})`).join(', ')}.\nThose places will show a broken picture until you choose another one.` : ''
    if (!confirm(`Delete “${asset.file_name}” permanently?${where}`)) return
    await run(async () => { await deleteAsset(asset); onClose() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Picture details" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-background p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center"><h3 className="mr-auto text-lg font-semibold">{asset.file_name}</h3><Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}><X className="size-4" /></Button></div>
        <div className="grid gap-4 md:grid-cols-2">
          { }
          <img src={`${assetUrl(asset)}?v=${version}`} alt={alt || asset.file_name} className="w-full rounded-lg border object-contain" />
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">{formatBytes(asset.size_bytes)} · {asset.mime_type}{asset.width ? ` · ${asset.width}×${asset.height}px` : ''}</p>
            <label className="block space-y-1"><span className="text-xs font-medium text-muted-foreground">Alt text — describes the picture for search engines & screen readers</span>
              <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Sales analytics dashboard showing monthly revenue" /></label>
            <label className="block space-y-1"><span className="text-xs font-medium text-muted-foreground">Caption (optional)</span>
              <Input value={caption} onChange={(e) => setCaption(e.target.value)} /></label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={busy || (alt === (asset.alt ?? '') && caption === (asset.caption ?? ''))} onClick={() => run(() => updateAssetMeta(asset.id, alt, caption), 'Saved. Pictures already placed on pages keep their own alt text — edit it there, or choose the picture again.')}><Check className="mr-1 size-4" />Save details</Button>
              <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(assetUrl(asset)); setMsg('URL copied') }}><Copy className="mr-1 size-4" />Copy URL</Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => replaceRef.current?.click()}><Replace className="mr-1 size-4" />Replace file</Button>
              <input ref={replaceRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void run(async () => { await replaceImage(asset, f); setVersion((v) => v + 1); onClose() }) }} />
              <Button size="sm" variant="destructive" disabled={busy} onClick={del}><Trash2 className="mr-1 size-4" />Delete</Button>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Used in</div>
              {usage === null ? <Loader2 className="size-4 animate-spin" /> : usage.length ? <ul className="list-disc pl-5">{usage.map((u) => <li key={u.key}>{u.key} <span className="text-muted-foreground">({u.count}×)</span></li>)}</ul> : <p className="text-muted-foreground">Not used anywhere yet.</p>}
            </div>
            {msg && <p className="rounded-md bg-muted/50 p-2 text-xs">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------- picker modal ------------------------------ */

/** Choose a picture: from the library, built-in site pictures, or upload a new one. */
export function MediaPickerModal({ onPick, onClose }: { onPick: (p: PickedImage) => void; onClose: () => void }) {
  const { assets, loading, error, reload } = useAssets()
  const [tab, setTab] = useState<'library' | 'builtin'>('library')
  const [query, setQuery] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const q = query.toLowerCase()

  async function upload(file: File | undefined) {
    if (!file) return
    setBusy(true); setMsg(null)
    const [asset] = await uploadMany([file], setMsg)
    setBusy(false)
    if (asset) onPick({ url: assetUrl(asset), alt: asset.alt ?? '', caption: asset.caption ?? '' })
    else await reload()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Choose a picture" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-background p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="mr-auto text-lg font-semibold">Choose a picture</h3>
          {(loading || busy) && <Loader2 className="size-4 animate-spin" />}
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            <Upload className="size-4" />Upload new
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = '' }} />
          </label>
          <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}><X className="size-4" /></Button>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <Button type="button" size="sm" variant={tab === 'library' ? 'default' : 'outline'} onClick={() => setTab('library')}>My library ({assets.length})</Button>
          <Button type="button" size="sm" variant={tab === 'builtin' ? 'default' : 'outline'} onClick={() => setTab('builtin')}>Built-in pictures ({builtin.length})</Button>
          <Input className="ml-auto h-9 w-40" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {(error || msg) && <p className="mb-2 text-sm text-destructive">{error ?? msg}</p>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tab === 'library' && assets.filter((a) => !q || `${a.file_name} ${a.alt}`.toLowerCase().includes(q)).map((a) => (
            <button type="button" key={a.id} onClick={() => onPick({ url: assetUrl(a), alt: a.alt ?? '', caption: a.caption ?? '' })} className="space-y-1 rounded-lg border p-1.5 text-left hover:border-primary">
              { }
              <img src={assetUrl(a)} alt={a.alt || a.file_name} className="aspect-video w-full rounded object-cover" loading="lazy" />
              <div className="truncate text-xs text-muted-foreground">{a.file_name}</div>
            </button>
          ))}
          {tab === 'builtin' && builtin.filter((b) => !q || b.name.toLowerCase().includes(q)).map((b) => (
            <button type="button" key={b.url} onClick={() => onPick({ url: b.url, alt: '', caption: '' })} className="space-y-1 rounded-lg border p-1.5 text-left hover:border-primary">
              { }
              <img src={withBase(b.url)} alt={b.name} className="aspect-video w-full rounded object-cover" loading="lazy" />
              <div className="truncate text-xs text-muted-foreground">{b.name}</div>
            </button>
          ))}
        </div>
        {tab === 'library' && !assets.length && !loading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><ImageOff className="size-4" />Library is empty — upload a picture.</p>}
      </div>
    </div>
  )
}
