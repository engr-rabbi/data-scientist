'use client'

import { useCallback, useEffect, useState } from 'react'
import { Copy, Download, ExternalLink, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { profile } from '@/config/profile'
import { adminCall } from '@/lib/admin-api'
import { fetchContentVersion } from '@/lib/api-client'

/* ------------------------------- helpers ---------------------------------- */

 
type Row = Record<string, any>
const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '—')
const dhaka = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function useLoader<T>(loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setData(await loader()) } catch (e) { setError((e as Error).message) }
    setLoading(false)
     
  }, [])
  useEffect(() => { void reload() }, [reload])
  return { data, loading, error, reload }
}

/** rows of one admin list (inquiries, messages, bookings, subscribers) */
const rowsOf = async (sheet: string): Promise<Row[]> => (await adminCall<{ rows: Row[] }>('list', { sheet })).rows
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e))

function download(filename: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function Shell({ title, hint, actions, loading, error, children }: {
  title: string; hint?: string; actions?: React.ReactNode; loading?: boolean; error?: string | null; children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
        <div className="flex items-center gap-2">{loading && <Loader2 className="size-4 animate-spin" />}{actions}</div>
      </header>
      {error && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {children}
    </section>
  )
}

const statusColor = (s: string) =>
  ({ new: 'default', proposed: 'default', confirmed: 'secondary', replied: 'secondary', won: 'secondary' }[s] ?? 'outline') as 'default' | 'secondary' | 'outline'

/* ------------------------------ dashboard --------------------------------- */

export function DashboardPanel({ goto }: { goto: (tab: string) => void }) {
  const { data: d, loading, error, reload } = useLoader<Row | null>(() => adminCall<Row>('dashboard'), null)
  const card = (label: string, value: number | undefined, tab?: string, accent = false) => (
    <button key={label} onClick={() => tab && goto(tab)} className={`rounded-xl border p-4 text-left transition hover:border-primary ${accent ? 'border-primary/60 bg-primary/5' : 'border-border/60'}`}>
      <div className="text-3xl font-bold">{value ?? '–'}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </button>
  )
  const max = Math.max(1, ...((d?.daily_events as Row[]) ?? []).map((x) => x.n))
  return (
    <Shell title="Dashboard" hint="Live numbers from your Google Sheet." loading={loading} error={error}
      actions={<Button variant="outline" size="sm" onClick={reload}><RefreshCw className="mr-1 size-4" />Refresh</Button>}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {card('New project inquiries', d?.new_inquiries, 'inquiries', (d?.new_inquiries ?? 0) > 0)}
        {card('New contact messages', d?.new_messages, 'messages', (d?.new_messages ?? 0) > 0)}
        {card('Calls awaiting confirmation', d?.proposed_bookings, 'bookings', (d?.proposed_bookings ?? 0) > 0)}
        {card('Upcoming calls', d?.upcoming_bookings, 'bookings')}
        {card('Total inquiries', d?.total_inquiries, 'inquiries')}
        {card('Total messages', d?.total_messages, 'messages')}
        {card('Newsletter subscribers', d?.subscribers, 'subscribers')}
        {card('Tracked events (30 days)', d?.events_30d)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border/60 p-4">
          <h3 className="mb-3 text-sm font-semibold">Events — last 14 days</h3>
          <div className="flex h-28 items-end gap-1">
            {((d?.daily_events as Row[]) ?? []).map((x) => (
              <div key={x.day} title={`${x.day}: ${x.n}`} className="flex-1 rounded-t bg-primary/70" style={{ height: `${(x.n / max) * 100}%` }} />
            ))}
            {!((d?.daily_events as Row[]) ?? []).length && <p className="text-sm text-muted-foreground">No data yet.</p>}
          </div>
        </div>
        <div className="rounded-xl border border-border/60 p-4">
          <h3 className="mb-3 text-sm font-semibold">FAQ feedback</h3>
          <p className="text-sm">👍 Helpful: <b>{d?.faq_helpful ?? 0}</b> &nbsp; 👎 Not helpful: <b>{d?.faq_unhelpful ?? 0}</b></p>
        </div>
        <div className="rounded-xl border border-border/60 p-4">
          <h3 className="mb-3 text-sm font-semibold">Top events</h3>
          {((d?.top_events as Row[]) ?? []).map((x) => <div key={x.event} className="flex justify-between text-sm"><span>{x.event}</span><b>{x.n}</b></div>)}
        </div>
        <div className="rounded-xl border border-border/60 p-4">
          <h3 className="mb-3 text-sm font-semibold">Top pages</h3>
          {((d?.top_paths as Row[]) ?? []).map((x) => <div key={x.path} className="flex justify-between text-sm"><span>{x.path}</span><b>{x.n}</b></div>)}
        </div>
      </div>
    </Shell>
  )
}

/* ------------------------------- inquiries -------------------------------- */

const INQUIRY_STATUSES = ['new', 'reviewing', 'replied', 'won', 'lost', 'archived']

export function InquiriesPanel() {
  const { data, loading, error, reload } = useLoader<Row[]>(
    () => rowsOf('inquiries'), [])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const rows = data.filter((r) => (filter === 'all' || r.status === filter) &&
    (!search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase())))

  async function update(id: string, patch: Row) {
    try { await adminCall('update', { sheet: 'inquiries', id, patch }); setMsg('Saved') } catch (e) { setMsg(`Error: ${errText(e)}`) }
    await reload()
  }
  /** Attachments live in a PRIVATE Drive folder: the link opens for you because you are signed in to the owning Google account. */
  function openFile(url: string) {
    if (!/^https:\/\/(drive|docs)\.google\.com\//.test(url)) return setMsg('Cannot open file: unexpected link.')
    window.open(url, '_blank', 'noopener')
  }
  async function remove(r: Row) {
    if (!confirm(`Delete the inquiry from ${r.name} and its files? This cannot be undone.`)) return
    try { await adminCall('remove', { sheet: 'inquiries', id: r.id }); setMsg('Deleted') } catch (e) { setMsg(`Error: ${errText(e)}`) }
    setOpen(null); await reload()
  }

  return (
    <Shell title="Project inquiries" hint='Submissions from the "Start a project" form.' loading={loading} error={error}
      actions={<>
        <select className="h-9 rounded-md border bg-background px-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>{INQUIRY_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <Input className="h-9 w-44" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button variant="outline" size="sm" onClick={reload}><RefreshCw className="size-4" /></Button>
      </>}>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      {!rows.length && !loading && <p className="text-sm text-muted-foreground">No inquiries.</p>}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-border/60">
            <button className="flex w-full flex-wrap items-center gap-3 p-3 text-left" onClick={() => setOpen(open === r.id ? null : r.id)}>
              <Badge variant={statusColor(r.status)}>{r.status}</Badge>
              <span className="font-medium">{r.project_title}</span>
              <span className="text-sm text-muted-foreground">{r.name}{r.company ? ` · ${r.company}` : ''} · {r.service_category}</span>
              {r.inquiry_attachments.length > 0 && <Badge variant="outline">📎 {r.inquiry_attachments.length}</Badge>}
              <span className="ml-auto text-xs text-muted-foreground">{fmt(r.created_at)}</span>
            </button>
            {open === r.id && (
              <div className="space-y-3 border-t border-border/60 p-4 text-sm">
                <dl className="grid gap-x-6 gap-y-2 md:grid-cols-2">
                  {[['Email', r.email], ['WhatsApp', r.whatsapp], ['Country', r.country], ['Preferred contact', r.contact_method],
                    ['Budget', r.budget_range], ['Deadline', r.deadline], ['Deliverable', r.deliverable]].map(([k, v]) =>
                    <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd>{v || '—'}</dd></div>)}
                </dl>
                <div><div className="text-xs text-muted-foreground">Description</div><p className="whitespace-pre-wrap">{r.description}</p></div>
                {r.business_goal && <div><div className="text-xs text-muted-foreground">Business goal</div><p className="whitespace-pre-wrap">{r.business_goal}</p></div>}
                {r.inquiry_attachments.length > 0 && (
                  <div className="space-y-1"><div className="text-xs text-muted-foreground">Attachments</div>
                    {(r.inquiry_attachments as Row[]).map((a) => (
                      <Button key={a.id} variant="outline" size="sm" className="mr-2" onClick={() => openFile(a.url)}>
                        <Download className="mr-1 size-4" />{a.file_name} ({(a.file_size / 1024).toFixed(0)} KB)
                      </Button>))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <select className="h-9 rounded-md border bg-background px-2" value={r.status} onChange={(e) => update(r.id, { status: e.target.value })}>
                    {INQUIRY_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <Button asChild variant="outline" size="sm"><a href={`mailto:${r.email}?subject=${encodeURIComponent('Re: ' + r.project_title)}`}>Reply by email</a></Button>
                  {r.whatsapp && <Button asChild variant="outline" size="sm"><a href={`https://wa.me/${String(r.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></Button>}
                  <Button variant="destructive" size="sm" className="ml-auto" onClick={() => remove(r)}><Trash2 className="mr-1 size-4" />Delete</Button>
                </div>
                <NotesBox initial={r.admin_notes ?? ''} onSave={(v) => update(r.id, { admin_notes: v })} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Shell>
  )
}

function NotesBox({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(initial)
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">Private notes (never shown to visitors)</div>
      <Textarea rows={3} value={v} onChange={(e) => setV(e.target.value)} />
      <Button size="sm" variant="outline" disabled={v === initial} onClick={() => onSave(v)}>Save notes</Button>
    </div>
  )
}

/* -------------------------------- messages -------------------------------- */

export function MessagesPanel() {
  const { data, loading, error, reload } = useLoader<Row[]>(
    () => rowsOf('messages'), [])
  const [filter, setFilter] = useState('all')
  const rows = data.filter((r) => filter === 'all' || r.status === filter)
  const setStatus = async (id: string, status: string) => { try { await adminCall('update', { sheet: 'messages', id, patch: { status } }) } catch (e) { alert(errText(e)) } await reload() }
  const del = async (id: string) => { if (confirm('Delete this message?')) { try { await adminCall('remove', { sheet: 'messages', id }) } catch (e) { alert(errText(e)) } await reload() } }
  return (
    <Shell title="Contact messages" hint="Messages from the contact form." loading={loading} error={error}
      actions={<select className="h-9 rounded-md border bg-background px-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All</option>{['new', 'read', 'replied', 'archived'].map((s) => <option key={s}>{s}</option>)}</select>}>
      {!rows.length && !loading && <p className="text-sm text-muted-foreground">No messages.</p>}
      {rows.map((r) => (
        <div key={r.id} className="space-y-2 rounded-xl border border-border/60 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusColor(r.status)}>{r.status}</Badge>
            <b>{r.name}</b><a className="text-primary underline" href={`mailto:${r.email}`}>{r.email}</a>
            <span className="ml-auto text-xs text-muted-foreground">{fmt(r.created_at)}</span>
          </div>
          {r.subject && <div className="font-medium">{r.subject}</div>}
          <p className="whitespace-pre-wrap">{r.message}</p>
          <div className="flex gap-2">
            {['read', 'replied', 'archived'].map((s) => <Button key={s} size="sm" variant="outline" disabled={r.status === s} onClick={() => setStatus(r.id, s)}>Mark {s}</Button>)}
            <Button size="sm" variant="destructive" className="ml-auto" onClick={() => del(r.id)}><Trash2 className="size-4" /></Button>
          </div>
        </div>
      ))}
    </Shell>
  )
}

/* -------------------------------- bookings -------------------------------- */

function icsFor(rows: Row[]) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => '\\' + m)
  const events = rows.map((b) => {
    const start = new Date(b.slot_utc); const end = new Date(start.getTime() + 30 * 60_000)
    return ['BEGIN:VEVENT', `UID:${b.id}@booking`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:${esc('Discovery call — ' + b.name)}`, `DESCRIPTION:${esc(`${b.agenda}\nEmail: ${b.email}${b.whatsapp ? '\nWhatsApp: ' + b.whatsapp : ''}`)}`,
      `STATUS:${b.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`, 'END:VEVENT'].join('\r\n')
  })
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Portfolio Admin//Bookings//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n')
}

export function BookingsPanel() {
  const { data, loading, error, reload } = useLoader<Row[]>(
    () => rowsOf('bookings'), [])
  const [filter, setFilter] = useState('active')
  const now = Date.now()
  const rows = data.filter((b) => filter === 'all' ? true : filter === 'active' ? ['proposed', 'confirmed'].includes(b.status) : b.status === filter)
  const setStatus = async (id: string, status: string) => { try { await adminCall('update', { sheet: 'bookings', id, patch: { status } }) } catch (e) { alert(errText(e)) } await reload() }
  const del = async (id: string) => { if (confirm('Delete this booking permanently?')) { try { await adminCall('remove', { sheet: 'bookings', id }) } catch (e) { alert(errText(e)) } await reload() } }
  const active = data.filter((b) => ['proposed', 'confirmed'].includes(b.status) && new Date(b.slot_utc).getTime() >= now)
  return (
    <Shell title="Call bookings" hint="Visitors propose a slot; you confirm or cancel it here. Times are shown in Dhaka time." loading={loading} error={error}
      actions={<>
        <select className="h-9 rounded-md border bg-background px-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="active">Proposed + confirmed</option>{['all', 'proposed', 'confirmed', 'cancelled', 'expired'].map((s) => <option key={s}>{s}</option>)}</select>
        <Button variant="outline" size="sm" disabled={!active.length} onClick={() => download('bookings.ics', icsFor(active), 'text/calendar')}><Download className="mr-1 size-4" />Calendar (.ics)</Button>
      </>}>
      {!rows.length && !loading && <p className="text-sm text-muted-foreground">No bookings.</p>}
      {rows.map((b) => (
        <div key={b.id} className="space-y-2 rounded-xl border border-border/60 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusColor(b.status)}>{b.status}</Badge>
            <b>{dhaka(b.slot_utc)}</b><span className="text-muted-foreground">(Dhaka){b.tz_name ? ` · visitor: ${b.tz_name}` : ''}</span>
            <span className="ml-auto text-xs text-muted-foreground">ref {b.id}</span>
          </div>
          <div>{b.name} · <a className="text-primary underline" href={`mailto:${b.email}`}>{b.email}</a>{b.whatsapp ? ` · ${b.whatsapp}` : ''}</div>
          <p className="whitespace-pre-wrap text-muted-foreground">{b.agenda}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={b.status === 'confirmed'} onClick={() => setStatus(b.id, 'confirmed')}>Confirm</Button>
            <Button size="sm" variant="outline" disabled={b.status === 'cancelled'} onClick={() => setStatus(b.id, 'cancelled')}>Cancel</Button>
            <Button size="sm" variant="outline" onClick={() => download(`call-${b.id.slice(0, 8)}.ics`, icsFor([b]), 'text/calendar')}>.ics</Button>
            <Button size="sm" variant="destructive" className="ml-auto" onClick={() => del(b.id)}><Trash2 className="size-4" /></Button>
          </div>
        </div>
      ))}
    </Shell>
  )
}

/* ------------------------------- subscribers ------------------------------ */

export function SubscribersPanel() {
  const { data, loading, error, reload } = useLoader<Row[]>(
    () => rowsOf('subscribers'), [])
  const toggle = async (r: Row) => { try { await adminCall('update', { sheet: 'subscribers', id: r.id, patch: { active: !r.active } }) } catch (e) { alert(errText(e)) } await reload() }
  const del = async (r: Row) => { if (confirm(`Remove ${r.email}?`)) { try { await adminCall('remove', { sheet: 'subscribers', id: r.id }) } catch (e) { alert(errText(e)) } await reload() } }
  const csv = () => download('subscribers.csv', ['email,source,active,subscribed_at', ...data.map((r) => `${r.email},${r.source},${r.active},${r.created_at}`)].join('\n'), 'text/csv')
  return (
    <Shell title="Newsletter subscribers" hint={`${data.filter((r) => r.active).length} active of ${data.length}`} loading={loading} error={error}
      actions={<Button variant="outline" size="sm" disabled={!data.length} onClick={csv}><Download className="mr-1 size-4" />Export CSV</Button>}>
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-2">Email</th><th>Source</th><th>Subscribed</th><th>Active</th><th /></tr></thead>
          <tbody>{data.map((r) => (
            <tr key={r.id} className="border-t border-border/60">
              <td className="p-2">{r.email}</td><td>{r.source}</td><td>{fmt(r.created_at)}</td>
              <td><input type="checkbox" checked={r.active} onChange={() => toggle(r)} /></td>
              <td><Button size="icon" variant="ghost" onClick={() => del(r)}><Trash2 className="size-4 text-destructive" /></Button></td>
            </tr>))}</tbody>
        </table>
        {!data.length && !loading && <p className="p-4 text-sm text-muted-foreground">No subscribers yet.</p>}
      </div>
    </Shell>
  )
}

/* --------------------------------- publish -------------------------------- */

const GH_KEY = 'admin.github'

export function PublishPanel() {
  const [state, setState] = useState<{ db?: string; live?: string; err?: string }>({})
  const [gh, setGh] = useState({ repo: '', token: '', workflow: 'deploy.yml', ref: 'main' })
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    try { const s = localStorage.getItem(GH_KEY); if (s) setGh((g) => ({ ...g, ...JSON.parse(s) })) } catch { /* ignore */ }
    void check()
     
  }, [])

  async function check() {
    try {
      const db = await fetchContentVersion()
      let live = 'unknown'
      try { const r = await fetch(`${profile.siteUrl}/content-version.json?ts=${Date.now()}`); if (r.ok) live = (await r.json()).version } catch { /* cross-origin or offline */ }
      setState({ db, live })
    } catch (e) { setState({ err: (e as Error).message }) }
  }
  const saveGh = (next: typeof gh) => { setGh(next); try { localStorage.setItem(GH_KEY, JSON.stringify(next)) } catch { /* ignore */ } }

  async function publish() {
    setMsg('Triggering build…')
    try {
      const r = await fetch(`https://api.github.com/repos/${gh.repo}/actions/workflows/${gh.workflow}/dispatches`, {
        method: 'POST',
        headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${gh.token}`, 'X-GitHub-Api-Version': '2022-11-28' },
        body: JSON.stringify({ ref: gh.ref }),
      })
      setMsg(r.status === 204 ? '✔ Build started. The live site updates in about 2–4 minutes.' : `GitHub answered ${r.status}: ${(await r.text()).slice(0, 200)}`)
    } catch (e) { setMsg(`Request failed: ${(e as Error).message}`) }
  }

  const pending = state.db && state.live && state.db !== state.live
  return (
    <Shell title="Publish to the live site" hint="Content edits are saved in your Google Sheet immediately. The public site is static, so it is rebuilt to show them (this keeps it fast and SEO-friendly)."
      actions={<Button variant="outline" size="sm" onClick={check}><RefreshCw className="mr-1 size-4" />Check</Button>} error={state.err}>
      <div className={`rounded-xl border p-4 text-sm ${pending ? 'border-amber-500/50 bg-amber-500/10' : 'border-border/60'}`}>
        {pending ? <b>⚠ There are saved changes that are not on the live site yet.</b> : state.live === 'unknown' ? <b>Could not read the live version.</b> : <b>✔ The live site is up to date.</b>}
        <div className="mt-1 text-xs text-muted-foreground">database: {state.db ?? '…'} · live: {state.live ?? '…'}</div>
      </div>
      <div className="rounded-xl border border-border/60 p-4 text-sm">
        <h3 className="font-semibold">Automatic</h3>
        <p className="text-muted-foreground">A GitHub Action checks every 30 minutes and rebuilds the site only when content changed. Nothing to do.</p>
      </div>
      <div className="space-y-3 rounded-xl border border-border/60 p-4 text-sm">
        <h3 className="font-semibold">Instant (optional)</h3>
        <p className="text-muted-foreground">
          Create a <b>fine-grained GitHub token</b> limited to this one repository with only <b>Actions: Read and write</b>. It is stored only in this browser (localStorage) and sent only to api.github.com.
          Or simply open <i>GitHub → Actions → “Deploy site” → Run workflow</i>.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          <Input placeholder="owner/repository" value={gh.repo} onChange={(e) => saveGh({ ...gh, repo: e.target.value.trim() })} />
          <Input placeholder="branch (main)" value={gh.ref} onChange={(e) => saveGh({ ...gh, ref: e.target.value.trim() })} />
          <Input className="md:col-span-2" type="password" placeholder="GitHub token (github_pat_…)" value={gh.token} onChange={(e) => saveGh({ ...gh, token: e.target.value.trim() })} />
        </div>
        <div className="flex items-center gap-2">
          <Button disabled={!gh.repo || !gh.token} onClick={publish}>Publish now</Button>
          {gh.repo && <Button asChild variant="outline"><a href={`https://github.com/${gh.repo}/actions`} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 size-4" />Open Actions</a></Button>}
          <Button variant="ghost" onClick={() => { saveGh({ ...gh, token: '' }); setMsg('Token removed from this browser.') }}>Forget token</Button>
        </div>
        {msg && <p>{msg}</p>}
      </div>
    </Shell>
  )
}
